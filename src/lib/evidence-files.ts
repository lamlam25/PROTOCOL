export type EvidenceFileKind =
  | "image"
  | "pdf"
  | "video"
  | "document"
  | "audio";

export const EVIDENCE_ACCEPT =
  "image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/x-wav,text/plain,text/csv,application/rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const MAX_EVIDENCE_FILES = 5;
export const MAX_EVIDENCE_TOTAL_BYTES = 100 * 1024 * 1024;

const MIME_TO_KIND: Record<string, EvidenceFileKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "text/plain": "document",
  "text/csv": "document",
  "application/rtf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "document",
};

const EXTENSION_TO_KIND: Record<string, EvidenceFileKind> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  pdf: "pdf",
  mp4: "video",
  webm: "video",
  mov: "video",
  mp3: "audio",
  wav: "audio",
  txt: "document",
  csv: "document",
  rtf: "document",
  doc: "document",
  docx: "document",
};

export function getEvidenceFileKind(
  mimeType: string,
  filename: string
): EvidenceFileKind | null {
  const normalizedType = mimeType.toLowerCase().split(";")[0].trim();
  const fromMime = MIME_TO_KIND[normalizedType];
  if (fromMime) return fromMime;

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TO_KIND[extension] ?? null;
}

export function getEvidenceFileLimit(kind: EvidenceFileKind) {
  return kind === "video" ? 75 * 1024 * 1024 : 20 * 1024 * 1024;
}

function startsWithBytes(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function asciiAt(bytes: Uint8Array, start: number, length: number) {
  return new TextDecoder("ascii").decode(bytes.slice(start, start + length));
}

export async function hasValidEvidenceSignature(
  file: Blob,
  kind: EvidenceFileKind,
  filename: string
) {
  const bytes = new Uint8Array(
    await file.slice(0, Math.min(file.size, 32)).arrayBuffer()
  );
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";

  if (kind === "image") {
    if (extension === "jpg" || extension === "jpeg") {
      return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
    }
    if (extension === "png") {
      return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47]);
    }
    return asciiAt(bytes, 0, 4) === "RIFF" && asciiAt(bytes, 8, 4) === "WEBP";
  }
  if (kind === "pdf") return asciiAt(bytes, 0, 4) === "%PDF";
  if (kind === "video") {
    if (extension === "webm") {
      return startsWithBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
    }
    return asciiAt(bytes, 4, 4) === "ftyp";
  }
  if (kind === "audio") {
    if (extension === "wav") {
      return asciiAt(bytes, 0, 4) === "RIFF" && asciiAt(bytes, 8, 4) === "WAVE";
    }
    return (
      asciiAt(bytes, 0, 3) === "ID3" ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
    );
  }
  if (extension === "doc") {
    return startsWithBytes(bytes, [
      0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
    ]);
  }
  if (extension === "docx") {
    return startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04]);
  }
  if (extension === "rtf") return asciiAt(bytes, 0, 5) === "{\\rtf";
  return extension === "txt" || extension === "csv";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
