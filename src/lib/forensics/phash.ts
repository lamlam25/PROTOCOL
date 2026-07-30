import { loadImage } from "./load-image";

/**
 * Hand-rolled dHash (difference hash): resize to 9x8 grayscale, compare each
 * pixel to its right neighbor, 64 bits -> 16 hex chars. Zero dependencies,
 * sufficient for catching the same document re-photographed/rescanned.
 * Less rotation-robust than a full DCT pHash — `blockhash-core` is the
 * drop-in upgrade path if that becomes a real need.
 */
const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;

export async function computeDHash(file: Blob): Promise<string> {
  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = HASH_WIDTH;
  canvas.height = HASH_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, HASH_WIDTH, HASH_HEIGHT);
  const { data } = ctx.getImageData(0, 0, HASH_WIDTH, HASH_HEIGHT);

  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  let bits = "";
  for (let row = 0; row < HASH_HEIGHT; row++) {
    for (let col = 0; col < HASH_WIDTH - 1; col++) {
      const left = gray[row * HASH_WIDTH + col];
      const right = gray[row * HASH_WIDTH + col + 1];
      bits += left > right ? "1" : "0";
    }
  }

  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

/** Distance between two 16-hex-char (64-bit) dHashes. Infinity if malformed/mismatched length. */
export function hammingDistanceHex(hexA: string, hexB: string): number {
  if (hexA.length !== hexB.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hexA.length; i++) {
    let xor = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

export const DUPLICATE_HAMMING_THRESHOLD = 8;
