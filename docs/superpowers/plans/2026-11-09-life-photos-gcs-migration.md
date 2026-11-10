# Life Photos GCS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the `/life` photo gallery from Supabase Storage to a public Google Cloud Storage bucket driven by a `photos.json` manifest, add a password-gated `/admin` page for upload / caption / delete, and generate downscaled thumbnails at upload time.

**Architecture:** The public page fetches one manifest file straight from the bucket, never from our API. Three small Vercel serverless functions in `api/` (signed upload URL, create entry, patch/delete entry) are the only writers of the manifest, guarded by a shared Bearer password and GCS generation preconditions. Pure manifest logic lives in `src/lib/photos.ts` and is shared by the frontend, the API, and the one-off migration script.

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind + shadcn/ui (existing); `@google-cloud/storage`; `@vercel/node`; `browser-image-compression` (browser thumbnails); `sharp` + `tsx` (migration script); `vitest` (new test runner); `gcloud` CLI (bucket setup).

**Spec:** `docs/superpowers/specs/2026-11-09-life-photos-gcs-migration-design.md`

## Global Constraints

- Bucket location `us-central1`, Standard class, uniform bucket-level access, public access prevention off, versioning off. `allUsers` → `roles/storage.objectViewer`.
- Bucket layout: `photos.json`, `full/<id>.<ext>`, `thumbs/<id>.jpg`. Paths in the manifest are bucket-relative. URLs are `${VITE_PHOTOS_BASE_URL}/${path}`.
- Manifest schema exactly as in the spec: `{ version: 1, updatedAt, photos: [{ id, caption, full, thumb, width, height, bytes, createdAt }] }`.
- Id grammar everywhere an id is accepted: `/^[a-z0-9-]{1,64}$/`. New-upload ids (minted by the admin page, enforced by `upload-url` and `POST /api/photos`): `/^[a-z0-9]{6,16}$/`, generated as 10 chars.
- Caption: trimmed, 1 to 200 characters.
- Thumbnails: downscale only, longest side 1200 px, never upscale, JPEG quality 0.8, EXIF orientation applied, no EXIF carried over.
- Cache headers: `photos.json` → `no-cache`; `full/*` and `thumbs/*` → `public, max-age=31536000, immutable`. Client appends `?t=<Date.now()>` when fetching the manifest.
- Allowed upload content types: `image/jpeg` (ext `jpg`), `image/png` (`png`), `image/webp` (`webp`). Migrated files keep their original extension.
- Auth: `Authorization: Bearer <ADMIN_PASSWORD>` on every admin API call, compared in constant time. Wrong/missing → 401 `{ error: "unauthorized" }`.
- All API responses are JSON; errors are `{ error: string }`.
- Display order on `/life`: alphabetical by caption, case-insensitive `localeCompare`, sorted client-side.
- Public page appearance and behavior unchanged: same grid classes, `aspect-square` + `object-cover` cells, same hover overlay, same lightbox, same loading / error / empty copy.
- Env vars: `VITE_PHOTOS_BASE_URL` (public), `GCS_BUCKET`, `GCS_SERVICE_ACCOUNT_KEY` (base64 of SA JSON), `ADMIN_PASSWORD` (server-only). No secrets committed; `.env.local` becomes untracked.
- Tests live under `tests/`, never under `api/` (Vercel would deploy them as functions). Files/dirs under `api/` starting with `_` are not routes.
- Originals are uploaded byte-for-byte (no EXIF stripping); the user left this at the spec default.

## Review Focus

