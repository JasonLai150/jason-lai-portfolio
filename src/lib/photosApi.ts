import { emptyManifest, type PhotoEntry, type PhotoManifest } from "./photos";

export async function fetchManifest(baseUrl: string): Promise<PhotoManifest> {
  const res = await fetch(`${baseUrl}/photos.json?t=${Date.now()}`, { cache: "no-store" });
  if (res.status === 404) return emptyManifest();
  if (!res.ok) throw new Error(`Failed to load photos (${res.status})`);
  return (await res.json()) as PhotoManifest;
}

async function failure(res: Response): Promise<Error> {
  let message = `request failed (${res.status})`;
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) message = body.error;
  } catch {
    // non-JSON body: keep the generic message
  }
  return new Error(message);
}

function authed(password: string, init: RequestInit = {}, json?: unknown): RequestInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${password}` };
  if (json !== undefined) headers["Content-Type"] = "application/json";
  return { ...init, headers, body: json !== undefined ? JSON.stringify(json) : undefined };
}

export async function adminPing(password: string): Promise<boolean> {
  const res = await fetch("/api/admin/ping", authed(password));
  if (res.status === 401) return false;
  if (!res.ok) throw await failure(res);
  return true;
}

export async function requestUploadUrl(
  password: string,
  args: { id: string; kind: "full" | "thumb"; contentType: string },
): Promise<{ url: string; headers: Record<string, string> }> {
  const res = await fetch("/api/photos/upload-url", authed(password, { method: "POST" }, args));
  if (!res.ok) throw await failure(res);
  return (await res.json()) as { url: string; headers: Record<string, string> };
}

export async function putToSignedUrl(url: string, headers: Record<string, string>, body: Blob): Promise<void> {
  const res = await fetch(url, { method: "PUT", headers, body });
  if (!res.ok) throw new Error(`upload failed (${res.status})`);
}

export async function createPhoto(
  password: string,
  body: { id: string; caption: string; contentType: string; width: number; height: number; bytes: number },
): Promise<PhotoEntry> {
  const res = await fetch("/api/photos", authed(password, { method: "POST" }, body));
  if (!res.ok) throw await failure(res);
  return (await res.json()) as PhotoEntry;
}

export async function updateCaption(password: string, id: string, caption: string): Promise<PhotoEntry> {
  const res = await fetch(`/api/photos/${encodeURIComponent(id)}`, authed(password, { method: "PATCH" }, { caption }));
  if (!res.ok) throw await failure(res);
  return (await res.json()) as PhotoEntry;
}

export async function deletePhoto(password: string, id: string): Promise<void> {
  const res = await fetch(`/api/photos/${encodeURIComponent(id)}`, authed(password, { method: "DELETE" }));
  if (!res.ok) throw await failure(res);
}
