import { defineStorage } from '@aws-amplify/backend';
import { pdfProcessor } from '../functions/pdf-processor/resource';

export const storage = defineStorage({
  name: 'pdfMakerStorage',
  access: (allow) => ({
    // User uploads go here
    'uploads/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    // Generated PDFs stored here
    'generated/{entity_id}/*': [
      allow.entity('identity').to(['read', 'delete']),
      allow.resource(pdfProcessor).to(['read', 'write']),
    ],
    // Processing status files
    'status/{entity_id}/*': [
      allow.entity('identity').to(['read']),
      allow.resource(pdfProcessor).to(['read', 'write', 'delete']),
    ],
  }),
});
