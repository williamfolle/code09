import React from "react";
import { ProcessStep } from "@/types";
import { cn } from "@/lib/utils";
import { Upload, CircleDot, Download } from "lucide-react";

interface ProcessStepsProps {
  currentStep: ProcessStep;
  progress: number;
}

const ProcessSteps: React.FC<ProcessStepsProps> = ({ currentStep, progress }) => {
  const stepInfo = [
    { id: "upload", label: "Upload Files", icon: Upload },
    { id: "process", label: "Process", icon: CircleDot },
    { id: "download", label: "Download", icon: Download },
  ] as const;

  // Determine status of each step
  const getStepStatus = (stepId: ProcessStep) => {
    if (currentStep === stepId) return "active";
    
    const stepIndex = stepInfo.findIndex(s => s.id === stepId);
    const currentIndex = stepInfo.findIndex(s => s.id === currentStep);
    
    return stepIndex < currentIndex ? "completed" : "pending";
  };

  return (
    <div className="flex justify-between items-center mb-12 max-w-3xl mx-auto">
      {stepInfo.map((step, index) => (
        <div key={step.id} className="flex items-center" style={{ flex: index < stepInfo.length - 1 ? 1 : 'none' }}>
          {/* Step Circle with Icon */}
          <div className="flex flex-col items-center">
            <div 
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center step-circle transition-all duration-300",
                getStepStatus(step.id) === "active" ? "bg-primary text-white" : 
                getStepStatus(step.id) === "completed" ? "bg-green-500 text-white" : 
                "bg-gray-200 text-gray-500"
              )}
            >
              <step.icon className="h-6 w-6" />
            </div>
            <span 
              className={cn(
                "mt-2 text-sm font-medium",
                getStepStatus(step.id) === "active" ? "text-gray-700" : 
                getStepStatus(step.id) === "completed" ? "text-gray-700" : 
                "text-gray-500"
              )}
            >
              {step.label}
            </span>
          </div>
          
          {/* Progress Bar (except after last step) */}
          {index < stepInfo.length - 1 && (
            <div className="flex-1 h-1 bg-gray-200 mx-4 relative">
              <div 
                className="absolute inset-0 bg-primary transition-all duration-300"
                style={{ 
                  width: currentStep === "upload" ? "0%" : 
                    currentStep === "process" ? `${progress}%` : 
                    "100%" 
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProcessSteps;
