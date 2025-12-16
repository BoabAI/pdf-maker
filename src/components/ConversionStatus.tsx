'use client';

interface ConversionStatusProps {
  state: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function ConversionStatus({ state, error }: ConversionStatusProps) {
  const getStatusMessage = () => {
    switch (state) {
      case 'uploading':
        return 'Uploading your file...';
      case 'processing':
        return 'Creating your PDF...';
      case 'complete':
        return 'Conversion complete!';
      case 'error':
        return error || 'Something went wrong';
      default:
        return '';
    }
  };

  const showSpinner = state === 'uploading' || state === 'processing';
  const isError = state === 'error';

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 py-12">
      {showSpinner && (
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      )}

      {isError && (
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      )}

      <div className="text-center">
        <p className={`text-lg font-medium ${isError ? 'text-red-500' : 'text-violet-600'}`}>
          {getStatusMessage()}
        </p>
        {showSpinner && (
          <p className="text-sm text-gray-400 mt-1">
            This may take a few seconds
          </p>
        )}
      </div>
    </div>
  );
}
