# Life photos: Supabase → Google Cloud Storage

**Date:** 2026-11-09
**Status:** draft, awaiting approval

## Intent

The `/life` page ("Proof of Life") shows a grid of photos. Today they live in a
public Supabase Storage bucket called `jason-photos`, listed from the browser
with the anon key. Supabase's free tier pauses the project after a week of
inactivity, and when it pauses the storage API goes with it, so the page
breaks until Jason logs in and un-pauses it. Adding a photo means uploading
through the Supabase dashboard, and the caption is literally the filename
minus its extension (for example `alaska, 2022.jpeg` → "alaska, 2022").

Move the photos to a Google Cloud Storage bucket on the always-free tier so the
page never pauses, add a hidden admin page on the site itself for uploading,
captioning and deleting photos, and generate real downscaled thumbnails at
upload time so the grid stops downloading 2 to 4 MB originals.

Current inventory (checked 2026-11-09, Supabase project was live): 58 JPEGs,
190 MB total, 1.5 to 4.5 MB each. Jason already has `gcloud` installed and is
logged in as laijason150@gmail.com with an open billing account; no portfolio
GCP project exists yet.

## Goals

- `/life` keeps working indefinitely with zero babysitting. No service that
  pauses, sleeps, or expires.
- Stays on GCP's always-free tier at current scale. Target cost: $0/month.
- Adding a photo is: open `/admin`, drop files, fix captions, done.
- Captions are editable independently of filenames.
- Grid loads a small thumbnail per photo; the lightbox still shows the full
  original.
- The visible `/life` page looks and behaves the same as today: same grid,
  same square cells, same hover, same lightbox, same caption text, same order.
- One deploy. Everything (site, API, admin page) ships from this repo to
  Vercel. No second cloud deployment to maintain.

## Non-goals

- Multiple users, accounts, or login sessions. One shared admin password.
- Drag-to-reorder or any manual ordering UI.
- Albums, tags, search, dates, or any metadata beyond a caption.
- Serving images through a CDN or image-optimization proxy. Direct GCS public
  URLs are fine.
- Server-side image processing. Thumbnails are made in the browser (admin) or
  locally (migration script).
- Keeping Supabase around. Once migrated, the Supabase dependency and env
  vars are removed from the repo.

## Anti-goals (would make this a failure even if it works)

- Introducing anything that needs to be kept awake, redeployed on a schedule,
  or costs money at this scale.
- Making the `/life` page depend on the Vercel API for reads. Reads must be a
  direct fetch from the public bucket, so even if the functions break, the
  page still renders.
- Committing secrets. Note: `.env.local` is currently tracked in git. That
  stops as part of this work.
- Changing how the public page looks. A visitor should not be able to tell
  anything changed.

## Constraints

- Frontend: Vite + React 18 + TypeScript + Tailwind + shadcn/ui, deployed on
  Vercel Hobby. SPA with `react-router-dom`; `vercel.json` rewrites all paths
  to `index.html`.
- GCS always-free tier applies only to buckets in `us-east1`, `us-west1`, or
  `us-central1` (5 GB-months standard storage, 5,000 Class A ops, 50,000
  Class B ops, 100 GB egress to North America per month).
- Vercel Hobby serverless functions: Node runtime, 4.5 MB request body limit,
  10 s default timeout. Uploads must therefore bypass the function and go
  straight to GCS.
- Node 23 locally. No Vercel CLI installed yet (needed for running `api/`
  locally).
- Browsers cannot decode HEIC. Admin uploads are JPEG/PNG/WebP only.

## Architecture

```
Visitor  ──GET photos.json, thumbs/*, full/*──▶  GCS public bucket
                                                   ▲          ▲
Admin page (/admin) ──PUT via signed URL──────────┘          │
       │                                                      │
       └──POST/PATCH/DELETE (Bearer ADMIN_PASSWORD)──▶ Vercel functions (api/)
                                                        │  service account
                                                        └──writes photos.json,
                                                           signs upload URLs,
                                                           deletes objects
```

### GCP resources

Set up once with `gcloud` (the builder scripts these as a documented,
re-runnable shell script under `scripts/`):

- **Project:** new project, id `jason-portfolio` (append a short suffix if the
  id is taken), linked to billing account `01AFD1-EF6F4D-416674`. Not reused
  from any existing hackathon project.
- **API:** enable `storage.googleapis.com`.
- **Bucket:** `jason-lai-life-photos` (adjust if taken), location
  `us-central1`, Standard storage class, uniform bucket-level access on,
  public access prevention off, versioning off.
- **Public read:** grant `allUsers` the role `roles/storage.objectViewer` on
  the bucket.
