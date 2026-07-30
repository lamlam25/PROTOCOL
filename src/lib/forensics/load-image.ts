/** Client-side only — decodes a Blob into an HTMLImageElement via an object URL. */
export async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.src = url;
    });
    return img;
  } finally {
    // Safe once onload has fired: the browser has already decoded the bitmap
    // into the Image element, it doesn't re-fetch the URL on draw.
    URL.revokeObjectURL(url);
  }
}
