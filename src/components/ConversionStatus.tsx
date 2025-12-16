'use client';

interface ConversionStatusProps {
  state: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function ConversionStatus({ state, error }: ConversionStatusProps) {
  const getStatusMessage = () => {
    switch (state) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Converting to PDF...';
      case 'complete':
        return 'Conversion complete!';
      case 'error':
        return error || 'An error occurred during conversion';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'uploading':
        return 'text-blue-600';
      case 'processing':
        return 'text-purple-600';
      case 'complete':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const showSpinner = state === 'uploading' || state === 'processing';

  return (
    <div className="w-full flex items-center justify-center gap-3 p-4">
      {showSpinner && (
        <div className="animate-spin">
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
      <p className={`text-lg font-medium ${getStatusColor()}`}>
        {getStatusMessage()}
      </p>
    </div>
  );
}
