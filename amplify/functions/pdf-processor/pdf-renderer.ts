import type { Browser, HTTPRequest, Page } from 'puppeteer-core';

/**
 * Only inline resources may load while rendering. Everything else (http(s),
 * file://, ws, etc.) is aborted so an uploaded document cannot read local
 * files such as /proc/self/environ or reach the network.
 */
export function isAllowedRequestUrl(url: string): boolean {
  return url.startsWith('data:') || url === 'about:blank';
}

function handleRequest(request: HTTPRequest): void {
  if (isAllowedRequestUrl(request.url())) {
    void request.continue();
    return;
  }
  console.warn(`Blocked renderer request: ${request.url().slice(0, 200)}`);
  void request.abort('blockedbyclient');
}

/**
 * Disable JavaScript and block every request that is not inline content.
 * Must be called before any content is loaded into the page.
 */
export async function hardenPage(page: Page): Promise<void> {
  await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', handleRequest);
}

/**
 * Render a full HTML document to an A4 PDF with JavaScript disabled and all
 * non-inline requests blocked.
 */
export async function renderPdf(
  browser: Browser,
  html: string,
  footerTemplate: string
): Promise<Uint8Array> {
  const page = await browser.newPage();
  try {
    await hardenPage(page);

    await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load' });

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.75in',
        left: '0.5in',
      },
    });
  } finally {
    await page.close();
  }
}
