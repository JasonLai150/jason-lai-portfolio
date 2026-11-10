/**
 * One-off migration: Supabase Storage bucket `jason-photos` -> GCS bucket + photos.json manifest.
 *
 * Run with `npm run migrate`.
 * Requires `.env.local` with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GCS_BUCKET, and
 * GOOGLE_APPLICATION_CREDENTIALS=./portfolio-admin-key.json set in the shell
 * (the service account key; no extra `gcloud` login needed).
 * Safe to re-run: uploads are skipped when both full/ and thumbs/ objects already exist.
 */
import { readFileSync } from "node:fs";
import { Storage } from "@google-cloud/storage";
import sharp from "sharp";
import { emptyManifest, thumbPath, fullPath, type PhotoEntry } from "../src/lib/photos";
import {
  IMMUTABLE_CACHE,
  MANIFEST_CACHE,
  THUMB_MAX,
  THUMB_QUALITY,
  buildEntry,
  dedupeIds,
  extOf,
  isImageFile,
  orientedDimensions,
  type SourceFile,
} from "./migrate/lib";

function loadEnvFile(path: string): void {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

async function main(): Promise<void> {
  loadEnvFile(".env.local");
  const supabaseUrl = need("VITE_SUPABASE_URL").replace(/\/+$/, "");
  const anon = need("VITE_SUPABASE_ANON_KEY");
  const bucket = new Storage().bucket(need("GCS_BUCKET"));

  const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/jason-photos`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } }),
  });
  if (!listRes.ok) throw new Error(`Supabase list failed: ${listRes.status} ${await listRes.text()}`);
  const listed = (await listRes.json()) as Array<{ name: string; metadata?: { mimetype?: string } | null }>;
  const sources: SourceFile[] = listed
    .filter((o) => o.metadata && isImageFile(o.name))
    .map((o) => ({ name: o.name, contentType: o.metadata?.mimetype ?? "application/octet-stream" }));
  const files = dedupeIds(sources);
  console.log(`found ${files.length} images`);

  const now = new Date();
  const manifest = emptyManifest(now);
  const entries: PhotoEntry[] = [];
  const failures: string[] = [];
  let totalBytes = 0;
  let skipped = 0;

  for (const f of files) {
    try {
      const res = await fetch(
        `${supabaseUrl}/storage/v1/object/public/jason-photos/${encodeURIComponent(f.name)}`,
      );
      if (!res.ok) throw new Error(`download ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if (!meta.width || !meta.height) throw new Error("could not read dimensions");
      const { width, height } = orientedDimensions({
        width: meta.width,
        height: meta.height,
        orientation: meta.orientation,
      });

      const fullKey = fullPath(f.id, extOf(f.name));
      const thumbKey = thumbPath(f.id);
      const [fullExists] = await bucket.file(fullKey).exists();
      const [thumbExists] = await bucket.file(thumbKey).exists();
      if (fullExists && thumbExists) {
        skipped++;
      } else {
        const thumb = await sharp(buf)
          .rotate()
          .resize({ width: THUMB_MAX, height: THUMB_MAX, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: THUMB_QUALITY })
          .toBuffer();
        await bucket.file(fullKey).save(buf, {
          resumable: false,
          contentType: f.contentType,
          metadata: { cacheControl: IMMUTABLE_CACHE },
        });
        await bucket.file(thumbKey).save(thumb, {
          resumable: false,
          contentType: "image/jpeg",
          metadata: { cacheControl: IMMUTABLE_CACHE },
        });
      }
      entries.push(buildEntry({ id: f.id, name: f.name, width, height, bytes: buf.length, now }));
      totalBytes += buf.length;
      console.log(`ok ${f.id}`);
    } catch (err) {
      failures.push(`${f.name}: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`FAIL ${f.name}`);
    }
  }

  manifest.photos = entries;
  await bucket.file("photos.json").save(JSON.stringify(manifest, null, 2), {
    resumable: false,
    contentType: "application/json",
    metadata: { cacheControl: MANIFEST_CACHE },
  });

  console.log(
    `migrated ${entries.length} photos, ${(totalBytes / 1024 / 1024).toFixed(1)} MB, ${skipped} skipped uploads`,
  );
  if (failures.length) {
    console.error(`${failures.length} failures:`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