1. **A Bearer value whose length differs from the password** must return 401, not crash: `crypto.timingSafeEqual` throws on unequal lengths, so compare SHA-256 digests. Test in Task 5.
2. **A filename that slugs to nothing or to a duplicate** (`日本.jpeg`, or `nyc, 2024.jpeg` next to `NYC 2024.jpeg`) must not produce an empty id or silently overwrite a sibling during migration. Tests in Task 1 (`slugId` fallback) and Task 3 (`dedupeIds`).
3. **A missing `photos.json`** (fresh bucket, or the first ever upload) must read as an empty manifest with generation `0`, and `/life` must show "No photos found", not an error. Tests in Task 1 (`fetchManifest` 404) and Task 5 (`readManifest` 404).
4. **A caption of only whitespace, or longer than 200 chars**, must be rejected with 400 before any bucket write, and surrounding whitespace must be trimmed. Tests in Task 1 (`normalizeCaption`) and Task 6 (PATCH 400).
5. **An id in the URL path with uppercase, slashes, or `..`** must be rejected with 400 before touching storage. Tests in Task 1 (`isValidId`) and Task 6 (PATCH/DELETE 400).

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/photos.ts` | Pure, environment-free: manifest types, id/caption validation, id generation, path/URL helpers, sort, manifest mutations, `PhotoError`. Imported by frontend, `api/`, and `scripts/`. |
| `src/lib/photosApi.ts` | Browser HTTP: `fetchManifest`, and the admin API client (`adminPing`, `requestUploadUrl`, `putToSignedUrl`, `createPhoto`, `updateCaption`, `deletePhoto`). |
| `src/lib/thumbnail.ts` | Browser image work: `makeThumbnail(file)`, `readDimensions(file)`. Not unit tested (needs canvas); verified manually in Task 8. |
| `src/lib/uploadPhoto.ts` | Orchestrates one file's upload pipeline with a stage callback; dependencies injected for tests. |
| `src/pages/Life.tsx` | Modified: manifest-driven, no Supabase, no canvas processing. |
| `src/pages/Admin.tsx` | New route: password gate, then upload queue + library. |
| `src/components/admin/PasswordGate.tsx`, `UploadQueue.tsx`, `PhotoLibrary.tsx` | The three admin UI pieces. |
| `src/App.tsx` | Add `/admin` route. |
| `api/_lib/env.ts` | Reads and validates server env once. |
| `api/_lib/auth.ts` | `isAuthorized(req)`. |
| `api/_lib/storage.ts` | GCS wrapper: bucket, manifest read/write with preconditions, signed URLs, exists/delete. |
| `api/_lib/http.ts` | `sendJson`, `sendError`, `requireAuth`, `handleError`. |
| `api/admin/ping.ts`, `api/photos/upload-url.ts`, `api/photos/index.ts`, `api/photos/[id].ts` | The four route handlers. |
| `api/tsconfig.json` | Type-checks `api/` and `src/lib` with Node types. |
| `scripts/setup-gcp.sh`, `scripts/gcs-cors.json` | Re-runnable bucket / service-account setup. |
| `scripts/migrate-supabase-to-gcs.ts`, `scripts/migrate/lib.ts` | One-off migration; `lib.ts` holds the pure parts so they can be tested. |
| `tests/**` | All vitest files, mirroring the paths above. `tests/helpers/http.ts` fakes Vercel req/res. |
| `vite.config.ts`, `package.json`, `.gitignore`, `.env.example` | Tooling and hygiene. |

---

### Task 1: Shared photo library + test runner

**Files:**
- Create: `src/lib/photos.ts`, `src/lib/photosApi.ts` (only `fetchManifest` in this task)
- Create: `tests/lib/photos.test.ts`, `tests/lib/photosApi.test.ts`
- Modify: `vite.config.ts`, `package.json`, `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces (all exported from `src/lib/photos.ts`):
  - `interface PhotoEntry { id: string; caption: string; full: string; thumb: string; width: number; height: number; bytes: number; createdAt: string }`
  - `interface PhotoManifest { version: 1; updatedAt: string; photos: PhotoEntry[] }`
  - `interface Photo { name: string; url: string; thumbnailUrl: string; caption: string }` (the existing shape used by `Life.tsx`)
  - `class PhotoError extends Error { constructor(message: string, public status: number) }`
  - `const ID_ANY = /^[a-z0-9-]{1,64}$/`, `const ID_NEW = /^[a-z0-9]{6,16}$/`
  - `isValidId(v: unknown): v is string`, `isValidNewId(v: unknown): v is string`
  - `newId(): string` (10 chars `[a-z0-9]`, from `crypto.getRandomValues`)
  - `slugId(filename: string): string` (strip last extension, lowercase, non-`[a-z0-9]` runs → `-`, trim `-`, cut to 64; empty → `"photo"`)
  - `captionFromFilename(filename: string): string` (strip last extension only, same regex as today's `Life.tsx`)
  - `normalizeCaption(v: unknown): string | null` (trim; null if not a string, empty, or > 200)
  - `const ALLOWED_CONTENT_TYPES: Record<string, string>` (`{ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }`), `extForContentType(ct: unknown): string | null`
  - `fullPath(id: string, ext: string): string`, `thumbPath(id: string): string`, `photoUrl(baseUrl: string, path: string): string`
  - `emptyManifest(now?: Date): PhotoManifest`
  - `sortPhotos(photos: PhotoEntry[]): PhotoEntry[]` (new array, caption `localeCompare` with `{ sensitivity: "base" }`)
  - `toPhotos(manifest: PhotoManifest, baseUrl: string): Photo[]` (sorted; `name` = id)
  - `addPhoto(m, entry, now?)`, `setCaption(m, id, caption, now?)`: return a new `PhotoManifest` with `updatedAt` = now; throw `PhotoError(409)` on duplicate id / `PhotoError(404)` on unknown id
  - `removePhoto(m, id, now?): { manifest: PhotoManifest; removed: PhotoEntry }` throws `PhotoError(404)`
- Produces from `src/lib/photosApi.ts`: `fetchManifest(baseUrl: string): Promise<PhotoManifest>` — GET `${baseUrl}/photos.json?t=${Date.now()}`, `cache: "no-store"`; 404 → `emptyManifest()`; other non-2xx → throws `Error("Failed to load photos (<status>)")`.

- [ ] **Step 1: Install tooling and wire vitest**

```bash
npm i -D vitest
```

In `vite.config.ts` add `/// <reference types="vitest" />` at the top and a `test: { include: ["tests/**/*.test.ts"], environment: "node" }` key to the returned config. In `package.json` add `"test": "vitest run"` and `"test:watch": "vitest"`.

- [ ] **Step 2: Repo hygiene**

```bash
git rm --cached .env.local
```

Append to `.gitignore`: `.env*.local`, `*-key.json`. Create `.env.example`:

```
VITE_PHOTOS_BASE_URL=https://storage.googleapis.com/<bucket>
GCS_BUCKET=<bucket>
GCS_SERVICE_ACCOUNT_KEY=<base64 of service account json>
ADMIN_PASSWORD=<shared admin password>
```

- [ ] **Step 3: Write failing tests for `src/lib/photos.ts`**

`tests/lib/photos.test.ts`, one `it` per line:

- `isValidId`: accepts `"alaska-2022"`, `"k3j9d02mfa"`, `"a"`, 64 `a`s; rejects `""`, `"Alaska"`, `"a/b"`, `"../x"`, 65 `a`s, `42`, `undefined`.
- `isValidNewId`: accepts `"k3j9d02mfa"`; rejects `"alaska-2022"`, `"abc"`, 17 `a`s.
- `newId()`: matches `ID_NEW`, length 10, two calls differ.
- `slugId("alaska, 2022.jpeg") === "alaska-2022"`; `slugId("Café Niño, 2024.JPEG") === "caf-ni-o-2024"`; `slugId("日本.jpeg") === "photo"`; `slugId("a".repeat(80) + ".jpg")` has length 64.
- `captionFromFilename("alaska, 2022.jpeg") === "alaska, 2022"`; `captionFromFilename("v1.2 beach.png") === "v1.2 beach"`.
- `normalizeCaption("  hi  ") === "hi"`; `normalizeCaption("   ") === null`; `normalizeCaption("x".repeat(201)) === null`; `normalizeCaption("x".repeat(200)) !== null`; `normalizeCaption(5) === null`.
- `extForContentType("image/jpeg") === "jpg"`, `("image/heic") === null`.
- `fullPath("abc", "jpeg") === "full/abc.jpeg"`, `thumbPath("abc") === "thumbs/abc.jpg"`, `photoUrl("https://s/b", "full/abc.jpeg") === "https://s/b/full/abc.jpeg"`.
- `sortPhotos` orders `["Zoo", "alaska", "Bobby"]` captions as `["alaska", "Bobby", "Zoo"]` and does not mutate input.
- `toPhotos` maps one entry to `{ name: id, url: base + "/" + full, thumbnailUrl: base + "/" + thumb, caption }`.
- `addPhoto` appends and sets `updatedAt` to the passed `now.toISOString()`; adding an existing id throws `PhotoError` with `status === 409`; input manifest is unchanged.
- `setCaption` changes only that entry; unknown id throws `status === 404`.
- `removePhoto` returns the removed entry and a manifest without it; unknown id throws 404.

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, module `src/lib/photos` not found.

