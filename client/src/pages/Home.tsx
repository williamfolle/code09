import { useState } from "react";
import Navbar from "@/components/Navbar";
import FileUploader from "@/components/FileUploader";
import ProcessingOptions from "@/components/ProcessingOptions";
import ProcessSteps from "@/components/ProcessSteps";
import ProcessingModal from "@/components/ProcessingModal";
import { Button } from "@/components/ui/button";
import { Settings, CircleDot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processWebsite } from "@/lib/processor";
import { FileData, ProcessingConfig, ProcessStep } from "@/types";

export default function Home() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  
  const [zipFile, setZipFile] = useState<FileData | null>(null);
  const [csvFiles, setCsvFiles] = useState<FileData[]>([]);
  
  const [config, setConfig] = useState<ProcessingConfig>({
    targetDirectory: "img",
    remove404Files: true,
    removeExternalFonts: true,
    headerCode: `<!--custom code 1-->
<script type="text/javascript" src="LLWebServerExtended.js"></script>
<script type='text/javascript' src='../js/base.js'></script>
<link rel='stylesheet' type='text/css' href='../style/common.css'>
<!--custom code 2-->
<script type="text/javascript" src="ew-log-viewer.js"></script>
<script type="text/javascript" src="envelope-cartesian.js"></script>`,
    footerCode: `<!--custom code 3-->
<script type='text/javascript'>
    LLWebServer.AutoRefreshStart(1000);
    showLoginStatus();
    localStorage.setItem("showNeutralNavbar", true);
</script>
<script>
    document.addEventListener('DOMContentLoaded', init);
</script>
<script
      defer=""
      src="scriptcustom.js"
></script>`
  });

  const handleProcessFiles = async () => {
    // If we're already at download step, trigger download directly
    if (currentStep === "download") {
      // For download step, we don't need to process again
      // The browser will automatically download from the blob URL
      toast({
        title: "Download Started",
        description: "Your processed website is being downloaded.",
      });
      return;
    }
    
    if (!zipFile) {
      toast({
        title: "Missing ZIP File",
        description: "Please upload a website ZIP file.",
        variant: "destructive"
      });
      return;
    }

    if (csvFiles.length === 0) {
      toast({
        title: "Missing CSV Files",
        description: "Please upload at least one CSV file.",
        variant: "destructive"
      });
      return;
    }

    try {
      setCurrentStep("process");
      setShowProcessingModal(true);
      
      // Process the website
      await processWebsite({
        zipFile,
        csvFiles,
        config,
        onProgress: (percentage, message) => {
          setProgress(percentage);
          setProcessingStep(message);
        }
      });

      // Update UI to show download step
      setCurrentStep("download");
      setShowProcessingModal(false);
      
      toast({
        title: "Processing Complete",
        description: "Your website has been processed successfully. Click the Download button to save it.",
      });
    } catch (error) {
      console.error("Processing error:", error);
      setShowProcessingModal(false);
      setCurrentStep("upload");
      
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during processing.",
        variant: "destructive"
      });
    }
  };

  const handleZipFileChange = (data: FileData | FileData[] | null) => {
    if (data === null || !Array.isArray(data)) {
      setZipFile(data as FileData | null);
    }
  };

  const handleCsvFilesChange = (data: FileData | FileData[] | null) => {
    if (Array.isArray(data)) {
      setCsvFiles(data);
    }
  };

  const handleConfigChange = (newConfig: Partial<ProcessingConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Introduction */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Process Website Files</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your website ZIP and CSV files to process and generate a new website with dynamic elements.
          </p>
          <div className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All processing happens in your browser
          </div>
        </div>
        
        {/* Process Steps */}
        <ProcessSteps currentStep={currentStep} progress={progress} />
        
        {/* File Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <FileUploader 
            type="zip" 
            file={zipFile} 
            onChange={handleZipFileChange as any} 
          />
          <FileUploader 
            type="csv" 
            files={csvFiles} 
            onChange={handleCsvFilesChange as any} 
          />
        </div>
        
        {/* Processing Options */}
        <ProcessingOptions 
          config={config} 
          onChange={handleConfigChange} 
        />
        
        {/* Action Button */}
        <div className="text-center">
          <Button 
            onClick={handleProcessFiles} 
            size="lg" 
            className="inline-flex items-center px-6 py-3"
          >
            {currentStep === "upload" ? (
              <>
                <CircleDot className="h-5 w-5 mr-2" />
                Process Files and Generate Website
              </>
            ) : currentStep === "process" ? (
              <>
                <Settings className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                  />
                </svg>
                Download Processed Website
              </>
            )}
          </Button>
        </div>
        
        {/* Processing Modal */}
        <ProcessingModal 
          isOpen={showProcessingModal} 
          progress={progress} 
          message={processingStep} 
        />
      </main>
      
      <footer className="container mx-auto px-4 py-6 mt-8">
        <p className="text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Website ZIP Processor. All processing happens client-side - your files are not uploaded to any server.
        </p>
      </footer>
    </div>
  );
}
