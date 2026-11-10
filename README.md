# Welcome to My Portolio Website
https://jasonlai150.me

## Life photos

The `/life` gallery is served from a public Google Cloud Storage bucket, `jason-lai-life-photos` (project `jason-portfolio-gpak`). The photo list lives in `photos.json` in that bucket.

- **Add, caption, or delete a photo:** go to the hidden `/admin` page and enter the admin password.
- **Set up the bucket from scratch:** run `scripts/setup-gcp.sh` (CORS config is in `scripts/gcs-cors.json`).
- **Run the API locally:** `npm run dev:api` (runs `vercel dev`, which serves the `api/` functions alongside the site).
- **Environment variables:** see `.env.example` for the variables to put in `.env.local` locally and in the Vercel project settings.