- [ ] **Step 5: Implement `src/lib/photos.ts`** with the exact exports listed in Interfaces. Use `globalThis.crypto.getRandomValues` for `newId` (works in browsers and Node 20+).

- [ ] **Step 6: Write failing tests for `fetchManifest`**

`tests/lib/photosApi.test.ts`, using `vi.stubGlobal("fetch", vi.fn())`:
- resolves the parsed manifest when fetch returns 200 JSON, and the called URL starts with `https://s/b/photos.json?t=`.
- returns `emptyManifest()` shape (`photos: []`, `version: 1`) on 404.
- rejects with message containing `500` on a 500.

- [ ] **Step 7: Run tests to verify the new ones fail**

Run: `npm test`
Expected: photos tests PASS, photosApi FAIL (module not found).

- [ ] **Step 8: Implement `fetchManifest` in `src/lib/photosApi.ts`**

- [ ] **Step 9: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add vite.config.ts package.json package-lock.json .gitignore .env.example src/lib/photos.ts src/lib/photosApi.ts tests/
git commit -m "feat(photos): shared manifest library, vitest, env hygiene"
```

---

### Task 2: GCP project, bucket, CORS, service account

**Files:**
- Create: `scripts/setup-gcp.sh`, `scripts/gcs-cors.json`

**Interfaces:**
- Produces: a public bucket and a service account key file at `./portfolio-admin-key.json` (gitignored by `*-key.json`). Later tasks read `GCS_BUCKET` and `GCS_SERVICE_ACCOUNT_KEY` from `.env.local`.

- [ ] **Step 1: Write `scripts/gcs-cors.json`**

```json
[
  { "origin": ["*"], "method": ["GET", "HEAD"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600 },
  {
    "origin": ["https://jasonlai150.me", "https://www.jasonlai150.me", "http://localhost:8080", "http://localhost:3000"],
    "method": ["PUT"],
    "responseHeader": ["Content-Type", "Cache-Control"],
    "maxAgeSeconds": 3600
  }
]
```

- [ ] **Step 2: Write `scripts/setup-gcp.sh`**

`set -euo pipefail`; variables at top with defaults `PROJECT_ID=jason-portfolio`, `BUCKET=jason-lai-life-photos`, `REGION=us-central1`, `BILLING_ACCOUNT=01AFD1-EF6F4D-416674`, `SA_NAME=portfolio-admin`, each overridable from the environment. Every step is idempotent (check with `describe`/`list` before `create`, or tolerate "already exists"). Steps, in order:

1. `gcloud projects create "$PROJECT_ID" --name="Jason Portfolio"` (skip if `gcloud projects describe` succeeds)
2. `gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"`
3. `gcloud services enable storage.googleapis.com --project="$PROJECT_ID"`
4. `gcloud storage buckets create "gs://$BUCKET" --project="$PROJECT_ID" --location="$REGION" --default-storage-class=STANDARD --uniform-bucket-level-access --no-public-access-prevention`
5. `gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member=allUsers --role=roles/storage.objectViewer`
6. `gcloud storage buckets update "gs://$BUCKET" --cors-file="$(dirname "$0")/gcs-cors.json"`
7. `gcloud iam service-accounts create "$SA_NAME" --project="$PROJECT_ID" --display-name="Portfolio admin"`
8. `gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" --role=roles/storage.objectAdmin`
9. If `./portfolio-admin-key.json` doesn't exist: `gcloud iam service-accounts keys create ./portfolio-admin-key.json --iam-account="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"`
10. Print the four `.env.local` lines, with `GCS_SERVICE_ACCOUNT_KEY=$(base64 < ./portfolio-admin-key.json | tr -d '\n')`.

If the project id or bucket name is taken, the script exits with a message telling the user to re-run with `PROJECT_ID=... BUCKET=...`.

- [ ] **Step 3: Run it**

Run: `bash scripts/setup-gcp.sh`
Expected: completes; last output is the four env lines. If `gcloud projects create` fails on a taken id, re-run as `PROJECT_ID=jason-portfolio-<suffix> bash scripts/setup-gcp.sh` and carry the chosen values forward.

- [ ] **Step 4: Verify**

Run: `gcloud storage buckets describe gs://$BUCKET --format="yaml(location,iamConfiguration.uniformBucketLevelAccess.enabled,cors_config)"`
Expected: `location: US-CENTRAL1`, `enabled: true`, both CORS rules present.

Run: `echo hi > /tmp/x.txt && gcloud storage cp /tmp/x.txt gs://$BUCKET/x.txt && curl -s -o /dev/null -w "%{http_code}\n" https://storage.googleapis.com/$BUCKET/x.txt && gcloud storage rm gs://$BUCKET/x.txt`
Expected: `200`.

- [ ] **Step 5: Write `.env.local`**

Create `.env.local` (untracked) with the four lines from the script output plus `VITE_PHOTOS_BASE_URL=https://storage.googleapis.com/$BUCKET`. Pick an `ADMIN_PASSWORD` (any long random string; `openssl rand -base64 24`). Leave the two `VITE_SUPABASE_*` lines in place for now; Task 3 needs them.

- [ ] **Step 6: Commit**

```bash
git add scripts/setup-gcp.sh scripts/gcs-cors.json
git commit -m "chore(gcp): bucket, CORS and service account setup script"
```

---

### Task 3: Migration script

**Files:**
- Create: `scripts/migrate/lib.ts`, `scripts/migrate-supabase-to-gcs.ts`
- Create: `tests/scripts/migrate-lib.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `slugId`, `captionFromFilename`, `fullPath`, `thumbPath`, `emptyManifest`, `PhotoEntry`, `PhotoManifest` from `src/lib/photos.ts`.
- Produces (`scripts/migrate/lib.ts`):
  - `interface SourceFile { name: string; contentType: string }`
  - `const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i`, `isImageFile(name: string): boolean`
  - `extOf(name: string): string` (lowercased extension without dot)
  - `dedupeIds(files: SourceFile[]): Array<SourceFile & { id: string }>` — `slugId` per file; a second file with an id already seen gets `-2`, a third `-3`, etc., in input order
  - `buildEntry(args: { id: string; name: string; width: number; height: number; bytes: number; now: Date }): PhotoEntry` — caption = `captionFromFilename(name)`, `full = fullPath(id, extOf(name))`, `thumb = thumbPath(id)`, `createdAt = now.toISOString()`
  - `THUMB_MAX = 1200`, `THUMB_QUALITY = 80`, `IMMUTABLE_CACHE = "public, max-age=31536000, immutable"`, `MANIFEST_CACHE = "no-cache"`

- [ ] **Step 1: Install script deps**

```bash
npm i -D sharp tsx @google-cloud/storage
```

(`@google-cloud/storage` moves to `dependencies` in Task 5; installing as dev here is fine since npm merges.) Add `"migrate": "tsx scripts/migrate-supabase-to-gcs.ts"` to `package.json` scripts.

- [ ] **Step 2: Write failing tests**

`tests/scripts/migrate-lib.test.ts`:
- `isImageFile("a.JPEG")` true, `isImageFile(".emptyFolderPlaceholder")` false, `isImageFile("notes.txt")` false.
- `extOf("alaska, 2022.JPEG") === "jpeg"`.
- `dedupeIds([{name:"nyc, 2024.jpeg"},{name:"NYC 2024.jpeg"},{name:"nyc-2024.png"}])` yields ids `["nyc-2024","nyc-2024-2","nyc-2024-3"]`.
- `buildEntry({ id:"alaska-2022", name:"alaska, 2022.jpeg", width:4032, height:3024, bytes:3800000, now: new Date("2026-11-09T00:00:00Z") })` equals `{ id:"alaska-2022", caption:"alaska, 2022", full:"full/alaska-2022.jpeg", thumb:"thumbs/alaska-2022.jpg", width:4032, height:3024, bytes:3800000, createdAt:"2026-11-09T00:00:00.000Z" }`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `scripts/migrate/lib.ts`**

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Write `scripts/migrate-supabase-to-gcs.ts`**

Header comment documents: run with `npm run migrate`; requires `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GCS_BUCKET`, and `GOOGLE_APPLICATION_CREDENTIALS=./portfolio-admin-key.json` set in the shell (the SA key from Task 2; no extra `gcloud` login). Load `.env.local` by parsing it with `fs` (no dotenv dependency).

Flow:
1. `POST ${SUPABASE_URL}/storage/v1/object/list/jason-photos` with headers `apikey` and `Authorization: Bearer <anon>`, body `{ prefix: "", limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } }`. Keep entries with `metadata` (files, not folders) that pass `isImageFile`. Build `SourceFile[]` with `contentType = metadata.mimetype`.
2. `dedupeIds(files)`.
3. For each, sequentially: always download the original (width/height come from it); skip the two uploads if both `full/…` and `thumbs/…` already exist in the bucket, so a re-run is cheap. Download `GET ${SUPABASE_URL}/storage/v1/object/public/jason-photos/${encodeURIComponent(name)}` as a Buffer. `sharp(buf).rotate().metadata()` for `width`/`height`. Thumb: `sharp(buf).rotate().resize({ width: THUMB_MAX, height: THUMB_MAX, fit: "inside", withoutEnlargement: true }).jpeg({ quality: THUMB_QUALITY }).toBuffer()`. Upload full with `contentType` and `metadata.cacheControl = IMMUTABLE_CACHE`; upload thumb as `image/jpeg` with the same cache header. `resumable: false`.
4. Build the manifest from `emptyManifest(now)` with all entries, save `photos.json` with `contentType: "application/json"` and `cacheControl: MANIFEST_CACHE`.
5. Print `migrated N photos, X MB, Y skipped uploads` plus any failures; `process.exit(1)` if any file failed.

- [ ] **Step 7: Run the migration**

Run: `GOOGLE_APPLICATION_CREDENTIALS=./portfolio-admin-key.json npm run migrate`
Expected: `migrated 58 photos, ~190 MB`, no failures. Run it a second time; expected `58 skipped uploads`, same result.

- [ ] **Step 8: Verify from the public URL**

Run: `curl -s "https://storage.googleapis.com/$GCS_BUCKET/photos.json" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s);console.log(m.version,m.photos.length,m.photos[0])})'`
Expected: `1 58 { id: 'alaska-2022', caption: 'alaska, 2022', ... }`.

