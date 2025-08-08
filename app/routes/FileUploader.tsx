// ❌ WRONG: you're importing `format` from 'path' (Node.js), which doesn't work in the browser
// ✅ Instead, you want to import `formatSize` or define it manually
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

// ✅ Optional: utility to format bytes into readable size
const formatSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0] || null;
      setFile(selectedFile); // ✅ Don't forget to update local state
      onFileSelect?.(selectedFile);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 20 * 1024 * 1024, // ✅ maxSize must be outside accept
  });

  return (
    <div className="w-full gradient-border">
      <div {...getRootProps()} className="cursor-pointer">
        <input {...getInputProps()} />
        <div className="space-y-4">
         

          {file ? (
            <div className="uploader-selected-file" onClick={(e)=>e.stopPropagation()}>
                 <img src="/images/pdf.png" alt="pdf icon" className="size-10" />
              <div className="flex items-center space-x-3">
               
                <p className="text-sm font-medium text-gray-700 max-w-xs truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatSize(file.size)}
                </p>
              </div>
             <button className='p-2 cursor-pointer' onClick={(e)=>{
                onFileSelect?.(file);
             }}>
                <img src="/icons/cross.svg" alt="cross" className="w-4 h-4"/>
              </button>
            </div>
          ) : (
            <div>
                 <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
            <img src="/icons/info.svg" alt="upload" className="size-20" />
          </div>
              <p className="text-lg text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-lg text-gray-500">PDF (max 20MB)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;