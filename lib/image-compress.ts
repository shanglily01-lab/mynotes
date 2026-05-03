// Client-side image compression for upload-heavy flows on mobile/iPad.
// Uses canvas to: resize to max dimension, re-encode as JPEG, auto-convert HEIC.
// Typical 5MB phone photo -> 200-800KB JPEG.

export interface CompressOptions {
  maxDimension?: number; // longest side after resize, default 1600
  quality?: number;      // JPEG quality 0-1, default 0.85
  mimeType?: string;     // output mime, default "image/jpeg"
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<File> {
  const maxDim = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.85;
  const outMime = opts.mimeType ?? "image/jpeg";

  // PDF and unknown non-image types: return as-is
  if (file.type && !file.type.startsWith("image/")) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, maxDim);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 不支持 2d 上下文");
    ctx.fillStyle = "#ffffff"; // flatten any alpha for JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, outMime, quality);
    if (!blob) throw new Error("canvas 导出失败");

    // If compression somehow produced a larger file (rare for PNG with photos),
    // keep the original to avoid waste.
    if (blob.size >= file.size && file.type.startsWith("image/jpeg")) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = outMime === "image/jpeg" ? "jpg" : outMime === "image/png" ? "png" : "img";
    return new File([blob], `${baseName}.${ext}`, { type: outMime, lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("无法解析图片（可能是不支持的格式，请改用 JPG/PNG）"));
    img.src = src;
  });
}

function fitWithin(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w / h;
  if (w >= h) return { width: max, height: Math.round(max / ratio) };
  return { width: Math.round(max * ratio), height: max };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