Run: `curl -sI "https://storage.googleapis.com/$GCS_BUCKET/thumbs/alaska-2022.jpg" | grep -i -E "content-type|cache-control|content-length"`
Expected: `image/jpeg`, `public, max-age=31536000, immutable`, length under 400000.

- [ ] **Step 9: Commit**

```bash
git add scripts/migrate package.json package-lock.json tests/scripts
git commit -m "feat(photos): one-off Supabase to GCS migration script"
```

---

### Task 4: `/life` page reads the manifest

**Files:**
- Modify: `src/pages/Life.tsx`
- Modify: `src/vite-env.d.ts` (declare `VITE_PHOTOS_BASE_URL`)

**Interfaces:**
- Consumes: `fetchManifest` from `src/lib/photosApi.ts`; `toPhotos`, `Photo` from `src/lib/photos.ts`.

- [ ] **Step 1: Rewrite data loading in `Life.tsx`**

- Delete the `@supabase/supabase-js` import, the two `VITE_SUPABASE_*` reads, the `supabase` client, the local `Photo` interface (import it instead), and `createSquareThumbnail`.
- `fetchPhotos` becomes: `const manifest = await fetchManifest(import.meta.env.VITE_PHOTOS_BASE_URL); setPhotos(toPhotos(manifest, import.meta.env.VITE_PHOTOS_BASE_URL));` inside the existing try/catch/finally; error copy unchanged.
- In `PhotoCard`: remove `thumbnailUrl`, `isProcessing` state, the IntersectionObserver and `isInView`, and the blob cleanup effect. Render `<img src={photo.thumbnailUrl} alt={photo.caption} loading="lazy" decoding="async" className={…same classes, including object-cover and the opacity fade…} onLoad={() => setIsLoaded(true)} />` directly inside the existing `aspect-square` container, keeping the spinner placeholder while `!isLoaded`. Drop the `isProcessing ? 'Processing...' : 'Loading...'` text in favor of `Loading...`.
- Everything else (headings, grid classes, hover overlay, caption block, lightbox, Escape handling, empty/error states) stays byte-identical.

