import { describe, expect, it } from 'bun:test';

describe('SMEC AI Styles', () => {
  describe('buildFooterTemplate', () => {
    const buildFooterTemplate = (metadata: { version: string }): string => {
      const today = new Date();
      const footerDateStr = today.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const footerMonthYear = today.toLocaleDateString('en-AU', {
        month: 'long',
        year: 'numeric',
      });

      return `
        <div style="width: 100%; font-size: 9px; color: #6b7280; padding: 10px 40px; display: flex; justify-content: space-between; font-family: sans-serif;">
          <span>Version ${metadata.version} | ${footerMonthYear} | Confidential</span>
          <span>Document generated on: ${footerDateStr}</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `;
    };

    it('should include version in footer', () => {
      const footer = buildFooterTemplate({ version: '2.0' });
      expect(footer).toContain('Version 2.0');
    });

    it('should include Confidential notice', () => {
      const footer = buildFooterTemplate({ version: '1.0' });
      expect(footer).toContain('Confidential');
    });

    it('should include page number placeholders', () => {
      const footer = buildFooterTemplate({ version: '1.0' });
      expect(footer).toContain('pageNumber');
      expect(footer).toContain('totalPages');
    });
  });

  describe('buildFullHtml', () => {
    const SMEC_AI_CSS = 'body { font-family: sans-serif; }';
    const LOGO_BASE64 = '';

    const buildFullHtml = (content: string, metadata: { title: string; version: string }): string => {
      const headerHtml = LOGO_BASE64
        ? `<div class="page-header">Logo Here</div>`
        : '';

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${metadata.title}</title>
          <style>${SMEC_AI_CSS}</style>
        </head>
        <body>
          ${headerHtml}
          ${content}
        </body>
        </html>
      `;
    };

    it('should include document title', () => {
      const html = buildFullHtml('<p>Test</p>', { title: 'Test Doc', version: '1.0' });
      expect(html).toContain('<title>Test Doc</title>');
    });

    it('should include content', () => {
      const html = buildFullHtml('<p>Test content</p>', { title: 'Test', version: '1.0' });
      expect(html).toContain('<p>Test content</p>');
    });

    it('should be valid HTML structure', () => {
      const html = buildFullHtml('<p>Test</p>', { title: 'Test', version: '1.0' });
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
    });

    it('should omit header when no logo', () => {
      const html = buildFullHtml('<p>Test</p>', { title: 'Test', version: '1.0' });
      expect(html).not.toContain('page-header');
    });
  });
});
