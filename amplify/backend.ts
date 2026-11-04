import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { pdfProcessor } from './functions/pdf-processor/resource';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { buildGuestStorageStatements } from './storage/guest-access';

const backend = defineBackend({
  auth,
  storage,
  pdfProcessor,
});

// Get references to the underlying constructs
const bucketResource = backend.storage.resources.bucket;
const pdfLambda = backend.pdfProcessor.resources.lambda;

// Cast to Bucket for full access to lifecycle rules
const bucket = bucketResource as s3.Bucket;

// Guest (unauthenticated) users may only touch objects under their own
// identity ID; Amplify's allow.guest cannot express per-identity scoping.
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  new iam.Policy(backend.storage.stack, 'GuestOwnObjectsPolicy', {
    statements: buildGuestStorageStatements(bucket.bucketArn),
  })
);

// Note: Chromium is downloaded from GitHub releases at runtime
// using @sparticuz/chromium-min (no Lambda Layer needed)

// Add S3 trigger for markdown uploads
bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(pdfLambda),
  { prefix: 'uploads/', suffix: '.md' }
);

// Add lifecycle rules for cleanup
bucket.addLifecycleRule({
  id: 'CleanupUploads',
  prefix: 'uploads/',
  expiration: Duration.days(7),
  enabled: true,
});

bucket.addLifecycleRule({
  id: 'CleanupGeneratedPDFs',
  prefix: 'generated/',
  expiration: Duration.days(30),
  enabled: true,
});

bucket.addLifecycleRule({
  id: 'CleanupStatusFiles',
  prefix: 'status/',
  expiration: Duration.days(7),
  enabled: true,
});

export default backend;