- [ ] **Step 2: Declare the env var**

In `src/vite-env.d.ts` add `interface ImportMetaEnv { readonly VITE_PHOTOS_BASE_URL: string }` and `interface ImportMeta { readonly env: ImportMetaEnv }`.

- [ ] **Step 3: Verify locally**

Run: `npm run dev` and open `http://localhost:8080/life`.
Expected: 58 photos in the same grid as before, alphabetical starting with "alaska, 2022", square cells, hover overlay, lightbox opens the full image. In DevTools Network, grid images come from `/thumbs/` and are < 400 KB each; `photos.json` request has `?t=`.

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Life.tsx src/vite-env.d.ts
git commit -m "feat(life): load photos from GCS manifest instead of Supabase"
```

---

### Task 5: API support library (env, auth, storage)

**Files:**
- Create: `api/_lib/env.ts`, `api/_lib/auth.ts`, `api/_lib/storage.ts`, `api/_lib/http.ts`, `api/tsconfig.json`
- Create: `tests/api/auth.test.ts`, `tests/api/storage.test.ts`, `tests/helpers/http.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `PhotoManifest`, `emptyManifest`, `PhotoError` from `src/lib/photos.ts` (import path from `api/_lib/` is `../../src/lib/photos`).
- Produces:
  - `env.ts`: `getEnv(): { bucket: string; serviceAccount: { client_email: string; private_key: string; project_id?: string; [k: string]: unknown }; adminPassword: string }` — reads `GCS_BUCKET`, base64-decodes and JSON-parses `GCS_SERVICE_ACCOUNT_KEY`, reads `ADMIN_PASSWORD`; throws `Error("Missing env: <NAME>")` for any absent one. Memoized.
  - `auth.ts`: `isAuthorized(req: { headers: Record<string, string | string[] | undefined> }, password: string): boolean` — true iff header `authorization` is `Bearer <x>` and `sha256(x)` equals `sha256(password)` via `timingSafeEqual`.
  - `storage.ts`: `getBucket(): Bucket`; `readManifest(): Promise<{ manifest: PhotoManifest; generation: string }>` (404 → `{ emptyManifest(), "0" }`); `writeManifest(manifest, generation): Promise<void>` (save with `contentType: "application/json"`, `metadata: { cacheControl: "no-cache" }`, `preconditionOpts: { ifGenerationMatch: Number(generation) }`, `resumable: false`); `updateManifest(mutate: (m: PhotoManifest) => PhotoManifest, maxAttempts = 3): Promise<PhotoManifest>` (read → mutate → write; on an error with `code === 412` retry; after `maxAttempts` throw `PhotoError("manifest write conflict", 409)`); `signedUploadUrl(args: { path: string; contentType: string; cacheControl: string; expiresInSeconds?: number }): Promise<string>` (`getSignedUrl({ version: "v4", action: "write", expires: Date.now() + 15 * 60 * 1000, contentType, extensionHeaders: { "cache-control": cacheControl } })`); `objectExists(path): Promise<boolean>`; `deleteObject(path): Promise<void>` (ignore 404).
  - `http.ts`: `sendJson(res, status, body)`, `sendError(res, status, message)` (body `{ error }`), `requireAuth(req, res): boolean` (sends 401 `unauthorized` and returns false when `isAuthorized` fails), `handleError(res, err)` (`PhotoError` → its status/message; anything else → 500 `internal error` and `console.error`).
  - `tests/helpers/http.ts`: `mockReq(init: { method?: string; headers?: Record<string,string>; body?: unknown; query?: Record<string,string> })`, `mockRes(): { res: VercelResponse-like; status(): number; body(): unknown }`.

- [ ] **Step 1: Install and configure**

```bash
npm i @google-cloud/storage
npm i -D @vercel/node
```

Move `@google-cloud/storage` to `dependencies` if npm left it in dev. Create `api/tsconfig.json`: `extends` nothing, `compilerOptions` `{ target: "ES2022", module: "ESNext", moduleResolution: "bundler", strict: true, esModuleInterop: true, skipLibCheck: true, types: ["node"], noEmit: true }`, `include: ["./**/*.ts", "../src/lib/**/*.ts"]`. Add `"typecheck:api": "tsc -p api/tsconfig.json"` to package.json scripts.

- [ ] **Step 2: Write `tests/helpers/http.ts`** per the Interfaces block (plain objects; `res.status(n)` returns `res`, `res.json(b)` and `res.end()` record and return `res`, `res.setHeader` is a no-op).

- [ ] **Step 3: Write failing auth tests**

`tests/api/auth.test.ts` with `password = "correct horse"`:
- `isAuthorized(mockReq({ headers: { authorization: "Bearer correct horse" } }), password)` → true
- `"Bearer wrong"` → false
- `"Bearer correct horse!"` (different length) → false, does not throw
- `"Basic xyz"` → false; missing header → false
- header given as an array → false, does not throw

- [ ] **Step 4: Run to verify failure**

Run: `npm test`
Expected: FAIL, module not found.

