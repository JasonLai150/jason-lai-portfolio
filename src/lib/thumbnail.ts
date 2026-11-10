import imageCompression from "browser-image-compression";

export async function makeThumbnail(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxWidthOrHeight: 1200,
    initialQuality: 0.8,
    fileType: "image/jpeg",
    useWebWorker: true,
    alwaysKeepResolution: false,
  });
}

export async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
