import { emptyManifest, type PhotoManifest } from "./photos";

export async function fetchManifest(baseUrl: string): Promise<PhotoManifest> {
  const res = await fetch(`${baseUrl}/photos.json?t=${Date.now()}`, { cache: "no-store" });
  if (res.status === 404) return emptyManifest();
  if (!res.ok) throw new Error(`Failed to load photos (${res.status})`);
  return (await res.json()) as PhotoManifest;
}
