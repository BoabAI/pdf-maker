import { defineStorage } from '@aws-amplify/backend';
import { pdfProcessor } from '../functions/pdf-processor/resource';

/**
 * Every object lives under its owner's Cognito identity ID ({entity_id}).
 * Signed-in users are scoped here via allow.entity('identity'). Amplify cannot
 * scope guest (unauthenticated) identities per entity, so guest access is
 * granted in backend.ts with the ${cognito-identity.amazonaws.com:sub} policy
 * variable (see guest-access.ts). The pdfProcessor Lambda can reach every
 * identity's prefix.
 */
export const storage = defineStorage({
  name: 'pdfMakerStorage',
  access: (allow) => ({
    'uploads/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.resource(pdfProcessor).to(['read']),
    ],
    'generated/{entity_id}/*': [
      allow.entity('identity').to(['read', 'delete']),
      allow.resource(pdfProcessor).to(['read', 'write']),
    ],
    'status/{entity_id}/*': [
      allow.entity('identity').to(['read']),
      allow.resource(pdfProcessor).to(['read', 'write', 'delete']),
    ],
  }),
});
