'use client';

import { useState, useEffect, useCallback } from 'react';
import { Amplify } from 'aws-amplify';
import { uploadData, downloadData, getUrl } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

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
    // Check if content is provided
    if (!content.trim()) {
      return 'No markdown content provided';
    }

    // Check file size
    if (fileObj && fileObj.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // Check content length
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
      // Get the identity ID (used for S3 path-based access control)
      const session = await fetchAuthSession();
      const identityId = session.identityId;
      if (!identityId) {
        throw new Error('Unable to get identity ID');
      }

      const timestamp = Date.now();
      const filename = file?.name || `document-${timestamp}.md`;
      const content = inputMode === 'upload' && file
        ? await file.text()
        : markdownContent;

      // Validate input
      const validationError = validateInput(content, file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Upload markdown to S3 (path must match storage access rule: uploads/{entity_id}/*)
      const uploadKey = `uploads/${identityId}/${filename}`;
      await uploadData({
        path: uploadKey,
        data: new Blob([content], { type: 'text/markdown' }),
      });

      // Set status key for polling
      const statusKeyPath = `status/${identityId}/${filename.replace('.md', '.json')}`;
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

  // Show loading while configuring
  if (!isConfigured) {
    return (
      <main className="container mx-auto max-w-4xl p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </main>
    );
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <main className="container mx-auto max-w-4xl p-6">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-purple-700">
              PDF Maker
            </h1>
            <button
              onClick={signOut}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded border border-gray-300 hover:border-gray-400 transition"
            >
              Sign out
            </button>
          </header>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {conversionState === 'idle' && (
              <>
                {/* Input Mode Toggle */}
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setInputMode('upload')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      inputMode === 'upload'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    onClick={() => setInputMode('paste')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      inputMode === 'paste'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Paste Text
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
                  className="w-full mt-6 py-3 bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition"
                >
                  Convert to PDF
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
                className="w-full mt-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Try Again
              </button>
            )}
          </div>

          <footer className="mt-8 text-center text-sm text-gray-500">
            <p>Powered by SMEC AI &bull; Secure Markdown to PDF Conversion</p>
          </footer>
        </main>
      )}
    </Authenticator>
  );
}
