import { describe, expect, it } from 'bun:test';
import { convertMarkdownToHtml } from '../../../amplify/functions/pdf-processor/markdown-converter';
import { buildFullHtml } from '../../../amplify/functions/pdf-processor/styles/smec-ai';
import { isAllowedRequestUrl } from '../../../amplify/functions/pdf-processor/pdf-renderer';

const MALICIOUS_MARKDOWN = [
  '# Report',
  '<script>fetch("http://169.254.169.254/")</script>',
  '<img src="file:///proc/self/environ">',
  '<img src="http://attacker.example/beacon.png">',
  '<img src="//attacker.example/x.png">',
  '<img src="data:image/png;base64,AAAA" onerror="alert(1)">',
  '<iframe src="file:///etc/passwd"></iframe>',
  '<object data="file:///etc/passwd"></object>',
  '<embed src="http://attacker.example/">',
  '<link rel="stylesheet" href="http://attacker.example/x.css">',
  '<style>body { background: url(http://attacker.example/css) }</style>',
  '<base href="http://attacker.example/">',
  '<meta http-equiv="refresh" content="0;url=file:///etc/passwd">',
  '<svg><script>alert(1)</script></svg>',
  '<a href="javascript:alert(1)">click</a>',
  '<div style="background:url(http://attacker.example/s)">styled</div>',
  '<form action="http://attacker.example/"><input name="x"></form>',
  '[md link](javascript:alert(1))',
  '![md image](http://attacker.example/md.png)',
].join('\n\n');

describe('convertMarkdownToHtml sanitisation (P-2)', () => {
  const html = convertMarkdownToHtml(MALICIOUS_MARKDOWN).toLowerCase();

  it.each([
    '<script', '<iframe', '<object', '<embed', '<link', '<style', '<base',
    '<meta', '<svg', '<form', '<input',
  ])('removes %s elements', (tag) => {
    expect(html).not.toContain(tag);
  });

  it('removes event handler attributes', () => {
    expect(html).not.toMatch(/\son\w+=/);
  });

  it('removes javascript:, file: and remote image URLs', () => {
    // markdown-it leaves a refused link as inert text, so check attributes only
    expect(html).not.toMatch(/(href|src)="(javascript|file):/);
    expect(html).not.toContain('file:');
    expect(html).not.toContain('attacker.example');
    expect(html).not.toContain('169.254.169.254');
  });

  it('removes inline style attributes outside table alignment', () => {
    expect(html).not.toContain('style=');
  });

  it('keeps inline data: images', () => {
    expect(html).toContain('src="data:image/png;base64,aaaa"');
  });
});

describe('convertMarkdownToHtml keeps normal formatting', () => {
  it('keeps headings, emphasis, lists and links', () => {
    const html = convertMarkdownToHtml(
      '# Title\n\n**bold** *it* ~~gone~~\n\n- one\n- two\n\n[site](https://example.com)'
    );
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>it</em>');
    expect(html).toContain('<s>gone</s>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<a href="https://example.com">site</a>');
  });

  it('keeps table column alignment', () => {
    const html = convertMarkdownToHtml('| a | b |\n|:-:|--:|\n| 1 | 2 |');
    expect(html).toContain('<th style="text-align:center">a</th>');
    expect(html).toContain('<td style="text-align:right">2</td>');
  });

  it('keeps highlight.js classes on code blocks', () => {
    const html = convertMarkdownToHtml('```js\nconst x = 1;\n```');
    expect(html).toContain('<pre class="hljs">');
    expect(html).toContain('class="hljs-keyword"');
  });

  it('keeps simple inline HTML such as <br>', () => {
    expect(convertMarkdownToHtml('a<br>b')).toContain('<br />');
  });
});

describe('buildFullHtml (P-2)', () => {
  const metadata = {
    title: 'x</title><script>alert(1)</script>',
    version: '1.0',
    clientName: '',
    dateStr: '2026-01-01',
  };
  const html = buildFullHtml('<p>body</p>', metadata);

  it('escapes the document title', () => {
    expect(html).toContain('<title>x&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>');
    expect(html).not.toContain('<script>');
  });

  it('references no external resources', () => {
    expect(html).not.toMatch(/(href|src)="(https?:)?\/\//);
    expect(html).toContain('.hljs{');
  });
});

describe('isAllowedRequestUrl (P-2)', () => {
  it.each(['data:image/png;base64,AAAA', 'about:blank'])('allows %s', (url) => {
    expect(isAllowedRequestUrl(url)).toBe(true);
  });

  it.each([
    'file:///proc/self/environ',
    'http://169.254.169.254/latest/meta-data/',
    'https://cdnjs.cloudflare.com/x.css',
    'ws://127.0.0.1:9222/',
    'about:srcdoc',
    'chrome://version',
    ' data:text/html,x',
  ])('blocks %s', (url) => {
    expect(isAllowedRequestUrl(url)).toBe(false);
  });
});
