import JSZip from "jszip";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { ProcessorOptions, CsvData } from "@/types";

/**
 * Main function to process the website
 */
export async function processWebsite(options: ProcessorOptions): Promise<void> {
  const { zipFile, csvFiles, config, onProgress } = options;
  
  try {
    // Update progress
    onProgress(0, "Loading files...");
    
    // Load the ZIP file
    const zip = await JSZip.loadAsync(zipFile.data);
    
    // Parse the CSV files
    const csvData = await parseCsvFiles(csvFiles);
    
    // Create a new ZIP for output
    const outputZip = new JSZip();
    
    // Process the files in the ZIP
    let processedCount = 0;
    const totalFiles = Object.keys(zip.files).length;
    
    for (const [filename, fileObj] of Object.entries(zip.files)) {
      // Check if should rename directory from public to target directory
      const shouldRenameDir = config.targetDirectory && config.targetDirectory !== "public" && 
                              filename.startsWith("public/");
      
      let targetFilename = filename;
      if (shouldRenameDir) {
        // Replace public/ with targetDirectory/
        targetFilename = filename.replace(/^public\//, `${config.targetDirectory}/`);
        onProgress(
          Math.floor((processedCount / totalFiles) * 100),
          `Renaming ${filename} to ${targetFilename}`
        );
      }
      
      // Skip directories
      if (fileObj.dir) {
        outputZip.folder(targetFilename);
        continue;
      }
      
      // Check if should process this file
      if (shouldSkipFile(filename, config)) {
        processedCount++;
        onProgress(
          Math.floor((processedCount / totalFiles) * 100),
          `Skipping ${filename}...`
        );
        continue;
      }
      
      // Process the file based on its type
      try {
        const content = await fileObj.async("uint8array");
        
        if (filename.endsWith(".html") || filename.endsWith(".htm")) {
          // Process HTML file
          onProgress(
            Math.floor((processedCount / totalFiles) * 100),
            `Processing HTML: ${filename}`
          );
          
          const processedHtml = await processHtmlFile(
            content, 
            csvData, 
            config
          );
          outputZip.file(targetFilename, processedHtml);
        } else if (filename.endsWith(".css")) {
          // Process CSS file to update paths and potentially remove external fonts
          onProgress(
            Math.floor((processedCount / totalFiles) * 100),
            `Processing CSS: ${filename}`
          );
          
          const processedCss = await processCssFile(
            content,
            config
          );
          outputZip.file(targetFilename, processedCss);
        } else {
          // Copy file as is
          outputZip.file(targetFilename, content);
        }
      } catch (err) {
        console.error(`Error processing ${filename}:`, err);
        // Still add the original file to not lose content
        const content = await fileObj.async("uint8array");
        outputZip.file(targetFilename, content);
      }
      
      processedCount++;
      onProgress(
        Math.floor((processedCount / totalFiles) * 100),
        `Processed ${processedCount} of ${totalFiles} files`
      );
    }
    
    // Add the required JS files
    outputZip.file("LLWebServerExtended.js", await getLlWebServerScript());
    outputZip.file("ew-log-viewer.js", await getLogViewerScript());
    outputZip.file("envelope-cartesian.js", await getEnvelopeCartesianScript());
    outputZip.file("scriptcustom.js", await getScriptCustomScript());
    
    // Generate the final ZIP file
    onProgress(95, "Generating ZIP file...");
    const outputBlob = await outputZip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9
      }
    });
    
    // Save the ZIP file
    onProgress(100, "Download ready");
    saveAs(outputBlob, "website.zip");
    
  } catch (error) {
    console.error("Error processing website:", error);
    throw new Error("Failed to process website: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Parse CSV files into data objects
 */
async function parseCsvFiles(csvFiles: ProcessorOptions["csvFiles"]): Promise<CsvData[]> {
  let allCsvData: CsvData[] = [];
  
  for (const csvFile of csvFiles) {
    const content = new TextDecoder().decode(csvFile.data);
    
    // Parse the CSV content
    const result = await new Promise<Papa.ParseResult<any>>((resolve) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => resolve(results)
      });
    });
    
    if (result.data && Array.isArray(result.data)) {
      // Validate and transform CSV data
      const validData = result.data.filter((row: any) => {
        return row.Name !== undefined && row.Address !== undefined;
      });
      
      allCsvData = [...allCsvData, ...validData];
    }
  }
  
  return allCsvData;
}

