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
    <div className="w-full flex flex-col items-center gap-4 p-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="
            px-6 py-3
            bg-purple-600 hover:bg-purple-700
            text-white font-medium
            rounded-lg
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          "
        >
          Download PDF
        </button>

        <button
          onClick={onReset}
          className="
            px-6 py-3
            bg-gray-200 hover:bg-gray-300
            text-gray-700 font-medium
            rounded-lg
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
          "
        >
          Convert Another
        </button>
      </div>
    </div>
  );
}