- [ ] **Step 5: Implement `api/_lib/auth.ts`, `api/_lib/env.ts`, `api/_lib/http.ts`**

- [ ] **Step 6: Run auth tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Write failing storage tests**

`tests/api/storage.test.ts`: `vi.mock("@google-cloud/storage")` so `new Storage().bucket().file()` returns a controllable fake with `download`, `getMetadata`, `save`, `exists`, `delete`, `getSignedUrl`; `vi.mock("../../api/_lib/env", () => ({ getEnv: () => ({ bucket: "b", serviceAccount: { client_email: "x", private_key: "y" }, adminPassword: "p" }) }))`.
- `readManifest` returns `{ manifest: emptyManifest-shaped, generation: "0" }` when `getMetadata` rejects with `{ code: 404 }`.
- `readManifest` returns the parsed manifest and `generation: "17"` when metadata has `generation: "17"`.
- `writeManifest(m, "17")` calls `save` with a string body, `contentType: "application/json"`, `metadata.cacheControl: "no-cache"`, `preconditionOpts.ifGenerationMatch: 17`.
- `updateManifest` retries once when the first `save` rejects with `{ code: 412 }` and then resolves; returns the mutated manifest.
- `updateManifest` throws `PhotoError` with `status === 409` after 3 consecutive 412s.
- `signedUploadUrl({ path: "full/a.jpg", contentType: "image/jpeg", cacheControl: "c" })` calls `getSignedUrl` with `version: "v4"`, `action: "write"`, `contentType: "image/jpeg"`, `extensionHeaders: { "cache-control": "c" }`, and `expires` within 15 min ± 5 s of now.
- `deleteObject` resolves when `delete` rejects with `{ code: 404 }`.

- [ ] **Step 8: Run to verify failure**

Run: `npm test`
Expected: storage tests FAIL.

- [ ] **Step 9: Implement `api/_lib/storage.ts`**

`new Storage({ credentials: serviceAccount, projectId: serviceAccount.project_id })`, memoized bucket.

- [ ] **Step 10: Run all tests and typecheck**

Run: `npm test && npm run typecheck:api`
Expected: PASS, no type errors.

- [ ] **Step 11: Commit**

```bash
git add api/_lib api/tsconfig.json tests/api tests/helpers package.json package-lock.json
git commit -m "feat(api): env, constant-time auth, and GCS manifest storage helpers"
```

---

### Task 6: API route handlers

**Files:**
- Create: `api/admin/ping.ts`, `api/photos/upload-url.ts`, `api/photos/index.ts`, `api/photos/[id].ts`
- Create: `tests/api/ping.test.ts`, `tests/api/upload-url.test.ts`, `tests/api/photos-create.test.ts`, `tests/api/photos-id.test.ts`

**Interfaces:**
- Consumes: everything from Task 5's `_lib`; `isValidId`, `isValidNewId`, `normalizeCaption`, `extForContentType`, `ALLOWED_CONTENT_TYPES`, `fullPath`, `thumbPath`, `addPhoto`, `setCaption`, `removePhoto`, `PhotoEntry` from `src/lib/photos.ts`.
- Produces (HTTP contract the admin client in Task 7 relies on):
  - `GET /api/admin/ping` → 204; 401 otherwise. Other methods → 405.
  - `POST /api/photos/upload-url` body `{ id, kind: "full" | "thumb", contentType }` → 200 `{ url: string, headers: { "Content-Type": string, "Cache-Control": string } }`. `kind: "thumb"` forces `contentType` to `image/jpeg` and path `thumbs/<id>.jpg`; `kind: "full"` uses `fullPath(id, extForContentType(contentType))`. 400 `{ error }` when `id` fails `isValidNewId`, `kind` invalid, or content type not allowed.
  - `POST /api/photos` body `{ id, caption, contentType, width, height, bytes }` → 201 with the created `PhotoEntry`. Validates `isValidNewId`, `normalizeCaption`, `extForContentType`, positive integer `width`/`height`/`bytes`; 400 otherwise. 409 `{ error: "upload not found" }` if either object is missing in the bucket; 409 `{ error: "duplicate id" }` from `addPhoto`.
  - `PATCH /api/photos/:id` body `{ caption }` → 200 with the updated `PhotoEntry`; 400 on bad id or caption; 404 on unknown id.
  - `DELETE /api/photos/:id` → 204; 400 bad id; 404 unknown. Manifest updated first, then `deleteObject` for full and thumb.

All handlers: `export default async function handler(req: VercelRequest, res: VercelResponse)`; first `requireAuth`, then method check (405 `{ error: "method not allowed" }`), then validation, then work inside try/catch → `handleError`.

- [ ] **Step 1: Write failing tests for all four handlers**

Each test file mocks `../../api/_lib/storage` (`vi.mock`) and `../../api/_lib/env` as in Task 5, then imports the handler and drives it with `mockReq`/`mockRes`. Headers include `authorization: "Bearer p"` unless the test is about auth.

`ping.test.ts`: 204 with right password; 401 wrong; 405 for POST.

