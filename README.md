# PDF Maker

A web application that converts Markdown files to professionally styled PDFs with SMEC AI branding, built on AWS Amplify Gen 2.

## Features

- 📄 **Upload or Paste**: Upload .md files or paste markdown directly
- 🎨 **Professional Styling**: SMEC AI branding with purple accents
- 🔐 **Secure**: Cognito authentication, user-specific storage
- ⚡ **Async Processing**: S3-triggered Lambda for reliable PDF generation
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: AWS Amplify Gen 2, Lambda, S3, Cognito
- **PDF Generation**: Puppeteer with @sparticuz/chromium
- **Markdown**: markdown-it with highlight.js

## Quick Start

```bash
# Install dependencies
bun install

# Start Amplify sandbox (backend)
bun run sandbox

# Start development server
bun run dev
```

## Project Structure

```
pdf-maker/
├── amplify/
│   ├── auth/                    # Cognito configuration
│   ├── storage/                 # S3 bucket configuration
│   ├── functions/
│   │   └── pdf-processor/       # Lambda function
│   │       ├── handler.ts       # Main handler
│   │       ├── markdown-converter.ts
│   │       └── styles/          # SMEC AI styles
│   └── backend.ts               # Backend composition
├── src/
│   ├── app/                     # Next.js pages
│   └── components/              # React components
├── amplify.yml                  # Build configuration
└── DEPLOYMENT.md                # Deployment guide
```

## Architecture

```
User Upload → S3 (uploads/) → Lambda Trigger → PDF → S3 (generated/) → User Download
```

1. User authenticates via Cognito
2. Uploads markdown to S3 `uploads/{user_id}/`
3. S3 trigger invokes Lambda
4. Lambda converts markdown → HTML → PDF
5. PDF saved to S3 `generated/{user_id}/`
6. Frontend polls status file and displays download link

## Testing

```bash
bun test
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy:
```bash
npx ampx pipeline-deploy --branch main
```

## License

Private - SMEC AI
