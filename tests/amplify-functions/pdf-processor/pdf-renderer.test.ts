import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { hardenPage, renderPdf } from '../../../amplify/functions/pdf-processor/pdf-renderer';

/**
 * Integration tests for the hardened PDF renderer using a locally installed
 * Chrome (set PDF_TEST_CHROME to override). Skipped if no Chrome is found.
 */
const functionRequire = createRequire(
  join(import.meta.dir, '../../../amplify/functions/pdf-processor/package.json')
);
type Browser = Parameters<typeof renderPdf>[0];
interface PuppeteerLauncher {
  launch(options: { executablePath: string; headless: boolean }): Promise<Browser>;
}
const puppeteer = functionRequire('puppeteer-core') as PuppeteerLauncher;

function findChrome(): string | undefined {
  if (process.env.PDF_TEST_CHROME) return process.env.PDF_TEST_CHROME;
  const shellRoot = join(homedir(), '.cache/puppeteer/chrome-headless-shell');
  if (existsSync(shellRoot)) {
    for (const version of readdirSync(shellRoot).sort().reverse()) {
      const candidate = join(shellRoot, version, 'chrome-headless-shell-mac-arm64/chrome-headless-shell');
      if (existsSync(candidate)) return candidate;
    }
  }
  const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return existsSync(systemChrome) ? systemChrome : undefined;
}

const chromePath = findChrome();
const LOCAL_PNG = join(import.meta.dir, '../../../public/smec-logo.png');
const hits: string[] = [];
let server: ReturnType<typeof Bun.serve> | undefined;
let browser: Browser | undefined;
let base = '';

beforeAll(async () => {
  if (!chromePath) return;
  server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    fetch(req) {
      hits.push(new URL(req.url).pathname);
      return new Response('x', { headers: { 'content-type': 'text/css' } });
    },
  });
  base = `http://127.0.0.1:${server.port}`;
  browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
});

afterAll(async () => {
  await browser?.close();
  server?.stop(true);
});

const maliciousHtml = () => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="${base}/link.css">
  <style>body { background: url(${base}/css-bg); }</style>
</head><body>
  <h1 id="h">original</h1>
  <img src="${base}/img.png">
  <img id="local" src="file://${LOCAL_PNG}">
  <iframe src="file:///etc/passwd"></iframe>
  <iframe src="${base}/iframe"></iframe>
  <script>document.getElementById('h').textContent = 'js-ran'; new Image().src = '${base}/js';</script>
</body></html>`;

describe.skipIf(!chromePath)('renderPdf hardening (P-2)', () => {
  it('control: an unhardened page does load remote resources and run script', async () => {
    hits.length = 0;
    const page = await browser!.newPage();
    await page.setContent(maliciousHtml(), { waitUntil: 'networkidle0' });
    const heading = await page.$eval('#h', (el) => el.textContent);
    await page.close();
    expect(heading).toBe('js-ran');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('hardened page does not execute JavaScript', async () => {
    const page = await browser!.newPage();
    await hardenPage(page);
    await page.setContent(maliciousHtml(), { waitUntil: 'load' });
    const heading = await page.$eval('#h', (el) => el.textContent);
    await page.close();
    expect(heading).toBe('original');
  });

  it('hardened page aborts http and file requests', async () => {
    hits.length = 0;
    const blocked: string[] = [];
    const page = await browser!.newPage();
    await hardenPage(page);
    page.on('requestfailed', (r) => blocked.push(r.url()));
    await page.setContent(maliciousHtml(), { waitUntil: 'load' });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const localImageWidth = await page.$eval('#local', (el) => (el as HTMLImageElement).naturalWidth);
    await page.close();
    expect(hits).toEqual([]);
    expect(blocked.some((u) => u.startsWith(base))).toBe(true);
    // A real local file must not be readable from the document
    expect(localImageWidth).toBe(0);
  });

  it('renderPdf produces a PDF without any outbound request', async () => {
    hits.length = 0;
    const pdf = await renderPdf(browser!, maliciousHtml(), '<div></div>');
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-');
    expect(hits).toEqual([]);
  });
});