- **CORS on the bucket:** two rules. (1) `GET` from origin `*`: the
  `/life` page fetches `photos.json` with `fetch()`, which needs CORS even
  though the bucket is public, and this covers the production domain, every
  `*.vercel.app` preview URL (GCS CORS has no wildcard subdomains), and
  local dev in one go. The bucket is public anyway, so a `*` GET rule leaks
  nothing. (2) `PUT` from the explicit origins `https://jasonlai150.me`,
  `https://www.jasonlai150.me`, `http://localhost:8080` (Vite dev), and
  `http://localhost:3000` (`vercel dev`), with allowed request headers
  `Content-Type` and `Cache-Control`. Both headers are part of the signed
  URL signature, so the browser must send both on the PUT and the preflight
  must allow both. Admin uploads therefore won't work from a Vercel preview
  URL; that's fine, the admin page is used from the production domain.
  *(My call after the builder check; the spec originally said "list the
  production domains".)*
- **Service account:** `portfolio-admin@<project>.iam.gserviceaccount.com`
  with `roles/storage.objectAdmin` granted on this bucket only (not
  project-wide). Create one JSON key. The key is needed because V4 signed
  URLs require a private key.

### Bucket layout

```
photos.json            manifest, see schema below
full/<id>.<ext>        original upload, untouched bytes
thumbs/<id>.jpg        downscaled thumbnail
```

`<id>` is a short random identifier generated at upload time (for example 10
characters of base32 from `crypto.randomUUID()`), so renaming a caption never
means renaming or re-uploading files. For migrated photos the id is derived
deterministically from the original filename (a slug) so the migration script
can be re-run safely.

Two id formats therefore coexist in the bucket. The general id grammar,
used everywhere an id is accepted (`PATCH`, `DELETE`, manifest validation),
is `[a-z0-9-]{1,64}`. Only `POST /api/photos/upload-url` and `POST
/api/photos`, which mint ids for new uploads, enforce the stricter random
form `[a-z0-9]{6,16}`. *(My call after the builder check: the original
draft used the strict regex on every endpoint, which would have made the 58
migrated slug ids un-editable.)*

Cache headers set on write:

- `photos.json`: `Cache-Control: no-cache` so caption edits and new uploads
  appear on the next page load. The client also appends a `?t=<timestamp>`
  query to be safe against intermediate caches.
- `full/*` and `thumbs/*`: `Cache-Control: public, max-age=31536000,
  immutable`. Ids are unique, so files never change in place.

### Manifest schema (`photos.json`)

```json
{
  "version": 1,
  "updatedAt": "2026-11-09T20:15:00.000Z",
  "photos": [
    {
      "id": "k3j9d02mfa",
      "caption": "alaska, 2022",
      "full": "full/k3j9d02mfa.jpeg",
      "thumb": "thumbs/k3j9d02mfa.jpg",
      "width": 4032,
      "height": 3024,
      "bytes": 3800000,
      "createdAt": "2026-11-09T20:15:00.000Z"
    }
  ]
}
```

Paths are relative to the bucket root. Clients build URLs as
`${VITE_PHOTOS_BASE_URL}/${path}` where `VITE_PHOTOS_BASE_URL` is
`https://storage.googleapis.com/<bucket>`. `width`/`height` are the original
image's pixel dimensions (after EXIF rotation). Array order in the file is
insertion order; it is not used for display (see Ordering).

The manifest is only ever written by the Vercel functions and the migration
script. Every write is a read-modify-write guarded by GCS's
`ifGenerationMatch` precondition; on a precondition failure the function
re-reads and retries a few times. Jason is the only writer, so conflicts will
be rare, but this keeps the file from ever being silently clobbered.

### Thumbnails

- Downscale only, aspect ratio preserved, no cropping. Longest side 1200 px.
  Images already smaller than that are not upscaled.
- Output JPEG at quality 0.8. Expected 150 to 300 KB each.
- EXIF orientation is applied so phone photos are upright; EXIF is not
  carried into the thumbnail.
- **Admin page:** `browser-image-compression` with `maxWidthOrHeight: 1200`,
  `initialQuality: 0.8`, `fileType: 'image/jpeg'`, `useWebWorker: true`.
  Original dimensions are read in the browser via `createImageBitmap` (with
  `imageOrientation: 'from-image'`) so `width`/`height` in the manifest are
  post-rotation.
- **Migration script:** `sharp` with `.rotate()` then
  `.resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement:
  true })` then `.jpeg({ quality: 80 })`.
- The square grid cell is achieved purely with CSS: the existing
  `aspect-square` container plus `object-cover` on the `<img>`. The file is
  never cropped. This matches today's visual result (an 800×800 centered
  crop) closely enough that a visitor won't notice.