`upload-url.test.ts`:
- 401 without auth; 405 for GET.
- valid `{ id: "k3j9d02mfa", kind: "full", contentType: "image/png" }` → 200, `signedUploadUrl` called with `{ path: "full/k3j9d02mfa.png", contentType: "image/png", cacheControl: "public, max-age=31536000, immutable" }`, response `headers["Content-Type"] === "image/png"` and `headers["Cache-Control"]` equals that cache value.
- `kind: "thumb"` with `contentType: "image/png"` → path `thumbs/k3j9d02mfa.jpg`, `contentType: "image/jpeg"`.
- `id: "alaska-2022"` → 400 (slug ids can't be minted). `contentType: "image/heic"` → 400. `kind: "x"` → 400.

`photos-create.test.ts`:
- valid body → `objectExists` called for `full/<id>.jpg` and `thumbs/<id>.jpg`, `updateManifest` called, 201, body has `caption` trimmed and `createdAt` ISO.
- `objectExists` false for thumb → 409 `upload not found`, `updateManifest` not called.
- caption `"   "` → 400; `width: -1` → 400; `bytes: "big"` → 400.

`photos-id.test.ts` (query `{ id }`):
- PATCH `{ caption: "  new  " }` on existing id → 200, caption `"new"`.
- PATCH unknown id → 404 (mock `updateManifest` to run the mutator against a fixed manifest so `setCaption` throws).
- PATCH `id: "../x"` → 400 and storage not touched; `id: "Alaska"` → 400.
- PATCH caption of 201 chars → 400.
- DELETE existing → 204; `deleteObject` called with `full/alaska-2022.jpeg` then `thumbs/alaska-2022.jpg`; `updateManifest` called before `deleteObject`.
- DELETE unknown → 404. GET → 405.

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: the four new files FAIL (handlers missing).

- [ ] **Step 3: Implement the four handlers**

For `[id].ts`, read `req.query.id` (string). For `updateManifest` in `photos-id.ts`, capture the removed entry from `removePhoto` inside the mutator into a local variable so the delete step knows the paths.

- [ ] **Step 4: Run all tests and typecheck**

Run: `npm test && npm run typecheck:api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api tests/api
git commit -m "feat(api): ping, signed upload URL, and photo create/patch/delete routes"
```

---

### Task 7: Admin API client and upload orchestrator

**Files:**
- Modify: `src/lib/photosApi.ts`
- Create: `src/lib/thumbnail.ts`, `src/lib/uploadPhoto.ts`
- Create/Modify: `tests/lib/photosApi.test.ts`, `tests/lib/uploadPhoto.test.ts`

**Interfaces:**
- Consumes: Task 6's HTTP contract; `newId`, `captionFromFilename`, `PhotoEntry` from `photos.ts`.
- Produces (`photosApi.ts`, all take `password: string` first and send `Authorization: Bearer <password>`; non-2xx → throw `Error(body.error ?? "request failed (<status>)")`):
  - `adminPing(password): Promise<boolean>` (true on 204, false on 401, throws otherwise)
  - `requestUploadUrl(password, args: { id: string; kind: "full" | "thumb"; contentType: string }): Promise<{ url: string; headers: Record<string,string> }>`
  - `putToSignedUrl(url: string, headers: Record<string,string>, body: Blob): Promise<void>` (PUT, throws on non-2xx)
  - `createPhoto(password, body: { id; caption; contentType; width; height; bytes }): Promise<PhotoEntry>`
  - `updateCaption(password, id, caption): Promise<PhotoEntry>`
  - `deletePhoto(password, id): Promise<void>`
- Produces (`thumbnail.ts`): `makeThumbnail(file: File): Promise<Blob>` using `browser-image-compression` with `{ maxWidthOrHeight: 1200, initialQuality: 0.8, fileType: "image/jpeg", useWebWorker: true, alwaysKeepResolution: false }`; `readDimensions(file: File): Promise<{ width: number; height: number }>` via `createImageBitmap(file, { imageOrientation: "from-image" })`, closing the bitmap after reading.
- Produces (`uploadPhoto.ts`):
  - `type UploadStage = "thumbnail" | "dimensions" | "signing" | "uploading-full" | "uploading-thumb" | "saving" | "done"`
  - `interface UploadDeps { makeThumbnail; readDimensions; api: Pick<typeof photosApi, "requestUploadUrl" | "putToSignedUrl" | "createPhoto">; newId: () => string }`
  - `uploadPhoto(file: File, caption: string, password: string, onStage: (s: UploadStage) => void, deps?: UploadDeps): Promise<PhotoEntry>` — rejects immediately with `Error("Unsupported file type")` if `file.type` is not in `ALLOWED_CONTENT_TYPES`; otherwise runs the stages in the order listed, emitting each before starting it, and `"done"` last.

- [ ] **Step 1: Install**

```bash
npm i browser-image-compression
```

- [ ] **Step 2: Write failing tests**

Append to `tests/lib/photosApi.test.ts` (fetch stubbed):
- `adminPing("p")` sends `Authorization: Bearer p` and returns true on 204, false on 401.
- `requestUploadUrl` POSTs JSON body `{ id, kind, contentType }` to `/api/photos/upload-url` and returns the parsed response.
- `createPhoto` rejects with `Error("upload not found")` when the response is 409 `{ error: "upload not found" }`.
- `deletePhoto` issues `DELETE /api/photos/<id>` and resolves on 204.

`tests/lib/uploadPhoto.test.ts` with fully faked deps (`vi.fn()` for each) and `new File([new Uint8Array(10)], "beach day.jpg", { type: "image/jpeg" })`:
- stages emitted in exact order `["thumbnail","dimensions","signing","uploading-full","uploading-thumb","saving","done"]`.
- `requestUploadUrl` called twice: `kind: "full"` with `contentType: "image/jpeg"`, and `kind: "thumb"`; both with the same id from `deps.newId`.
- `putToSignedUrl` called with the full file first, then the thumb blob, each with the headers returned by `requestUploadUrl`.
- `createPhoto` receives `{ id, caption: "beach day", contentType: "image/jpeg", width, height, bytes: file.size }`.
- a `.heic` file (`type: "image/heic"`) rejects with `Unsupported file type` and no dep is called.
- if `putToSignedUrl` rejects, `uploadPhoto` rejects and `createPhoto` is never called.

- [ ] **Step 3: Run to verify failure**

Run: `npm test`
Expected: new tests FAIL.

- [ ] **Step 4: Implement `photosApi.ts` additions, `thumbnail.ts`, `uploadPhoto.ts`**

Default `deps` in `uploadPhoto.ts` wire the real `thumbnail.ts`, `photosApi.ts`, and `newId`.

- [ ] **Step 5: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib package.json package-lock.json tests/lib
git commit -m "feat(admin): API client, browser thumbnails, and upload pipeline"
```

---

### Task 8: Admin page

**Files:**
- Create: `src/pages/Admin.tsx`, `src/components/admin/PasswordGate.tsx`, `src/components/admin/UploadQueue.tsx`, `src/components/admin/PhotoLibrary.tsx`
- Modify: `src/App.tsx`, `package.json`

**Interfaces:**
- Consumes: Task 7's `photosApi` and `uploadPhoto`; `fetchManifest`, `sortPhotos`, `photoUrl`, `captionFromFilename`, `PhotoEntry`; shadcn `Button`, `Input`, `AlertDialog` from `src/components/ui`; `toast` from `sonner`.
- Produces: route `/admin`. Password kept in `sessionStorage` under key `"admin-password"`.

Behavior to implement (this is the whole UI contract; layout is the implementer's):

- `Admin.tsx`: reads the password from `sessionStorage`; if absent renders `PasswordGate`; otherwise renders heading "Photo admin", `UploadQueue`, then `PhotoLibrary`. Holds `photos: PhotoEntry[]` state loaded via `fetchManifest` + `sortPhotos`; passes `onAdded(entry)`, `onUpdated(entry)`, `onRemoved(id)` down so the list updates in place without refetch. A "Log out" button clears sessionStorage.
- `PasswordGate`: one `Input type="password"` and a submit button. On submit calls `adminPing`; true → store and call `onUnlocked()`; false → inline text "wrong password"; thrown → inline text with the error message.
- `UploadQueue`: hidden `<input type="file" multiple accept="image/jpeg,image/png,image/webp">` behind a drop zone (`onDrop`/`onDragOver`). Each chosen file becomes a row `{ file, caption: captionFromFilename(file.name), stage: "queued" | UploadStage | "error", error?: string, previewUrl: URL.createObjectURL(file) }` with an editable caption `Input`, the preview, and a status label. "Upload all" button processes rows sequentially with `uploadPhoto`, updating `stage` from `onStage`; on success calls `onAdded(entry)` and removes the row after 1.5 s; on failure sets `stage: "error"` and shows a "Retry" button on that row only. Unsupported types are marked `error: "Unsupported file type"` immediately on selection. Object URLs are revoked on row removal/unmount. Disabled while an upload is running.
- `PhotoLibrary`: responsive grid (reuse the `/life` grid classes) of cards: `<img src={photoUrl(base, p.thumb)}>` in an `aspect-square object-cover` box, an `Input` bound to a local draft caption that saves on blur or Enter when changed (`updateCaption` → `onUpdated`; shows "saving…" / "saved" / error text under the input, with `toast.error` on failure), and a "Delete" button opening an `AlertDialog` ("Delete this photo? This cannot be undone.") whose confirm calls `deletePhoto` → `onRemoved(id)`.
- `App.tsx`: `<Route path="/admin" element={<Admin />} />` above the catch-all. Do not touch `Navigation.tsx`.

- [ ] **Step 1: Add Vercel dev script**

Add `"dev:api": "vercel dev"` to `package.json` scripts. Install the CLI once (`npm i -g vercel`), then `vercel login` and `vercel link` (interactive; the user does these). `vercel dev` serves both Vite and `api/` on `http://localhost:3000` and reads `.env.local`.

- [ ] **Step 2: Implement the four files and the route** per the behavior above.

- [ ] **Step 3: Build and lint**

Run: `npm run build && npm run lint`
Expected: both succeed (lint warnings allowed only if pre-existing).

- [ ] **Step 4: Manual verification with `vercel dev`**

Run: `npm run dev:api` and open `http://localhost:3000/admin`.
1. Wrong password → "wrong password". Correct → library shows 58 photos.
2. Drop a JPEG and a PNG, edit one caption, Upload all → both rows go through the stages and disappear; both appear in the library; DevTools shows two PUTs per file to `storage.googleapis.com` returning 200 and a `POST /api/photos` returning 201.
3. Drop a `.heic` → row immediately shows "Unsupported file type", nothing uploaded.
4. Edit a caption, blur → "saved"; reload → persists; `/life` shows it.
5. Delete one of the test photos → confirm → gone; `curl -sI` on its thumb URL returns 404.
6. Open `http://localhost:3000/life` → unchanged look; the other test photo is in alphabetical position.
7. Delete the remaining test photo.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Admin.tsx src/components/admin src/App.tsx package.json
git commit -m "feat(admin): hidden password-gated page for upload, caption, delete"
```

---

### Task 9: Deploy, remove Supabase, document

**Files:**
- Modify: `package.json`, `.env.local` (untracked), `README.md`
- Delete: nothing else in repo; Supabase code is already gone from `Life.tsx`

- [ ] **Step 1: Remove the Supabase dependency**

```bash
npm uninstall @supabase/supabase-js
```

Remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local`. Grep to confirm nothing references them:

Run: `grep -rn "supabase" src api scripts --include=*.ts --include=*.tsx -il`
Expected: only `scripts/migrate-supabase-to-gcs.ts` (kept for history; it reads env at runtime).

- [ ] **Step 2: Set production env vars**

Run (interactive, user present): `vercel env add VITE_PHOTOS_BASE_URL production`, then `GCS_BUCKET`, `GCS_SERVICE_ACCOUNT_KEY`, `ADMIN_PASSWORD`, each with the values from `.env.local`. Also add the same four to `preview` so preview deploys of `/life` work.

- [ ] **Step 3: README section**

Add a short "Life photos" section to `README.md`: where photos live (bucket name), how to add one (`/admin`), how to set up the bucket from scratch (`scripts/setup-gcp.sh`), how to run the API locally (`npm run dev:api`), and the env vars (pointing at `.env.example`).

- [ ] **Step 4: Build, test, commit, push**

Run: `npm test && npm run build && npm run typecheck:api`
Expected: PASS.

```bash
git add package.json package-lock.json README.md
git commit -m "chore: drop Supabase, document GCS photo setup"
git push
```

- [ ] **Step 5: Verify production**

Open `https://jasonlai150.me/life`: identical to before, thumbnails from the bucket. Open `https://jasonlai150.me/admin`: password gate; upload one photo, edit its caption, delete it. Confirm `/life` reflects each step after a reload.

- [ ] **Step 6: Hand back to the user**

Tell them the Supabase project can now be deleted at their leisure, and that `portfolio-admin-key.json` in the repo root is the only copy of the service account key (back it up or delete it; Vercel holds the base64 copy).
