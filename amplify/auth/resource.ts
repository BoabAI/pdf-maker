import { defineAuth } from '@aws-amplify/backend';

/**
 * Auth configuration that enables guest (unauthenticated) access.
 * Users don't need to sign in - the identity pool provides temporary credentials
 * for S3 operations via the guest role.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
