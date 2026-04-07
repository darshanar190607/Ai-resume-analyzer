import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface FileUploadProps {
  files: File[];
  setFiles: (files: File[]) => void;
}

export function FileUpload({ files, setFiles }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles([...files, ...acceptedFiles]);
    }
  }, [files, setFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 10,
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-black text-[#1a2b4b] uppercase tracking-widest">
        Resume Documents
      </label>
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-none p-12 transition-all duration-300 cursor-pointer group",
          isDragActive ? "border-blue-800 bg-blue-50/50" : "border-gray-200 hover:border-blue-800 hover:bg-gray-50/30",
          files.length > 0 && "border-green-500 bg-green-50/20"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-5 text-center">
          <div className="w-16 h-16 bg-[#1a2b4b] rounded-none flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-black text-[#1a2b4b]">
              {isDragActive ? "Drop Resumes Here" : "Upload Candidate Resumes"}
            </p>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              PDF format only • Max 10 files • Max 10MB each
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between p-4 bg-white border-2 border-gray-100 group hover:border-blue-800 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 flex items-center justify-center text-blue-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#1a2b4b] truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
