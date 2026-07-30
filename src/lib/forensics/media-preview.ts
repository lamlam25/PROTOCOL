import type { EvidenceFileKind } from "@/lib/evidence-files";

const MAX_PREVIEW_EDGE = 1600;
const METADATA_SCAN_BYTES = 2 * 1024 * 1024;

export interface VideoProvenanceResult {
  durationSeconds: number;
  width: number;
  height: number;
  frameTimestampSeconds: number;
  aiAssessment: "elevated" | "inconclusive";
  provenanceStatus: "metadata_signal" | "unverified";
  metadataSignals: string[];
}

const AI_TOOL_MARKERS = [
  "openai sora",
  "com.openai.sora",
  "runwayml",
  "runway gen-",
  "kling ai",
  "klingai",
  "pika labs",
  "pika.art",
  "luma dream machine",
  "stable video diffusion",
  "synthesia.io",
  "heygen",
  "haiper ai",
  "comfyui",
];

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.92
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not create preview")),
      type,
      quality
    );
  });
}

function scaledDimensions(width: number, height: number) {
  const scale = Math.min(1, MAX_PREVIEW_EDGE / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function renderPdfFirstPage(file: File): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist/webpack.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  const pdfDocument = await loadingTask.promise;

  try {
    const page = await pdfDocument.getPage(1);
    const originalViewport = page.getViewport({ scale: 1.5 });
    const dimensions = scaledDimensions(
      originalViewport.width,
      originalViewport.height
    );
    const scale = dimensions.width / originalViewport.width;
    const viewport = page.getViewport({ scale: 1.5 * scale });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    return await canvasToBlob(canvas, "image/png");
  } finally {
    await loadingTask.destroy();
  }
}

function waitForMedia(
  media: HTMLMediaElement,
  eventName: "loadedmetadata" | "seeked"
) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      media.removeEventListener(eventName, handleReady);
      media.removeEventListener("error", handleError);
    };
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("The browser could not decode this media file"));
    };
    media.addEventListener(eventName, handleReady, { once: true });
    media.addEventListener("error", handleError, { once: true });
  });
}

async function scanVideoMetadata(file: File) {
  const head = await file
    .slice(0, Math.min(file.size, METADATA_SCAN_BYTES))
    .arrayBuffer();
  const tailStart = Math.max(0, file.size - METADATA_SCAN_BYTES);
  const tail =
    tailStart > 0 ? await file.slice(tailStart, file.size).arrayBuffer() : null;
  const decoder = new TextDecoder("latin1");
  const searchable = `${decoder.decode(head)} ${tail ? decoder.decode(tail) : ""}`.toLowerCase();
  return AI_TOOL_MARKERS.filter((marker) => searchable.includes(marker));
}

export async function extractVideoFrame(file: File): Promise<{
  previewBlob: Blob;
  provenance: VideoProvenanceResult;
}> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await waitForMedia(video, "loadedmetadata");
    if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) {
      throw new Error("The video has invalid or unreadable metadata");
    }

    const timestamp = Math.min(
      Math.max(0, video.duration / 3),
      Math.max(0, video.duration - 0.05)
    );
    if (timestamp > 0) {
      video.currentTime = timestamp;
      await waitForMedia(video, "seeked");
    }

    const dimensions = scaledDimensions(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    context.drawImage(video, 0, 0, dimensions.width, dimensions.height);

    const metadataSignals = await scanVideoMetadata(file);
    return {
      previewBlob: await canvasToBlob(canvas),
      provenance: {
        durationSeconds: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        frameTimestampSeconds: timestamp,
        aiAssessment:
          metadataSignals.length > 0 ? "elevated" : "inconclusive",
        provenanceStatus:
          metadataSignals.length > 0 ? "metadata_signal" : "unverified",
        metadataSignals,
      },
    };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export async function prepareVisualPreview(
  file: File,
  kind: EvidenceFileKind
): Promise<{
  blob: Blob | null;
  videoProvenance: VideoProvenanceResult | null;
}> {
  if (kind === "image") {
    return { blob: file, videoProvenance: null };
  }
  if (kind === "pdf") {
    return { blob: await renderPdfFirstPage(file), videoProvenance: null };
  }
  if (kind === "video") {
    const result = await extractVideoFrame(file);
    return {
      blob: result.previewBlob,
      videoProvenance: result.provenance,
    };
  }
  return { blob: null, videoProvenance: null };
}
