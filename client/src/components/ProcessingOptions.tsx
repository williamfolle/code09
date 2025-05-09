import React from "react";
import { ProcessingConfig } from "@/types";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProcessingOptionsProps {
  config: ProcessingConfig;
  onChange: (config: Partial<ProcessingConfig>) => void;
}

const ProcessingOptions: React.FC<ProcessingOptionsProps> = ({ config, onChange }) => {
  const handleDirectoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ targetDirectory: e.target.value });
  };

  const handleRemove404Change = (checked: boolean) => {
    onChange({ remove404Files: checked });
  };

  const handleRemoveFontsChange = (checked: boolean) => {
    onChange({ removeExternalFonts: checked });
  };

  const handleHeaderCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ headerCode: e.target.value });
  };

  const handleFooterCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ footerCode: e.target.value });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h3 className="text-lg font-medium text-gray-800 mb-4">3. Processing Options</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="target-directory" className="text-sm font-medium text-gray-700 mb-2">
            Target Directory for Images
          </Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              /
            </span>
            <Input
              id="target-directory"
              value={config.targetDirectory}
              onChange={handleDirectoryChange}
              className="rounded-l-none"
              placeholder="img"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Default is "img". This is where your images will be stored.</p>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="remove-404-files"
                checked={config.remove404Files}
                onCheckedChange={handleRemove404Change}
              />
              <div>
                <Label 
                  htmlFor="remove-404-files" 
                  className="font-medium text-gray-700"
                >
                  Remove 404 Files
                </Label>
                <p className="text-gray-500 text-sm">Remove 404.html and 404.css from the output</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="remove-external-fonts"
                checked={config.removeExternalFonts}
                onCheckedChange={handleRemoveFontsChange}
              />
              <div>
                <Label 
                  htmlFor="remove-external-fonts" 
                  className="font-medium text-gray-700"
                >
                  Remove External Font Links
                </Label>
                <p className="text-gray-500 text-sm">Remove Google Fonts and other external CSS links</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div>
            <Label 
              htmlFor="header-code" 
              className="text-sm font-medium text-gray-700 mb-2"
            >
              Custom Code to Add (Header)
            </Label>
            <Textarea
              id="header-code"
              value={config.headerCode}
              onChange={handleHeaderCodeChange}
              rows={6}
              className="font-mono text-sm bg-gray-50 resize-y"
            />
            <p className="mt-1 text-xs text-gray-500">Optional: Code to insert in the header of all HTML files</p>
          </div>
          
          <div className="mt-4">
            <Label 
              htmlFor="footer-code" 
              className="text-sm font-medium text-gray-700 mb-2"
            >
              Custom Code to Add (Footer)
            </Label>
            <Textarea
              id="footer-code"
              value={config.footerCode}
              onChange={handleFooterCodeChange}
              rows={6}
              className="font-mono text-sm bg-gray-50 resize-y"
            />
            <p className="mt-1 text-xs text-gray-500">Optional: Code to insert before the closing body tag of all HTML files</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingOptions;
