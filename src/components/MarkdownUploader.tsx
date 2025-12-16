'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface MarkdownUploaderProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export default function MarkdownUploader({ file, onFileSelect }: MarkdownUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.name.endsWith('.md')) {
        onFileSelect(selectedFile);
      } else {
        alert('Please upload a .md file');
      }
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.name.endsWith('.md')) {
        onFileSelect(selectedFile);
      } else {
        alert('Please upload a .md file');
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-violet-400 bg-violet-50 scale-[1.02]'
            : file
              ? 'border-violet-300 bg-violet-50/50'
              : 'border-violet-200 hover:border-violet-400 hover:bg-violet-50/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          {file ? (
            <>
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-violet-700">{file.name}</p>
                <p className="text-gray-400 mt-1">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onFileSelect(null); }}
                className="text-xs text-violet-500 hover:text-violet-700 underline"
              >
                Remove file
              </button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-base font-medium text-gray-600">
                  Drop your markdown file here
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  or click to browse
                </p>
              </div>
              <span className="text-xs text-violet-400 bg-violet-50 px-3 py-1 rounded-full">
                .md files only
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
