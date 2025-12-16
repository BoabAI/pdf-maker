import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { pdfProcessor } from './functions/pdf-processor/resource';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  storage,
  pdfProcessor,
});

// Get references to the underlying constructs
const bucketResource = backend.storage.resources.bucket;
const lambda = backend.pdfProcessor.resources.lambda;

// Cast to Bucket for full access to lifecycle rules
const bucket = bucketResource as s3.Bucket;

// Add S3 trigger for markdown uploads
bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(lambda),
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
