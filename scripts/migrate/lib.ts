import {
  captionFromFilename,
  fullPath,
  slugId,
  thumbPath,
  type PhotoEntry,
} from "../../src/lib/photos";

export { IMMUTABLE_CACHE, MANIFEST_CACHE } from "../../src/lib/photos";

export interface SourceFile {
  name: string;
  contentType: string;
}

export const THUMB_MAX = 1200;
export const THUMB_QUALITY = 80;

export const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export const isImageFile = (name: string): boolean => IMAGE_EXT.test(name);

export const extOf = (name: string): string => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
};

export function dedupeIds(files: SourceFile[]): Array<SourceFile & { id: string }> {
  const seen = new Map<string, number>();
  return files.map((f) => {
    const base = slugId(f.name);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { ...f, id: n === 1 ? base : `${base}-${n}` };
  });
}

export function buildEntry(args: {
  id: string;
  name: string;
  width: number;
  height: number;
  bytes: number;
  now: Date;
}): PhotoEntry {
  const { id, name, width, height, bytes, now } = args;
  return {
    id,
    caption: captionFromFilename(name),
    full: fullPath(id, extOf(name)),
    thumb: thumbPath(id),
    width,
    height,
    bytes,
    createdAt: now.toISOString(),
  };
}

export function orientedDimensions(meta: {
  width: number;
  height: number;
  orientation?: number;
}): { width: number; height: number } {
  return (meta.orientation ?? 1) >= 5
    ? { width: meta.height, height: meta.width }
    : { width: meta.width, height: meta.height };
}
