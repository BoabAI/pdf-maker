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
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
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
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-12 h-12 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {file ? (
            <div className="text-sm">
              <p className="font-semibold text-purple-600">{file.name}</p>
              <p className="text-gray-500 mt-1">{formatFileSize(file.size)}</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">
                Drop your markdown file here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse (.md files only)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
