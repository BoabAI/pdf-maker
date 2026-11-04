import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import sanitizeHtml from 'sanitize-html';

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Configure markdown-it with syntax highlighting
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>';
      } catch {
        // Fall through to default
      }
    }
    return '<pre class="hljs"><code>' + escapeHtml(str) + '</code></pre>';
  },
});

export interface DocumentMetadata {
  title: string;
  version: string;
  clientName: string;
  dateStr: string;
}

/**
 * Allowlist for the HTML that reaches headless Chromium. Uploaded markdown is
 * untrusted (raw HTML is enabled in markdown-it), so anything able to run
 * script, load a remote/local resource or change the document base is removed.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img', 'del', 's', 'ins', 'sup', 'sub', 'details', 'summary',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    th: ['style', 'colspan', 'rowspan'],
    td: ['style', 'colspan', 'rowspan'],
    ol: ['start'],
    '*': ['id'],
  },
  allowedClasses: {
    '*': ['hljs', /^hljs-/, /^language-/, 'class_', 'function_'],
  },
  // markdown-it emits text-align for table column alignment
  allowedStyles: {
    th: { 'text-align': [/^(left|right|center)$/] },
    td: { 'text-align': [/^(left|right|center)$/] },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Images may only be inline data URIs; remote and file: URLs are dropped
  allowedSchemesByTag: { img: ['data'] },
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
};

/**
 * Sanitise rendered HTML so it is safe to load in the PDF renderer
 */
export function sanitizeRenderedHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/**
 * Convert markdown content to styled, sanitised HTML
 */
export function convertMarkdownToHtml(markdown: string): string {
  return sanitizeRenderedHtml(md.render(markdown));
}

/**
 * Extract metadata from markdown document content
 */
export function extractMetadata(content: string): DocumentMetadata {
  // Extract title from first H1 heading
  const titleMatch = content.match(/^#\s+(.+?)$/m);

  // Extract version from **Version X.X** pattern
  const versionMatch = content.match(/\*\*Version\s+(.+?)\*\*/);

  // Extract client name - try multiple patterns
  let clientName = '';
  const clientPatterns = [
    /\|\s*\*\*Prepared For\*\*\s*\|\s*([^\n<|]+)/,      // | **Prepared For** | Name |
    /\|\s*\*\*Client\*\*\s*\|\s*([^\n<|]+)/,            // | **Client** | Name |
    /\*\*Client:\*\*\s*(.+?)$/m,                        // **Client:** Name
    /Prepared [Ff]or:?\s*\*?\*?([A-Z][a-zA-Z\s']+)/,    // Prepared for: Name
  ];
  for (const pattern of clientPatterns) {
    const match = content.match(pattern);
    if (match) {
      clientName = match[1].trim().replace(/\*+/g, '').replace(/<[^>]+>/g, '').trim();
      break;
    }
  }

  // Extract date - try multiple patterns
  let dateStr = '';
  const datePatterns = [
    /\|\s*\*\*Documentation Date\*\*\s*\|\s*([^\n|]+)/,  // | **Documentation Date** | Date |
    /\|\s*\*\*Date\*\*\s*\|\s*([^\n|]+)/,               // | **Date** | Date |
    /\*\*Date:\*\*\s*(.+?)$/m,                          // **Date:** Date
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      const dateText = match[1].trim();
      // Try "December 15, 2025" format
      const fullMatch = dateText.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
      if (fullMatch) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = months.indexOf(fullMatch[1]);
        if (monthIndex !== -1) {
          dateStr = `${fullMatch[3]}-${(monthIndex + 1).toString().padStart(2, '0')}-${fullMatch[2].padStart(2, '0')}`;
          break;
        }
      }
      // Try "December 2025" format (use 15th as default day)
      const monthYearMatch = dateText.match(/(\w+)\s+(\d{4})/);
      if (monthYearMatch) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = months.indexOf(monthYearMatch[1]);
        if (monthIndex !== -1) {
          dateStr = `${monthYearMatch[2]}-${(monthIndex + 1).toString().padStart(2, '0')}-15`;
          break;
        }
      }
    }
  }

  // Default to today's date if nothing found
  if (!dateStr) {
    dateStr = new Date().toISOString().split('T')[0];
  }

  return {
    title: titleMatch ? titleMatch[1].trim() : 'Document',
    version: versionMatch ? versionMatch[1].trim() : '1.0',
    clientName,
    dateStr,
  };
}
