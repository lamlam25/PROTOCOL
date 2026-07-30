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

export type AiImageStatus =
  | "likely_ai"
  | "likely_real"
  | "inconclusive"
  | "unavailable";

export interface AiImageAnalysis {
  status: AiImageStatus;
  aiProbability: number;
  realProbability: number;
  modelId: string | null;
  reviewRequired: boolean;
  source: "original_image" | "video_frame";
}

export interface ForensicResult {
  sha256: string;
  ela: ElaResult;
  phash: string;
  ocr: OcrResult;
  riskFlag: RiskFlag;
}

export type AnalysisStatus = "complete" | "not_applicable" | "manual_review";
