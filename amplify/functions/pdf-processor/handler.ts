import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { S3Event, Handler } from 'aws-lambda';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { convertMarkdownToHtml, extractMetadata } from './markdown-converter';
import { buildFullHtml, buildFooterTemplate, buildPdfFilename } from './styles/smec-ai';

const s3 = new S3Client({});

/**
 * Update processing status in S3
 */
async function updateStatus(
  bucket: string,
  entityId: string,
  filename: string,
  status: 'processing' | 'complete' | 'error',
  pdfKey?: string,
  errorMessage?: string
): Promise<void> {
  const statusKey = `status/${entityId}/${filename.replace('.md', '.json')}`;
  const statusData = {
    status,
    updatedAt: new Date().toISOString(),
    ...(pdfKey && { pdfKey }),
    ...(errorMessage && { error: errorMessage }),
  };

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: statusKey,
    Body: JSON.stringify(statusData),
    ContentType: 'application/json',
  }));
}

/**
 * Main Lambda handler for PDF generation
 */
export const handler: Handler<S3Event> = async (event) => {
  let browser = null;

  try {
    // Parse S3 event
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // Extract user ID from path (uploads/{entity_id}/filename.md)
    const pathParts = key.split('/');
    const entityId = pathParts[1];
    const filename = pathParts[pathParts.length - 1];

    console.log(`Processing: ${key}`);

    // Update status: processing
    await updateStatus(bucket, entityId, filename, 'processing');

    // Get markdown from S3
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const { Body } = await s3.send(getCommand);

    if (!Body) {
      throw new Error('Failed to retrieve markdown content from S3');
    }

    const markdownContent = await Body.transformToString();

    // Parse metadata from markdown
    const metadata = extractMetadata(markdownContent);

    // Convert markdown to styled HTML
    const htmlContent = convertMarkdownToHtml(markdownContent);
    const fullHtml = buildFullHtml(htmlContent, metadata);

    // Launch browser
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 2 });
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: buildFooterTemplate(metadata),
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.75in',
        left: '0.5in',
      },
    });

    // Build output filename
    const pdfFilename = buildPdfFilename(metadata, filename);
    const pdfKey = `generated/${entityId}/${pdfFilename}`;

    // Upload PDF to S3
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: pdfKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }));

    // Update status: complete
    await updateStatus(bucket, entityId, filename, 'complete', pdfKey);

    console.log(`Successfully generated: ${pdfKey}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ pdfKey }),
    };

  } catch (error) {
    console.error('PDF generation failed:', error);

    // Update status: error
    if (event.Records?.[0]) {
      const key = decodeURIComponent(event.Records[0].s3.object.key);
      const pathParts = key.split('/');
      const entityId = pathParts[1];
      const filename = pathParts[pathParts.length - 1];

      await updateStatus(
        event.Records[0].s3.bucket.name,
        entityId,
        filename,
        'error',
        undefined,
        (error as Error).message
      );
    }

    throw error;

  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
