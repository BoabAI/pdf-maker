# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
bun install              # Install dependencies
bun run dev              # Start Next.js dev server (http://localhost:3000)
bun run sandbox          # Start Amplify sandbox (deploys backend to AWS)

# Quality
bun run lint             # Run ESLint
bun test                 # Run tests (uses Bun test runner)

# Deployment
bun run build            # Production build
bun run deploy           # Deploy via Amplify pipeline
```

**Development workflow**: Run `bun run sandbox` in one terminal, then `bun run dev` in another.

## Architecture Overview

This is a serverless Markdown-to-PDF converter built on AWS Amplify Gen 2.

### Processing Flow
```
User Upload → S3 (uploads/{user_id}/) → Lambda Trigger → PDF Generation → S3 (generated/{user_id}/) → User Download
```

### Key Components

**Frontend (Next.js 15 + React 19)**
- `src/app/page.tsx` - Main application page with Cognito authentication wrapper
- `src/components/` - React components (MarkdownUploader, MarkdownEditor, ConversionStatus, PdfDownloader)
- Frontend polls `status/{user_id}/*.json` files to track conversion progress

**Backend (Amplify Gen 2)**
- `amplify/backend.ts` - Backend composition: auth + storage + Lambda + S3 triggers + lifecycle rules
- `amplify/auth/resource.ts` - Cognito authentication (email login)
- `amplify/storage/resource.ts` - S3 bucket with path-based access control
- `amplify/functions/pdf-processor/` - Lambda function for PDF generation

**Lambda Function Details**
- `handler.ts` - S3 event handler, coordinates markdown → PDF pipeline
- `markdown-converter.ts` - markdown-it with highlight.js for syntax highlighting
- `styles/smec-ai.ts` - SMEC AI branding CSS and PDF templates
- Uses Puppeteer with `@sparticuz/chromium-min` via Lambda Layer (`amplify/layers/chromium/`)
- Lambda config: 2048MB memory, 180s timeout, Node 20

### S3 Bucket Structure
- `uploads/{entity_id}/*` - User markdown uploads (7-day retention)
- `generated/{entity_id}/*` - Generated PDFs (30-day retention)
- `status/{entity_id}/*` - Processing status JSON files (7-day retention)

### Document Metadata Extraction
The Lambda extracts metadata from markdown using these patterns:
- Title: First `# Heading`
- Version: `**Version X.X**`
- Client: `**Client:** Name`
- Date: `**Date:** YYYY-MM-DD`

## TypeScript Configuration

The project uses two separate TypeScript configurations:
- Root `tsconfig.json` - For Next.js frontend (excludes `amplify/functions/**/*`)
- Lambda functions have their own TypeScript config within `amplify/functions/pdf-processor/`

Path alias: `@/*` maps to `./src/*`

## Task Master AI Integration

This project uses Task Master for task management. See `.taskmaster/CLAUDE.md` for workflow commands.
