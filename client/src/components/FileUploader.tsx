import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileData } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, FileSpreadsheet, Archive } from "lucide-react";

interface FileUploaderProps {
  type: "zip" | "csv";
  file?: FileData | null;
  files?: FileData[];
  onChange: (file: FileData | null | FileData[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  type, 
  file, 
  files = [],
  onChange
}) => {
  const isZip = type === "zip";
  const title = isZip ? "1. Upload Website ZIP File" : "2. Upload CSV Files";
  const maxSize = isZip ? 10 * 1024 * 1024 : undefined; // 10MB for ZIP files
  const multiple = !isZip;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (isZip) {
      // For ZIP, we only take the first file
      if (acceptedFiles.length > 0) {
        const zipFile = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as ArrayBuffer;
          const fileData: FileData = {
            name: zipFile.name,
            type: zipFile.type,
            size: zipFile.size,
            data: result
          };
          onChange(fileData);
        };
        reader.readAsArrayBuffer(zipFile);
      }
    } else {
      // For CSV, we can have multiple files
      const newFiles: FileData[] = [];
      
      const processFile = (index: number) => {
        if (index >= acceptedFiles.length) {
          onChange(newFiles);
          return;
        }
        
        const file = acceptedFiles[index];
        const reader = new FileReader();
        
        reader.onload = () => {
          const result = reader.result as ArrayBuffer;
          newFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: result
          });
          processFile(index + 1);
        };
        
        reader.readAsArrayBuffer(file);
      };
      
      processFile(0);
    }
  }, [isZip, onChange]);

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({ 
    onDrop, 
    accept: isZip ? { 'application/zip': ['.zip'] } as any : { 'text/csv': ['.csv'] } as any,
    maxSize,
    multiple
  });

  const removeFile = (index: number) => {
    if (isZip) {
      onChange(null);
    } else {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      onChange(newFiles);
    }
  };

  const getBorderColor = () => {
    if (isDragAccept) return "border-green-500";
    if (isDragReject) return "border-red-500";
    if (isDragActive) return "border-primary";
    return "border-gray-300";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      
      <div 
        {...getRootProps()} 
        className={`drag-drop-area rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed ${getBorderColor()} hover:border-primary transition-colors`}
      >
        <input {...getInputProps()} />
        {isZip ? (
          <Archive className="h-12 w-12 text-gray-400 mb-4" />
        ) : (
          <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-4" />
        )}
        
        <p className="text-gray-700 mb-2">Upload {isZip ? "a file" : "files"} or drag and drop</p>
        <p className="text-xs text-gray-500 mb-4">
          {isZip ? "ZIP up to 10MB" : "CSV files with Name and Address columns"}
        </p>
        <Button variant="default">Select {isZip ? "File" : "Files"}</Button>
      </div>
      
      {/* Display uploaded files */}
      {isZip && file ? (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>{file.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => removeFile(0)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : null}
      
      {!isZip && files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="p-3 bg-green-50 text-green-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeFile(index)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
