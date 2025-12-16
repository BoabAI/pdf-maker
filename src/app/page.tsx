'use client';

import { useState, useEffect, useCallback } from 'react';
import { Amplify } from 'aws-amplify';
import { uploadData, downloadData, getUrl } from 'aws-amplify/storage';
import Image from 'next/image';

import MarkdownUploader from '@/components/MarkdownUploader';
import MarkdownEditor from '@/components/MarkdownEditor';
import ConversionStatus from '@/components/ConversionStatus';
import PdfDownloader from '@/components/PdfDownloader';

type InputMode = 'upload' | 'paste';
type ConversionState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [markdownContent, setMarkdownContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [conversionState, setConversionState] = useState<ConversionState>('idle');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Configure Amplify on mount
  useEffect(() => {
    async function configureAmplify() {
      try {
        const outputs = await import('../../amplify_outputs.json');
        Amplify.configure(outputs.default || outputs);
      } catch {
        console.log('Amplify outputs not found - running in development mode');
      }
      setIsConfigured(true);
    }
    configureAmplify();
  }, []);

  // Poll for status updates
  useEffect(() => {
    if (!statusKey || conversionState !== 'processing') return;

    const pollInterval = setInterval(async () => {
      try {
        const downloadResult = await downloadData({ path: statusKey }).result;
        const statusText = await downloadResult.body.text();
        const status = JSON.parse(statusText);

        if (status.status === 'complete') {
          clearInterval(pollInterval);
          const urlResult = await getUrl({ path: status.pdfKey });
          setPdfUrl(urlResult.url.toString());
          setConversionState('complete');
        } else if (status.status === 'error') {
          clearInterval(pollInterval);
          setError(status.error || 'Conversion failed');
          setConversionState('error');
        }
      } catch {
        // Status file may not exist yet, continue polling
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [statusKey, conversionState]);

  const validateInput = useCallback((content: string, fileObj: File | null): string | null => {
    if (!content.trim()) {
      return 'No markdown content provided';
    }
    if (fileObj && fileObj.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (content.length > MAX_FILE_SIZE) {
      return `Content too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  }, []);

  const handleConvert = async () => {
    setConversionState('uploading');
    setError(null);
    setPdfUrl(null);

    try {
      const timestamp = Date.now();
      const filename = file?.name || `document-${timestamp}.md`;
      const content = inputMode === 'upload' && file
        ? await file.text()
        : markdownContent;

      const validationError = validateInput(content, file);
      if (validationError) {
        throw new Error(validationError);
      }

      const uploadKey = `uploads/${filename}`;
      await uploadData({
        path: uploadKey,
        data: new Blob([content], { type: 'text/markdown' }),
      });

      const statusKeyPath = `status/${filename.replace('.md', '.json')}`;
      setStatusKey(statusKeyPath);
      setConversionState('processing');

    } catch (e) {
      setError((e as Error).message);
      setConversionState('error');
    }
  };

  const handleReset = () => {
    setConversionState('idle');
    setMarkdownContent('');
    setFile(null);
    setPdfUrl(null);
    setError(null);
    setStatusKey(null);
  };

  // Loading state
  if (!isConfigured) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-200 border-t-violet-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with SMEC Logo */}
        <header className="text-center mb-10">
          <div className="flex flex-col items-center gap-4 mb-3">
            <Image
              src="/smec-logo.png"
              alt="SMEC AI"
              width={280}
              height={80}
              priority
              className="h-16 w-auto"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              PDF Maker
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            Transform your markdown into beautifully styled PDFs
          </p>
        </header>

        {/* Main Card */}
        <div className="glass-card rounded-2xl shadow-xl shadow-violet-100/50 p-8">
          {conversionState === 'idle' && (
            <>
              {/* Input Mode Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-violet-50 rounded-xl">
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    inputMode === 'upload'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-gray-500 hover:text-violet-600'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload File
                  </span>
                </button>
                <button
                  onClick={() => setInputMode('paste')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    inputMode === 'paste'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-gray-500 hover:text-violet-600'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Paste Text
                  </span>
                </button>
              </div>

              {/* Input Components */}
              {inputMode === 'upload' ? (
                <MarkdownUploader file={file} onFileSelect={setFile} />
              ) : (
                <MarkdownEditor
                  content={markdownContent}
                  onChange={setMarkdownContent}
                />
              )}

              {/* Convert Button */}
              <button
                onClick={handleConvert}
                disabled={
                  (inputMode === 'upload' && !file) ||
                  (inputMode === 'paste' && !markdownContent.trim())
                }
                className="w-full mt-6 py-3.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Convert to PDF
                </span>
              </button>
            </>
          )}

          {/* Status Display */}
          {conversionState !== 'idle' && conversionState !== 'complete' && (
            <ConversionStatus
              state={conversionState}
              error={error || undefined}
            />
          )}

          {/* Download Button */}
          {conversionState === 'complete' && pdfUrl && (
            <PdfDownloader url={pdfUrl} onReset={handleReset} />
          )}

          {/* Error Reset */}
          {conversionState === 'error' && (
            <button
              onClick={handleReset}
              className="w-full mt-4 py-3 bg-violet-50 text-violet-700 rounded-xl font-medium hover:bg-violet-100 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Powered by <span className="font-medium text-violet-500">SMEC AI</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
