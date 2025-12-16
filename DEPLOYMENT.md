# PDF Maker - Deployment Guide

## Prerequisites

- AWS Account with appropriate permissions
- Node.js 20+ installed
- AWS CLI configured
- GitHub repository (for CI/CD deployment)

## Local Development

### 1. Install Dependencies

```bash
bun install
```

### 2. Start Amplify Sandbox

```bash
bun run sandbox
# or
npx ampx sandbox
```

This will:
- Deploy backend resources (Auth, Storage, Lambda) to your AWS account
- Generate `amplify_outputs.json` for frontend configuration
- Watch for changes and auto-deploy

### 3. Run Development Server

```bash
bun run dev
```

Visit http://localhost:3000 to test the application.

## Production Deployment

### Option A: Amplify Hosting (Recommended)

1. **Connect Repository to Amplify**
   ```bash
   # Using Amplify MCP tools
   mcp__aws-amplify__amplify_deploy_app({
     appName: "pdf-maker",
     githubOwner: "your-username",
     githubRepo: "pdf-maker",
     branch: "main",
     platform: "WEB_COMPUTE"
   })
   ```

2. **Or via AWS Console**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select branch and confirm build settings

### Option B: Manual Deployment

```bash
# Build and deploy
bun run build
npx ampx pipeline-deploy --branch main
```

## Environment Configuration

### Required Environment Variables

None required for basic operation. The app uses Cognito for auth and S3 for storage.

### Optional Configuration

- **Custom Domain**: Configure in Amplify Console → Domain management
- **Logo**: Replace `amplify/functions/pdf-processor/assets/logo.ts` with base64 encoded logo

## Monitoring & Observability

### CloudWatch Logs

Access Lambda logs via:
```bash
# Using Amplify MCP tools
mcp__aws-amplify__amplify_get_lambda_logs({
  appId: "YOUR_APP_ID",
  timeRange: "1h",
  logLevel: "ERROR"
})
```

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Lambda Duration | < 30s | > 120s |
| Lambda Errors | 0 | > 5/5min |
| S3 Storage | < 100GB | > 100GB |

### Setting Up CloudWatch Alarms

1. **Lambda Error Alarm**
   - Metric: Lambda Errors
   - Threshold: > 5 errors in 5 minutes
   - Action: Send SNS notification

2. **Lambda Duration Alarm**
   - Metric: Duration (p95)
   - Threshold: > 120 seconds
   - Action: Send SNS notification

## Troubleshooting

### Build Failures

1. Check build logs:
   ```bash
   mcp__aws-amplify__amplify_get_build_logs({
     appId: "YOUR_APP_ID",
     branchName: "main"
   })
   ```

2. Common issues:
   - Missing environment variables
   - Node.js version mismatch
   - Dependency conflicts

### Lambda Timeouts

If PDF generation times out:
1. Check markdown file size (max 10MB)
2. Review Lambda memory (should be 2048MB)
3. Check CloudWatch logs for errors

### Authentication Issues

1. Verify Cognito User Pool is configured correctly
2. Check `amplify_outputs.json` is present
3. Ensure client is using correct region

## Cost Estimation

### Monthly (1,000 conversions)

| Service | Cost |
|---------|------|
| Lambda | ~$1.00 |
| S3 Storage | ~$0.23 |
| S3 Requests | ~$0.05 |
| Data Transfer | ~$0.45 |
| Cognito (free tier) | $0.00 |
| **Total** | **~$1.73** |

## Security Best Practices

1. ✅ Cognito authentication required
2. ✅ S3 path-based access control
3. ✅ No public bucket access
4. ✅ Lambda runs in VPC (optional)
5. ✅ File size limits enforced

## Support

For issues, check:
1. CloudWatch Logs
2. Amplify Console → Monitoring
3. GitHub Issues