### Vercel functions (`api/`)

Node runtime, TypeScript, using `@vercel/node` types and
`@google-cloud/storage`. Credentials come from env var
`GCS_SERVICE_ACCOUNT_KEY` holding the service account JSON (base64-encoded to
avoid newline problems in the Vercel dashboard). Bucket name from
`GCS_BUCKET`.

**Auth:** every request must carry `Authorization: Bearer <ADMIN_PASSWORD>`.
Compared with `crypto.timingSafeEqual` against the `ADMIN_PASSWORD` env var.
Wrong or missing → 401. There is no session or token exchange; the admin page
keeps the password in `sessionStorage` for the tab's lifetime and sends it on
every call.

Endpoints (exact file layout under `api/` is the builder's call):

| Method | Path | Body | Does |
|---|---|---|---|
| `GET` | `/api/admin/ping` | — | Returns 204 if the password is right. Used by the admin page to validate the password before showing the UI. |
| `POST` | `/api/photos/upload-url` | `{ id, kind: "full" \| "thumb", contentType, ext }` | Returns a V4 signed `PUT` URL valid for 15 minutes for `full/<id>.<ext>` or `thumbs/<id>.jpg`, with the correct `Content-Type` and `Cache-Control` baked into the signature. Validates `id` matches the strict new-upload form `[a-z0-9]{6,16}` and `contentType` is an allowed image type. |
| `POST` | `/api/photos` | `{ id, caption, ext, width, height, bytes }` | Verifies both `full/<id>.<ext>` and `thumbs/<id>.jpg` exist in the bucket, then appends an entry to `photos.json`. 409 if the id already exists. |
| `PATCH` | `/api/photos/:id` | `{ caption }` | Updates the caption in `photos.json`. 404 if missing. Caption trimmed, 1 to 200 chars. |
| `DELETE` | `/api/photos/:id` | — | Removes the entry from `photos.json`, then deletes `full/…` and `thumbs/…`. Manifest is updated first so a half-failed delete leaves orphaned files rather than a broken entry. |

All responses are JSON. Errors are `{ error: string }` with an appropriate
status. CORS is not needed on the functions since they're same-origin.

### Admin page (`/admin`)

- New route in `App.tsx`, above the catch-all. Not linked from
  `Navigation` or anywhere else. Not in any sitemap. Obscurity plus the
  password is the whole access model; that's acceptable for a personal
  photo page.
- **Gate:** on load, if `sessionStorage` has no password, show a single
  password field. Submit calls `/api/admin/ping`; on 204 store it and show
  the UI, otherwise show "wrong password".
- **Upload area:** drop zone / file picker, multiple files, accepts
  `image/jpeg`, `image/png`, `image/webp`. Each selected file gets a row
  showing: a local preview, an editable caption prefilled from the filename
  minus extension (same rule as today), and a status. One "Upload all"
  button. Per file the flow is: generate id → make thumbnail → read
  dimensions → request two signed URLs → PUT full → PUT thumb → `POST
  /api/photos`. Status shows each stage and any error; a failed file can be
  retried without affecting the others. Files are processed sequentially to
  stay well within the free-tier op counts and avoid saturating the upload.
- **Library:** grid of existing photos (fetched from `photos.json`, same
  as the public page), each showing its thumbnail, a caption text input that
  saves on blur or Enter (with a small saved/saving/error indicator), and a
  delete button behind a confirm dialog. After a successful save or delete
  the local list updates in place; no full refetch required.
- Uses the shadcn components already in `src/components/ui` (Button, Input,
  Dialog/AlertDialog, Toast via `sonner`). Plain, functional, dark-mode aware
  like the rest of the site. No design polish required beyond "not ugly".

### Public `/life` page changes

- Remove `@supabase/supabase-js` import and client. Fetch
  `${VITE_PHOTOS_BASE_URL}/photos.json?t=${Date.now()}` instead.
- Map manifest entries to the existing `Photo` shape: `url` = full URL,
  `thumbnailUrl` = thumb URL, `caption` from the manifest, `name` = id.
- Delete `createSquareThumbnail` and the processing state in `PhotoCard`.
  The `<img>` gets `src={photo.thumbnailUrl}` directly inside the existing
  `aspect-square` + `object-cover` container. Keep the IntersectionObserver
  lazy-load (or replace with native `loading="lazy"`; builder's call) and the
  fade-in on load.
- Lightbox unchanged: shows `photo.url` (the original) and the caption.
- Loading, error, and empty states unchanged.

### Ordering

Display order is alphabetical by caption, case-insensitive
(`localeCompare`), sorted on the client. This is exactly what the page shows
today (Supabase listed by name, and name was the caption). Migration seeds
captions from filenames, so day-one order is identical. Switching to
newest-first later is a one-line change using `createdAt`.
*(This was my call to honor "keep as close to current behavior as possible";
Jason didn't pick an order explicitly.)*

### Migration script

`scripts/migrate-supabase-to-gcs.ts`, run once locally with `npx tsx`.

1. List `jason-photos` via the Supabase Storage REST API using the existing
   `VITE_SUPABASE_URL` and anon key (the bucket is public). Page through all
   files; filter to image extensions like the page does today.
2. For each file: download bytes; `id` = slug of the filename minus extension
   (lowercase, non-alphanumerics → `-`, collapsed), which is deterministic;
   caption = filename minus extension (exactly today's rule, so
   `alaska, 2022.jpeg` → `alaska, 2022`); read dimensions with `sharp`
   (post-rotation); produce the thumbnail per the rules above; upload
   `full/<id>.<ext>` (original bytes, original content type) and
   `thumbs/<id>.jpg` with the cache headers above. Skip the uploads if both
   objects already exist, so re-running is cheap.
3. Write `photos.json` with all entries (overwriting any existing manifest).
4. Print a summary: count, total bytes, any failures. Exit non-zero on any
   failure.

Auth for the script: application default credentials from `gcloud auth
application-default login`, or the same service account key via
`GOOGLE_APPLICATION_CREDENTIALS`. Builder's call; document it in the script
header.

Uploading all 58 photos is about 120 Class A operations, far under the
5,000/month free allowance.

### Environment and secrets

Vite exposes only `VITE_*` variables to the browser; everything else is
server-only.

| Variable | Where | Public? | Purpose |
|---|---|---|---|
| `VITE_PHOTOS_BASE_URL` | Vercel + `.env.local` | yes | `https://storage.googleapis.com/<bucket>` |
| `GCS_BUCKET` | Vercel + `.env.local` | no | bucket name for the functions |
| `GCS_SERVICE_ACCOUNT_KEY` | Vercel + `.env.local` | no | base64 of the SA JSON key |
| `ADMIN_PASSWORD` | Vercel + `.env.local` | no | admin shared secret |

Repo hygiene as part of this work:

- `git rm --cached .env.local`, add `.env*.local` to `.gitignore`, and commit
  a `.env.example` listing the variables above with placeholder values.
- Remove `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and the
  `@supabase/supabase-js` dependency once migration is verified.
- The Supabase anon key that was committed is a public, low-privilege key
  by design, so no rotation is needed; it just shouldn't have been tracked.

### Local development

`vite` alone cannot serve `api/`. Install the Vercel CLI (`npm i -g vercel`),
link the project (`vercel link`), pull env (`vercel env pull .env.local`), and
run `vercel dev`. Add a `"dev:api": "vercel dev"` script. Plain `npm run dev`
still works for everything except the admin write actions.

### Rollout order

1. GCP setup script (project, bucket, public read, CORS, service account,
   key).
2. Migration script; run it; verify `photos.json` and a few images load
   directly from the bucket URL.
3. `/life` page switched to the manifest. Deploy. Visually compare against
   the current page.
4. Vercel functions + admin page. Set env vars in Vercel. Deploy. Upload one
   test photo, edit its caption, delete it.
5. Remove Supabase code, dependency, and env vars. Fix `.gitignore`.
6. Jason deletes the Supabase project manually whenever he's comfortable.

## Decisions already made (and by whom)

- GCP over AWS, always-free tier — Jason.
- Downscaled (not cropped) thumbnails, generated at upload time — Jason.
- `photos.json` manifest in the bucket rather than object metadata or a
  database — Jason, on my recommendation.
- Public page must look and behave the same as today — Jason.
- Hidden admin page on the site with upload + rename + delete — Jason's idea,
  scoped by me to those three actions.
- Alphabetical-by-caption ordering — my call, to match current behavior.
- 1200 px longest side, JPEG q0.8 — my call.
- Browser-side thumbnails via `browser-image-compression`, `sharp` for the
  migration — my call.
- Single shared password in a Bearer header, no sessions — my call.
- Vercel functions in this repo rather than Cloud Functions — my call, to
  keep one deploy.
- Separate new GCP project — my call.

## Left to the builder

- Exact `api/` file layout and shared helper structure.
- Whether to keep the IntersectionObserver or use native lazy loading.
- Retry counts and backoff for the manifest precondition loop.
- Admin page layout details, as long as the behaviors above are present.
- Choice between application-default credentials and the SA key for the
  migration script.
- Naming of the setup script and whether it's bash or TypeScript.
