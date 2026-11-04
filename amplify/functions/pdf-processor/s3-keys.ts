/**
 * S3 key layout. Every object is stored under its owner's Cognito identity ID
 * so IAM can scope each identity to its own prefix:
 *   uploads/<identityId>/<name>.md
 *   status/<identityId>/<name>.json
 *   generated/<identityId>/<pdf name>
 */

// Cognito identity IDs look like "ap-southeast-2:1b2c3d4e-...."
const IDENTITY_ID_PATTERN = /^[a-z]{2}(?:-[a-z]+)+-\d:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_FILENAME_LENGTH = 255;

export interface UploadKey {
  identityId: string;
  filename: string;
}

/**
 * Decode an object key from an S3 event notification (URL-encoded, '+' for space)
 */
export function decodeS3EventKey(rawKey: string): string {
  return decodeURIComponent(rawKey.replace(/\+/g, ' '));
}

/**
 * Parse and validate an upload key. Returns null for anything that is not
 * exactly uploads/<identityId>/<filename>.md
 */
export function parseUploadKey(key: string): UploadKey | null {
  const parts = key.split('/');
  if (parts.length !== 3 || parts[0] !== 'uploads') return null;

  const [, identityId, filename] = parts;
  if (!IDENTITY_ID_PATTERN.test(identityId)) return null;
  if (!filename.endsWith('.md') || filename.length > MAX_FILENAME_LENGTH) return null;
  if (filename === '.md' || filename === '..' || filename === '.') return null;

  return { identityId, filename };
}

export function buildStatusKey(identityId: string, markdownFilename: string): string {
  return `status/${identityId}/${markdownFilename.replace(/\.md$/, '')}.json`;
}

export function buildGeneratedKey(identityId: string, pdfFilename: string): string {
  return `generated/${identityId}/${pdfFilename}`;
}
