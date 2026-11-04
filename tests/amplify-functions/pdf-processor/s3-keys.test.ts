import { describe, expect, it } from 'bun:test';
import {
  buildGeneratedKey,
  buildStatusKey,
  decodeS3EventKey,
  parseUploadKey,
} from '../../../amplify/functions/pdf-processor/s3-keys';

const ID = 'ap-southeast-2:1b2c3d4e-5f60-4a1b-8c2d-3e4f5a6b7c8d';

describe('parseUploadKey (P-1)', () => {
  it('accepts uploads/<identityId>/<name>.md', () => {
    expect(parseUploadKey(`uploads/${ID}/My Report.md`)).toEqual({
      identityId: ID,
      filename: 'My Report.md',
    });
  });

  it.each([
    'uploads/report.md',
    `uploads/${ID}/nested/report.md`,
    `uploads/${ID}/report.txt`,
    `uploads/${ID}/.md`,
    `uploads/not-an-identity/report.md`,
    `uploads/${ID.toUpperCase()}/report.md`,
    `uploads/../${ID}/report.md`,
    `generated/${ID}/report.md`,
    `uploads/${ID}/`,
    '',
  ])('rejects %p', (key) => {
    expect(parseUploadKey(key)).toBeNull();
  });

  it('rejects over-long filenames', () => {
    expect(parseUploadKey(`uploads/${ID}/${'a'.repeat(300)}.md`)).toBeNull();
  });
});

describe('decodeS3EventKey', () => {
  it('decodes the URL-encoded colon and plus-as-space used by S3 events', () => {
    expect(decodeS3EventKey('uploads/ap-southeast-2%3Aabc/My+Report.md')).toBe(
      'uploads/ap-southeast-2:abc/My Report.md'
    );
  });
});

describe('output keys stay under the uploader identity (P-1)', () => {
  it('builds the status key', () => {
    expect(buildStatusKey(ID, 'doc.v1.md')).toBe(`status/${ID}/doc.v1.json`);
  });

  it('builds the generated key', () => {
    expect(buildGeneratedKey(ID, 'a.pdf')).toBe(`generated/${ID}/a.pdf`);
  });
});
