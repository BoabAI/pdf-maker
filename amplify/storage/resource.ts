import { defineStorage } from '@aws-amplify/backend';
import { pdfProcessor } from '../functions/pdf-processor/resource';

export const storage = defineStorage({
  name: 'pdfMakerStorage',
  access: (allow) => ({
    // User uploads - guest access (no auth required)
    'uploads/*': [
      allow.guest.to(['read', 'write', 'delete']),
      allow.resource(pdfProcessor).to(['read']),
    ],
    // Generated PDFs
    'generated/*': [
      allow.guest.to(['read', 'delete']),
      allow.resource(pdfProcessor).to(['read', 'write']),
    ],
    // Processing status files
    'status/*': [
      allow.guest.to(['read']),
      allow.resource(pdfProcessor).to(['read', 'write', 'delete']),
    ],
  }),
});
