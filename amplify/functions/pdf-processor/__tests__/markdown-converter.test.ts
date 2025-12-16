import { describe, expect, it } from 'bun:test';

// Test the markdown converter functions
describe('Markdown Converter', () => {
  describe('extractMetadata', () => {
    const extractMetadata = (content: string) => {
      const titleMatch = content.match(/^#\s+(.+?)$/m);
      const versionMatch = content.match(/\*\*Version\s+(.+?)\*\*/);
      const clientMatch = content.match(/\*\*Client:\*\*\s*(.+?)$/m);
      const dateMatch = content.match(/\*\*Date:\*\*\s*(.+?)$/m);
      const dateStr = dateMatch
        ? dateMatch[1].trim()
        : new Date().toISOString().split('T')[0];

      return {
        title: titleMatch ? titleMatch[1].trim() : 'Document',
        version: versionMatch ? versionMatch[1].trim() : '1.0',
        clientName: clientMatch ? clientMatch[1].trim() : '',
        dateStr,
      };
    };

    it('should extract title from H1 heading', () => {
      const content = '# My Document Title\n\nSome content';
      const metadata = extractMetadata(content);
      expect(metadata.title).toBe('My Document Title');
    });

    it('should extract version from **Version X.X** pattern', () => {
      const content = '# Title\n\n**Version 2.5**\n\nContent';
      const metadata = extractMetadata(content);
      expect(metadata.version).toBe('2.5');
    });

    it('should extract client name', () => {
      const content = '# Title\n\n**Client:** ACME Corp\n\nContent';
      const metadata = extractMetadata(content);
      expect(metadata.clientName).toBe('ACME Corp');
    });

    it('should use default title if no H1 found', () => {
      const content = 'No heading here';
      const metadata = extractMetadata(content);
      expect(metadata.title).toBe('Document');
    });

    it('should use default version if not found', () => {
      const content = '# Title\n\nNo version here';
      const metadata = extractMetadata(content);
      expect(metadata.version).toBe('1.0');
    });
  });

  describe('buildPdfFilename', () => {
    const buildPdfFilename = (
      metadata: { dateStr: string; clientName: string },
      originalFilename: string
    ): string => {
      let filename = '';

      if (metadata.dateStr) {
        filename += metadata.dateStr + ' ';
      }

      filename += 'SMEC AI Statement of Advice';

      if (metadata.clientName) {
        filename += ' - ' + metadata.clientName;
      }

      filename += '.pdf';
      return filename.replace(/[/\\?%*:|"<>]/g, '-');
    };

    it('should include date in filename', () => {
      const metadata = { dateStr: '2025-12-16', clientName: '' };
      const filename = buildPdfFilename(metadata, 'test.md');
      expect(filename).toContain('2025-12-16');
    });

    it('should include client name in filename', () => {
      const metadata = { dateStr: '', clientName: 'ACME Corp' };
      const filename = buildPdfFilename(metadata, 'test.md');
      expect(filename).toContain('ACME Corp');
    });

    it('should sanitize invalid characters', () => {
      const metadata = { dateStr: '', clientName: 'Test/Client' };
      const filename = buildPdfFilename(metadata, 'test.md');
      expect(filename).not.toContain('/');
    });

    it('should end with .pdf extension', () => {
      const metadata = { dateStr: '', clientName: '' };
      const filename = buildPdfFilename(metadata, 'test.md');
      expect(filename).toMatch(/\.pdf$/);
    });
  });
});

describe('Input Validation', () => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const validateInput = (content: string, fileSize: number | null): string | null => {
    if (!content.trim()) {
      return 'No markdown content provided';
    }

    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    if (content.length > MAX_FILE_SIZE) {
      return `Content too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    return null;
  };

  it('should reject empty content', () => {
    const error = validateInput('', null);
    expect(error).toBe('No markdown content provided');
  });

  it('should reject whitespace-only content', () => {
    const error = validateInput('   \n\t  ', null);
    expect(error).toBe('No markdown content provided');
  });

  it('should accept valid content', () => {
    const error = validateInput('# Valid content', null);
    expect(error).toBeNull();
  });

  it('should reject files larger than 10MB', () => {
    const error = validateInput('content', 11 * 1024 * 1024);
    expect(error).toContain('File too large');
  });

  it('should accept files under 10MB', () => {
    const error = validateInput('content', 1024);
    expect(error).toBeNull();
  });
});
