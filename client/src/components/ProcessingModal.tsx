import React from "react";
import { Progress } from "@/components/ui/progress";

interface ProcessingModalProps {
  isOpen: boolean;
  progress: number;
  message: string;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({ isOpen, progress, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Files</h3>
        <div className="mb-4">
          <Progress value={progress} className="h-2.5" />
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        <p className="text-sm text-gray-500">This may take a few moments. Please don't close the browser.</p>
      </div>
    </div>
  );
};

export default ProcessingModal;
