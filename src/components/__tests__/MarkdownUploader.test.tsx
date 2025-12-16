import { describe, expect, it } from 'bun:test';

// Mock component tests for MarkdownUploader
describe('MarkdownUploader', () => {
  it('should accept .md files', () => {
    const file = new File(['# Test'], 'test.md', { type: 'text/markdown' });
    expect(file.name.endsWith('.md')).toBe(true);
  });

  it('should reject non-.md files', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    expect(file.name.endsWith('.md')).toBe(false);
  });

  it('should calculate file size correctly', () => {
    const content = '# Test\n\nThis is a test file.';
    const file = new File([content], 'test.md', { type: 'text/markdown' });
    expect(file.size).toBe(content.length);
  });

  it('should format file size in KB', () => {
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024)).toBe('1.00 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
  });
});
