import { describe, expect, it } from 'bun:test';
import { App, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Template } from 'aws-cdk-lib/assertions';
import { buildGuestStorageStatements, IDENTITY_ID_VARIABLE } from '../../amplify/storage/guest-access';

interface PolicyStatementJson {
  Action: string | string[];
  Resource: unknown;
}

function flattenResource(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(flattenResource);
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object' && 'Fn::Join' in value) {
    const [, parts] = (value as { 'Fn::Join': [string, unknown[]] })['Fn::Join'];
    return [parts.map((p) => (typeof p === 'string' ? p : '<bucketArn>')).join('')];
  }
  return ['<token>'];
}

function synthGuestStatements(): PolicyStatementJson[] {
  const stack = new Stack(new App(), 'TestStack');
  const bucket = new s3.Bucket(stack, 'Bucket');
  const role = new iam.Role(stack, 'GuestRole', {
    assumedBy: new iam.ServicePrincipal('cognito-identity.amazonaws.com'),
  });
  role.attachInlinePolicy(
    new iam.Policy(stack, 'GuestPolicy', { statements: buildGuestStorageStatements(bucket.bucketArn) })
  );
  const policies = Template.fromStack(stack).findResources('AWS::IAM::Policy');
  const [policy] = Object.values(policies) as Array<{
    Properties: { PolicyDocument: { Statement: PolicyStatementJson[] } };
  }>;
  return policy.Properties.PolicyDocument.Statement;
}

describe('guest storage policy (P-1)', () => {
  const statements = synthGuestStatements();
  const resources = statements.flatMap((s) => flattenResource(s.Resource));
  const actions = statements.flatMap((s) => (Array.isArray(s.Action) ? s.Action : [s.Action]));

  it('scopes every resource to the caller identity ID', () => {
    expect(resources.length).toBeGreaterThan(0);
    for (const resource of resources) {
      expect(resource).toContain(`/${IDENTITY_ID_VARIABLE}/*`);
    }
  });

  it('grants exactly the expected prefixes', () => {
    expect(resources.sort()).toEqual([
      `<bucketArn>/generated/${IDENTITY_ID_VARIABLE}/*`,
      `<bucketArn>/status/${IDENTITY_ID_VARIABLE}/*`,
      `<bucketArn>/uploads/${IDENTITY_ID_VARIABLE}/*`,
    ]);
  });

  it('does not grant list or delete', () => {
    expect(actions).not.toContain('s3:ListBucket');
    expect(actions).not.toContain('s3:DeleteObject');
    expect(actions.some((a) => a.includes('*'))).toBe(false);
  });

  it('only allows uploads to write', () => {
    const writers = statements.filter((s) =>
      (Array.isArray(s.Action) ? s.Action : [s.Action]).includes('s3:PutObject')
    );
    expect(writers.flatMap((s) => flattenResource(s.Resource))).toEqual([
      `<bucketArn>/uploads/${IDENTITY_ID_VARIABLE}/*`,
    ]);
  });
});
