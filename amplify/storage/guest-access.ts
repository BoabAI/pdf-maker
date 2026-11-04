import * as iam from 'aws-cdk-lib/aws-iam';

/** IAM policy variable that resolves to the caller's Cognito identity ID */
export const IDENTITY_ID_VARIABLE = '${cognito-identity.amazonaws.com:sub}';

function ownPrefixArn(bucketArn: string, folder: string): string {
  return `${bucketArn}/${folder}/` + IDENTITY_ID_VARIABLE + '/*';
}

/**
 * Least-privilege S3 access for guest (unauthenticated) identities: each guest
 * can only upload markdown to, and read status/PDFs from, its own
 * identity-scoped prefixes. No list or delete.
 */
export function buildGuestStorageStatements(bucketArn: string): iam.PolicyStatement[] {
  return [
    new iam.PolicyStatement({
      sid: 'GuestUploadOwnMarkdown',
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject', 's3:AbortMultipartUpload', 's3:ListMultipartUploadParts'],
      resources: [ownPrefixArn(bucketArn, 'uploads')],
    }),
    new iam.PolicyStatement({
      sid: 'GuestReadOwnResults',
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [ownPrefixArn(bucketArn, 'status'), ownPrefixArn(bucketArn, 'generated')],
    }),
  ];
}
