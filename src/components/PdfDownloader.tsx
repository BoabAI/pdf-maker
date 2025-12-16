'use client';

interface PdfDownloaderProps {
  url: string;
  onReset: () => void;
}

export default function PdfDownloader({ url, onReset }: PdfDownloaderProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 py-8">
      {/* Success Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center">
        <p className="text-xl font-semibold text-gray-700">Your PDF is ready!</p>
        <p className="text-sm text-gray-400 mt-1">Click below to download</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={handleDownload}
          className="
            flex-1 px-6 py-3
            bg-gradient-to-r from-violet-500 to-purple-500
            hover:from-violet-600 hover:to-purple-600
            text-white font-medium
            rounded-xl
            shadow-lg shadow-violet-200
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
          "
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </span>
        </button>

        <button
          onClick={onReset}
          className="
            px-5 py-3
            bg-violet-50 hover:bg-violet-100
            text-violet-600 font-medium
            rounded-xl
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-violet-200 focus:ring-offset-2
          "
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
