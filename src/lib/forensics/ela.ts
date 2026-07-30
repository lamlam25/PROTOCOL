import { loadImage } from "./load-image";
import type { ElaResult, RiskFlag } from "./types";

/**
 * Error Level Analysis: draw the original, re-encode it at a fixed JPEG
 * quality, diff the two pixel-by-pixel, amplify the difference into a
 * heatmap. This is a heuristic signal for human review, not proof of
 * tampering — legitimately re-saved/rescaled images can also show elevated
 * error levels. Always present alongside the original for a human to judge.
 */
const RECOMPRESS_QUALITY = 0.9;
const AMPLIFY_SCALE = 15;
const MEDIUM_THRESHOLD = 40;
const HIGH_THRESHOLD = 65;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      type,
      quality
    );
  });
}

function scoreToRiskFlag(score: number): RiskFlag {
  if (score >= HIGH_THRESHOLD) return "high";
  if (score >= MEDIUM_THRESHOLD) return "medium";
  if (score >= 15) return "low";
  return "none";
}

export async function computeELA(file: Blob): Promise<ElaResult> {
  const original = await loadImage(file);
  const { width, height } = original;

  const originalCanvas = document.createElement("canvas");
  originalCanvas.width = width;
  originalCanvas.height = height;
  const originalCtx = originalCanvas.getContext("2d");
  if (!originalCtx) throw new Error("Canvas 2D context unavailable");
  originalCtx.drawImage(original, 0, 0);
  const originalData = originalCtx.getImageData(0, 0, width, height);

  const recompressedBlob = await canvasToBlob(
    originalCanvas,
    "image/jpeg",
    RECOMPRESS_QUALITY
  );
  const recompressedImg = await loadImage(recompressedBlob);
  const recompressedCanvas = document.createElement("canvas");
  recompressedCanvas.width = width;
  recompressedCanvas.height = height;
  const recompressedCtx = recompressedCanvas.getContext("2d");
  if (!recompressedCtx) throw new Error("Canvas 2D context unavailable");
  recompressedCtx.drawImage(recompressedImg, 0, 0);
  const recompressedData = recompressedCtx.getImageData(0, 0, width, height);

  const heatmapCanvas = document.createElement("canvas");
  heatmapCanvas.width = width;
  heatmapCanvas.height = height;
  const heatmapCtx = heatmapCanvas.getContext("2d");
  if (!heatmapCtx) throw new Error("Canvas 2D context unavailable");
  const heatmapData = heatmapCtx.createImageData(width, height);

  let totalDiff = 0;
  const pixelCount = width * height;
  const a = originalData.data;
  const b = recompressedData.data;
  const out = heatmapData.data;

  for (let i = 0; i < a.length; i += 4) {
    const diff =
      (Math.abs(a[i] - b[i]) +
        Math.abs(a[i + 1] - b[i + 1]) +
        Math.abs(a[i + 2] - b[i + 2])) /
      3;
    const amplified = Math.min(255, diff * AMPLIFY_SCALE);
    out[i] = amplified;
    out[i + 1] = amplified;
    out[i + 2] = amplified;
    out[i + 3] = 255;
    totalDiff += diff;
  }
  heatmapCtx.putImageData(heatmapData, 0, 0);

  const meanDiff = totalDiff / pixelCount;
  const score = Math.min(100, meanDiff * 3);
  const heatmapBlob = await canvasToBlob(heatmapCanvas, "image/png");

  return { score, heatmapBlob, riskFlag: scoreToRiskFlag(score) };
}
