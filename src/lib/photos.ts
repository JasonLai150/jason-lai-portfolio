export interface PhotoEntry {
  id: string;
  caption: string;
  full: string;
  thumb: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
}

export interface PhotoManifest {
  version: 1;
  updatedAt: string;
  photos: PhotoEntry[];
}

export interface Photo {
  name: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
}

export class PhotoError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "PhotoError";
  }
}

export const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
export const MANIFEST_CACHE = "no-cache";

export const ID_ANY = /^[a-z0-9-]{1,64}$/;
export const ID_NEW = /^[a-z0-9]{6,16}$/;

export const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function isValidId(v: unknown): v is string {
  return typeof v === "string" && ID_ANY.test(v);
}

export function isValidNewId(v: unknown): v is string {
  return typeof v === "string" && ID_NEW.test(v);
}

export function newId(): string {
  const bytes = new Uint8Array(10);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
}

const stripExtension = (filename: string) => filename.replace(/\.[^/.]+$/, "");

export function slugId(filename: string): string {
  const slug = stripExtension(filename)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return slug || "photo";
}

export function captionFromFilename(filename: string): string {
  return stripExtension(filename);
}

export function normalizeCaption(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length >= 1 && t.length <= 200 ? t : null;
}

export function extForContentType(ct: unknown): string | null {
  return typeof ct === "string" && Object.hasOwn(ALLOWED_CONTENT_TYPES, ct)
    ? ALLOWED_CONTENT_TYPES[ct]
    : null;
}

export const fullPath = (id: string, ext: string) => `full/${id}.${ext}`;
export const thumbPath = (id: string) => `thumbs/${id}.jpg`;
export const photoUrl = (baseUrl: string, path: string) => `${baseUrl}/${path}`;

export function emptyManifest(now: Date = new Date()): PhotoManifest {
  return { version: 1, updatedAt: now.toISOString(), photos: [] };
}

export function sortPhotos(photos: PhotoEntry[]): PhotoEntry[] {
  return [...photos].sort((a, b) =>
    a.caption.localeCompare(b.caption, undefined, { sensitivity: "base" }),
  );
}

export function toPhotos(manifest: PhotoManifest, baseUrl: string): Photo[] {
  return sortPhotos(manifest.photos).map((p) => ({
    name: p.id,
    url: photoUrl(baseUrl, p.full),
    thumbnailUrl: photoUrl(baseUrl, p.thumb),
    caption: p.caption,
  }));
}

export function addPhoto(m: PhotoManifest, entry: PhotoEntry, now: Date = new Date()): PhotoManifest {
  if (m.photos.some((p) => p.id === entry.id)) {
    throw new PhotoError(`Photo ${entry.id} already exists`, 409);
  }
  return { ...m, updatedAt: now.toISOString(), photos: [...m.photos, entry] };
}

export function setCaption(
  m: PhotoManifest,
  id: string,
  caption: string,
  now: Date = new Date(),
): PhotoManifest {
  if (!m.photos.some((p) => p.id === id)) throw new PhotoError(`Photo ${id} not found`, 404);
  return {
    ...m,
    updatedAt: now.toISOString(),
    photos: m.photos.map((p) => (p.id === id ? { ...p, caption } : p)),
  };
}

export function removePhoto(
  m: PhotoManifest,
  id: string,
  now: Date = new Date(),
): { manifest: PhotoManifest; removed: PhotoEntry } {
  const removed = m.photos.find((p) => p.id === id);
  if (!removed) throw new PhotoError(`Photo ${id} not found`, 404);
  return {
    manifest: { ...m, updatedAt: now.toISOString(), photos: m.photos.filter((p) => p.id !== id) },
    removed,
  };
}
