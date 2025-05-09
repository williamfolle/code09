export type ProcessStep = "upload" | "process" | "download";

export interface FileData {
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
}

export interface ProcessingConfig {
  targetDirectory: string;
  remove404Files: boolean;
  removeExternalFonts: boolean;
  headerCode: string;
  footerCode: string;
}

export interface CsvData {
  Name: string;
  Address: string;
  Format?: string;
  [key: string]: string | undefined;
}

export interface ProcessorOptions {
  zipFile: FileData;
  csvFiles: FileData[];
  config: ProcessingConfig;
  onProgress: (progress: number, message: string) => void;
}
