import { DocumentMetadata } from '../markdown-converter';

// SMEC AI CSS Styles for PDF generation
export const SMEC_AI_CSS = `
  html {
    background: #e5e7eb;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333333;
    background: white;
    padding: 50px 35px;
    max-width: 750px;
    margin: 0 auto;
    font-size: 11pt;
  }

  /* Headers */
  h1, h2, h3, h4, h5, h6 {
    color: #1a1a1a;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  h1 {
    font-size: 24pt;
    border-bottom: 2px solid #7c3aed;
    padding-bottom: 0.3em;
  }

  h2 {
    font-size: 18pt;
    color: #7c3aed;
  }

  h3 {
    font-size: 14pt;
  }

  /* Paragraphs and text */
  p {
    margin: 1em 0;
  }

  strong {
    font-weight: 600;
  }

  /* Links */
  a {
    color: #7c3aed;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* Lists */
  ul, ol {
    margin: 1em 0;
    padding-left: 2em;
  }

  li {
    margin: 0.5em 0;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 10pt;
  }

  th {
    background-color: #7c3aed;
    color: white;
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 10px 15px;
    border-bottom: 1px solid #e5e7eb;
  }

  tr:nth-child(even) {
    background-color: #f9fafb;
  }

  /* Code blocks */
  pre {
    background-color: #1e1e1e;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1.5em 0;
  }

  pre code {
    color: #d4d4d4;
    font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
    font-size: 10pt;
    line-height: 1.5;
  }

  code {
    font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
    background-color: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }

  pre code {
    background: none;
    padding: 0;
  }

  /* Blockquotes */
  blockquote {
    border-left: 4px solid #7c3aed;
    margin: 1.5em 0;
    padding: 0.5em 1em;
    background-color: #f9fafb;
    color: #4b5563;
  }

  /* Horizontal rules */
  hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 2em 0;
  }

  /* Page header styling */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2em;
    padding-bottom: 1em;
    border-bottom: 2px solid #7c3aed;
  }

  .logo-section img {
    max-height: 50px;
    width: auto;
  }

  .header-info {
    text-align: right;
  }

  .header-title {
    font-size: 14pt;
    font-weight: 600;
    color: #7c3aed;
  }

  .header-version {
    font-size: 10pt;
    color: #6b7280;
  }

  /* Print-specific styles */
  @media print {
    body {
      padding: 0;
    }

    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
`;

// Placeholder for logo - can be replaced with actual base64 encoded logo
export const LOGO_BASE64 = '';

/**
 * Build the complete HTML document with styles
 */
export function buildFullHtml(content: string, metadata: DocumentMetadata): string {
  const headerHtml = LOGO_BASE64
    ? `<div class="page-header">
         <div class="logo-section"><img src="${LOGO_BASE64}" alt="SMEC AI Logo"></div>
         <div class="header-info">
           <div class="header-title">Statement of Advice</div>
           <div class="header-version">Version ${metadata.version}</div>
         </div>
       </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${metadata.title}</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css">
      <style>${SMEC_AI_CSS}</style>
    </head>
    <body>
      ${headerHtml}
      ${content}
    </body>
    </html>
  `;
}

/**
 * Build PDF footer template with page numbers
 */
export function buildFooterTemplate(metadata: DocumentMetadata): string {
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
}

/**
 * Build PDF filename based on metadata
 */
export function buildPdfFilename(metadata: DocumentMetadata, originalFilename: string): string {
  let filename = '';

  if (metadata.dateStr) {
    filename += metadata.dateStr + ' ';
  }

  filename += 'SMEC AI Statement of Advice';

  if (metadata.clientName) {
    filename += ' - ' + metadata.clientName;
  }

  filename += '.pdf';

  // Sanitize filename
  return filename.replace(/[/\\?%*:|"<>]/g, '-');
}
