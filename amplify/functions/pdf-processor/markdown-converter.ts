import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

// Configure markdown-it with syntax highlighting
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>';
      } catch {
        // Fall through to default
      }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  },
});

export interface DocumentMetadata {
  title: string;
  version: string;
  clientName: string;
  dateStr: string;
}

/**
 * Convert markdown content to styled HTML
 */
export function convertMarkdownToHtml(markdown: string): string {
  return md.render(markdown);
}

/**
 * Extract metadata from markdown document content
 */
export function extractMetadata(content: string): DocumentMetadata {
  // Extract title from first H1 heading
  const titleMatch = content.match(/^#\s+(.+?)$/m);

  // Extract version from **Version X.X** pattern
  const versionMatch = content.match(/\*\*Version\s+(.+?)\*\*/);

  // Extract client name from **Client:** pattern
  const clientMatch = content.match(/\*\*Client:\*\*\s*(.+?)$/m);

  // Extract date from **Date:** pattern or use current date
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
}
