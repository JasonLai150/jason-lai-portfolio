import { Storage, type Bucket } from "@google-cloud/storage";
import { MANIFEST_CACHE, PhotoError, emptyManifest, type PhotoManifest } from "../../src/lib/photos";
import { getEnv } from "./env";

const MANIFEST_PATH = "photos.json";

let bucketCache: Bucket | undefined;

export function getBucket(): Bucket {
  if (bucketCache) return bucketCache;
  const { bucket, serviceAccount } = getEnv();
  const storage = new Storage({ credentials: serviceAccount, projectId: serviceAccount.project_id });
  bucketCache = storage.bucket(bucket);
  return bucketCache;
}

const errorCode = (err: unknown): unknown => (err as { code?: unknown } | null)?.code;

export async function readManifest(): Promise<{ manifest: PhotoManifest; generation: string }> {
  const file = getBucket().file(MANIFEST_PATH);
  try {
    const [meta] = await file.getMetadata();
    const [buf] = await file.download();
    return { manifest: JSON.parse(buf.toString("utf8")) as PhotoManifest, generation: String(meta.generation) };
  } catch (err) {
    if (errorCode(err) === 404) return { manifest: emptyManifest(), generation: "0" };
    throw err;
  }
}

export async function writeManifest(manifest: PhotoManifest, generation: string): Promise<void> {
  await getBucket()
    .file(MANIFEST_PATH)
    .save(JSON.stringify(manifest), {
      contentType: "application/json",
      metadata: { cacheControl: MANIFEST_CACHE },
      preconditionOpts: { ifGenerationMatch: Number(generation) },
      resumable: false,
    });
}

export async function updateManifest(
  mutate: (m: PhotoManifest) => PhotoManifest,
  maxAttempts = 3,
): Promise<PhotoManifest> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { manifest, generation } = await readManifest();
    const next = mutate(manifest);
    try {
      await writeManifest(next, generation);
      return next;
    } catch (err) {
      if (errorCode(err) !== 412) throw err;
    }
  }
  throw new PhotoError("manifest write conflict", 409);
}

export async function signedUploadUrl(args: {
  path: string;
  contentType: string;
  cacheControl: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const ttlMs = (args.expiresInSeconds ?? 15 * 60) * 1000;
  const [url] = await getBucket()
    .file(args.path)
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + ttlMs,
      contentType: args.contentType,
      extensionHeaders: { "cache-control": args.cacheControl },
    });
  return url;
}

export async function objectExists(path: string): Promise<boolean> {
  const [exists] = await getBucket().file(path).exists();
  return exists;
}

export async function deleteObject(path: string): Promise<void> {
  try {
    await getBucket().file(path).delete();
  } catch (err) {
    if (errorCode(err) !== 404) throw err;
  }
}
