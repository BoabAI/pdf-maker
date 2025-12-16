import { defineFunction } from '@aws-amplify/backend';

export const pdfProcessor = defineFunction({
  name: 'pdfProcessor',
  entry: './handler.ts',
  timeoutSeconds: 180,
  memoryMB: 2048,
  runtime: 20,
  environment: {
    NODE_ENV: 'production',
  },
  bundling: {
    // @sparticuz/chromium is provided via Lambda Layer, don't bundle it
    externalModules: ['@sparticuz/chromium'],
  },
});
