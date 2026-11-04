import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { S3Event, Handler } from 'aws-lambda';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

// Chromium binary URL matching @sparticuz/chromium-min v131
const CHROMIUM_PACK_URL = 'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar';
import { convertMarkdownToHtml, extractMetadata } from './markdown-converter';
import { buildFullHtml, buildFooterTemplate, buildPdfFilename } from './styles/smec-ai';
import { renderPdf } from './pdf-renderer';
import { buildGeneratedKey, buildStatusKey, decodeS3EventKey, parseUploadKey } from './s3-keys';

const s3 = new S3Client({});

/**
 * Update processing status in S3
 */
async function updateStatus(
  bucket: string,
  statusKey: string,
  status: 'processing' | 'complete' | 'error',
  pdfKey?: string,
  errorMessage?: string
): Promise<void> {
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
  let statusKey: string | null = null;
  const record = event.Records?.[0];

  try {
    if (!record) {
      throw new Error('No S3 record in event');
    }
    const bucket = record.s3.bucket.name;
    const key = decodeS3EventKey(record.s3.object.key);

    // Only uploads/<identityId>/<name>.md is processed; outputs go under the same identity
    const upload = parseUploadKey(key);
    if (!upload) {
      console.warn(`Ignoring object with unexpected key layout: ${key.slice(0, 300)}`);
      return { statusCode: 400, body: JSON.stringify({ error: 'Unexpected key layout' }) };
    }
    const { identityId, filename } = upload;
    statusKey = buildStatusKey(identityId, filename);

    console.log(`Processing: ${key}`);

    // Update status: processing
    await updateStatus(bucket, statusKey, 'processing');

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

    // Launch browser with chromium downloaded from GitHub releases
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: chromium.headless,
    });

    // Render with JavaScript disabled and all non-inline requests blocked
    const pdfBuffer = await renderPdf(browser, fullHtml, buildFooterTemplate(metadata));

    // Build output filename
    const pdfFilename = buildPdfFilename(metadata, filename);
    const pdfKey = buildGeneratedKey(identityId, pdfFilename);

    // Upload PDF to S3
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: pdfKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }));

    // Update status: complete
    await updateStatus(bucket, statusKey, 'complete', pdfKey);

    console.log(`Successfully generated: ${pdfKey}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ pdfKey }),
    };

  } catch (error) {
    console.error('PDF generation failed:', error);

    // Update status: error
    if (record && statusKey) {
      await updateStatus(
        record.s3.bucket.name,
        statusKey,
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