/**
 * Process an HTML file to add required attributes
 */
async function processHtmlFile(
  content: Uint8Array,
  csvData: CsvData[],
  config: ProcessorOptions["config"]
): Promise<string> {
  // Convert Uint8Array to string
  const htmlContent = new TextDecoder().decode(content);
  
  // Parse the HTML content
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  
  // Find elements with "nv" attribute
  const nvElements = doc.querySelectorAll("[nv]");
  
  nvElements.forEach(element => {
    const nvValue = element.getAttribute("nv");
    if (!nvValue) return;
    
    // Find corresponding CSV data (case insensitive match for Name)
    const csvRow = csvData.find(row => row.Name.toLowerCase() === nvValue.toLowerCase());
    if (!csvRow) return;
    
    // Get the element type and process based on element type
    const tagName = element.tagName.toLowerCase();
    
    // Common attribute - add data-llweb-par with Address value
    element.setAttribute("data-llweb-par", csvRow.Address);
    
    // Process the Format attribute if present
    if (csvRow.Format) {
      const formatValue = getFormattedValue(csvRow.Format);
      if (formatValue) {
        element.setAttribute("data-llweb-format", formatValue);
      }
    }
    
    // Process based on element type
    if (tagName === "input") {
      const inputType = element.getAttribute("type") || "text";
      
      if (inputType === "checkbox") {
        // For checkbox inputs
        element.setAttribute("data-llweb-refresh", "true");
        element.setAttribute("id", "chk-ctrl-" + csvRow.Address);
      } else if (inputType === "radio") {
        // For radio inputs
        element.setAttribute("name", "rad-" + csvRow.Address);
        
        const value = element.getAttribute("value");
        if (value === "true") {
          element.setAttribute("id", "rad-ctrl-" + csvRow.Address + "-1");
        } else if (value === "false") {
          element.setAttribute("id", "rad-ctrl-" + csvRow.Address + "-2");
        }
      } else {
        // For regular inputs
        element.setAttribute("data-llweb-refresh", "true");
        element.setAttribute("id", "txt-ctrl-" + csvRow.Address);
      }
    } else if (tagName === "select") {
      // For select elements
      element.setAttribute("data-llweb-refresh", "true");
      element.setAttribute("id", "sel-ctrl-" + csvRow.Address);
    } else if (tagName === "button") {
      // For button elements
      element.setAttribute("data-llweb-refresh", "true");
      
      const value = element.getAttribute("value");
      if (value === "true") {
        element.setAttribute("id", "btn-ctrl-" + csvRow.Address + "-1");
      } else if (value === "false") {
        element.setAttribute("id", "btn-ctrl-" + csvRow.Address + "-2");
      }
    }
  });
  
  // Update image paths if needed
  if (config.targetDirectory && config.targetDirectory !== "public") {
    // Update image src attributes
    const imgElements = doc.querySelectorAll("img");
    imgElements.forEach(img => {
      const src = img.getAttribute("src");
      if (src && src.startsWith("public/")) {
        img.setAttribute("src", src.replace("public/", `${config.targetDirectory}/`));
      }
    });
    
    // Update background image URLs in inline styles
    const elementsWithStyle = doc.querySelectorAll("[style*='public/']");
    elementsWithStyle.forEach(element => {
      const style = element.getAttribute("style");
      if (style) {
        element.setAttribute(
          "style", 
          style.replace(/public\//g, `${config.targetDirectory}/`)
        );
      }
    });
    
    // Update links to stylesheets
    const linkElements = doc.querySelectorAll("link[rel='stylesheet']");
    linkElements.forEach(link => {
      const href = link.getAttribute("href");
      if (href && href.includes("public/")) {
        link.setAttribute("href", href.replace("public/", `${config.targetDirectory}/`));
      }
    });
    
    // Update script src attributes
    const scriptElements = doc.querySelectorAll("script");
    scriptElements.forEach(script => {
      const src = script.getAttribute("src");
      if (src && src.startsWith("public/")) {
        script.setAttribute("src", src.replace("public/", `${config.targetDirectory}/`));
      }
    });
  }
  
  // Inject header code
  if (config.headerCode && config.headerCode.trim()) {
    const headElement = doc.head || doc.getElementsByTagName("head")[0];
    if (headElement) {
      // Create a temporary container
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = config.headerCode;
      
      // Insert all children at the end of head
      while (tempContainer.firstChild) {
        headElement.appendChild(tempContainer.firstChild);
      }
    }
  }
  
  // Inject footer code
  if (config.footerCode && config.footerCode.trim()) {
    const bodyElement = doc.body || doc.getElementsByTagName("body")[0];
    if (bodyElement) {
      // Create a temporary container
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = config.footerCode;
      
      // Insert all children before body end
      while (tempContainer.firstChild) {
        bodyElement.appendChild(tempContainer.firstChild);
      }
    }
  }
  
  // Remove external font links if configured
  if (config.removeExternalFonts) {
    const linkElements = doc.querySelectorAll("link[rel='stylesheet']");
    linkElements.forEach(link => {
      const href = link.getAttribute("href") || "";
      if (
        href.includes("fonts.googleapis.com") ||
        href.includes("animate.css") ||
        href.includes("teleport-custom-scripts")
      ) {
        link.parentNode?.removeChild(link);
      }
    });
  }
  
  // Convert back to string
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

/**
 * Process a CSS file to remove external fonts and update paths
 */
async function processCssFile(
  content: Uint8Array,
  config: ProcessorOptions["config"]
): Promise<string> {
  const cssContent = new TextDecoder().decode(content);
  
  let processedCss = cssContent;
  
  // Remove @import statements for Google Fonts if configured
  if (config.removeExternalFonts) {
    processedCss = processedCss.replace(
      /@import\s+url\(\s*['"]https?:\/\/fonts\.googleapis\.com[^)]*\s*\)\s*;?/gi,
      ""
    );
  }
  
  // Update image paths if targetDirectory is specified
  if (config.targetDirectory && config.targetDirectory !== "public") {
    // Replace all references to public/ with the target directory
    processedCss = processedCss.replace(
      /url\(['"]?public\//g, 
      `url('${config.targetDirectory}/`
    );
  }
  
  return processedCss;
}

/**
 * Determine if a file should be skipped based on config
 */
function shouldSkipFile(filename: string, config: ProcessorOptions["config"]): boolean {
  // Skip 404 files if configured
  if (config.remove404Files && (filename.includes("404.html") || filename.includes("404.css"))) {
    return true;
  }
  
  return false;
}

/**
 * Get formatted value based on format string
 */
function getFormattedValue(format: string): string {
  // Trim the format in case there are whitespace
  format = format.trim();
  
  // Match based on specific format patterns
  if (format === "XXX.Y") {
    return "%.1D";
  } else if (format === "XX.YY") {
    return "%.2D";
  } else if (format === "X.YYY") {
    return "%.3D";
  } else if (format === "%04x") {
    return "%04x";
  } else if (format === "HH:MM") {
    return "HH:MM";
  }
  
  // Return the original format if no match is found
  // This maintains compatibility with any direct formats
  return format;
}

/**
 * Get LLWebServerExtended.js content from attached assets
 */
async function getLlWebServerScript(): Promise<string> {
  try {
    const response = await fetch("/attached_assets/LLWebServerExtended.js");
    return await response.text();
  } catch (error) {
    console.error("Failed to load LLWebServerExtended.js:", error);
    return "// Could not load LLWebServerExtended.js";
  }
}

/**
 * Get ew-log-viewer.js content from attached assets
 */
async function getLogViewerScript(): Promise<string> {
  try {
    const response = await fetch("/attached_assets/ew-log-viewer.js");
    return await response.text();
  } catch (error) {
    console.error("Failed to load ew-log-viewer.js:", error);
    return "// Could not load ew-log-viewer.js";
  }
}

/**
 * Get envelope-cartesian.js content from attached assets
 */
async function getEnvelopeCartesianScript(): Promise<string> {
  try {
    const response = await fetch("/attached_assets/envelope-cartesian.js");
    return await response.text();
  } catch (error) {
    console.error("Failed to load envelope-cartesian.js:", error);
    return "// Could not load envelope-cartesian.js";
  }
}

/**
 * Get scriptcustom.js content from attached assets
 */
async function getScriptCustomScript(): Promise<string> {
  try {
    const response = await fetch("/attached_assets/scriptcustom.js");
    return await response.text();
  } catch (error) {
    console.error("Failed to load scriptcustom.js:", error);
    return "// Could not load scriptcustom.js";
  }
}
