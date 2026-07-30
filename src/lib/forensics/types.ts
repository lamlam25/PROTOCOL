export type RiskFlag = "none" | "low" | "medium" | "high";

export interface ElaResult {
  score: number;
  heatmapBlob: Blob;
  riskFlag: RiskFlag;
}

export interface PhashMatch {
  relatedId: string;
  hammingDistance: number;
}

export interface OcrExtractedFields {
  nationalId?: string;
  date?: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
  extractedFields: OcrExtractedFields;
}

export interface ForensicResult {
  sha256: string;
  ela: ElaResult;
  phash: string;
  ocr: OcrResult;
  riskFlag: RiskFlag;
}
