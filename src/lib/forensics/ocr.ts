import { createWorker } from "tesseract.js";
import type { OcrResult, OcrExtractedFields } from "./types";

// Bangladesh NID numbers are 10, 13, or 17 digits. Dates: common d/m/y forms.
const NID_PATTERN = /\b\d{17}\b|\b\d{13}\b|\b\d{10}\b/;
const DATE_PATTERN = /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/;

function extractFields(text: string): OcrExtractedFields {
  return {
    nationalId: text.match(NID_PATTERN)?.[0],
    date: text.match(DATE_PATTERN)?.[0],
  };
}

/**
 * Runs entirely client-side in a Web Worker (Tesseract.js manages this). Set
 * expectations in the UI: reliable on printed/typed text, unreliable on
 * handwriting — always show results in an editable review form, never
 * auto-commit.
 */
export async function runOcr(
  file: Blob,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  const worker = await createWorker(["eng", "ben"], undefined, {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress?.(m.progress);
    },
  });

  try {
    const {
      data: { text, confidence },
    } = await worker.recognize(file);
    return { text, confidence, extractedFields: extractFields(text) };
  } finally {
    await worker.terminate();
  }
}
