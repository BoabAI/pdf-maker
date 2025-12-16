import { defineStorage } from '@aws-amplify/backend';
import { pdfProcessor } from '../functions/pdf-processor/resource';

export const storage = defineStorage({
  name: 'pdfMakerStorage',
  access: (allow) => ({
    // Guest (unauthenticated) users can upload and manage their files
    'uploads/*': [
      allow.guest.to(['read', 'write', 'delete']),
      allow.resource(pdfProcessor).to(['read']),
    ],
    // Guest users can download generated PDFs
    'generated/*': [
      allow.guest.to(['read', 'delete']),
      allow.resource(pdfProcessor).to(['read', 'write']),
    ],
    // Guest users can read status files (for polling)
    'status/*': [
      allow.guest.to(['read']),
      allow.resource(pdfProcessor).to(['read', 'write', 'delete']),
    ],
  }),
});
