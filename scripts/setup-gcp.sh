#!/usr/bin/env bash
# Creates the GCP project, public photo bucket, CORS, and admin service account.
# Idempotent: safe to re-run. Override any variable from the environment.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-jason-portfolio}"
BUCKET="${BUCKET:-jason-lai-life-photos}"
REGION="${REGION:-us-central1}"
BILLING_ACCOUNT="${BILLING_ACCOUNT:-01AFD1-EF6F4D-416674}"
SA_NAME="${SA_NAME:-portfolio-admin}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
KEY_FILE="./portfolio-admin-key.json"

taken() {
  echo "ERROR: $1 Re-run with different values, e.g.:" >&2
  echo "  PROJECT_ID=jason-portfolio-xxxx BUCKET=jason-lai-life-photos-xxxx bash scripts/setup-gcp.sh" >&2
  exit 1
}

echo "==> 1. Project $PROJECT_ID"
if gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  echo "    exists, skipping"
else
  gcloud projects create "$PROJECT_ID" --name="Jason Portfolio" \
    || taken "Could not create project '$PROJECT_ID' (id may be taken)."
fi

echo "==> 2. Link billing"
gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"

echo "==> 3. Enable Storage API"
gcloud services enable storage.googleapis.com --project="$PROJECT_ID"

echo "==> 4. Bucket gs://$BUCKET"
if gcloud storage buckets describe "gs://$BUCKET" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "    exists in this project, skipping"
else
  gcloud storage buckets create "gs://$BUCKET" --project="$PROJECT_ID" --location="$REGION" \
    --default-storage-class=STANDARD --uniform-bucket-level-access --no-public-access-prevention \
    || taken "Could not create bucket '$BUCKET' (name may be taken)."
fi

echo "==> 5. Public read"
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member=allUsers --role=roles/storage.objectViewer >/dev/null

echo "==> 6. CORS"
gcloud storage buckets update "gs://$BUCKET" --cors-file="$SCRIPT_DIR/gcs-cors.json"

echo "==> 7. Service account $SA_EMAIL"
if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "    exists, skipping"
else
  gcloud iam service-accounts create "$SA_NAME" --project="$PROJECT_ID" --display-name="Portfolio admin"
  sleep 10 # allow IAM propagation
fi

echo "==> 8. Bucket-scoped objectAdmin for service account"
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$SA_EMAIL" --role=roles/storage.objectAdmin >/dev/null

echo "==> 9. Key file"
if [ -f "$KEY_FILE" ]; then
  echo "    $KEY_FILE exists, skipping"
else
  gcloud iam service-accounts keys create "$KEY_FILE" --iam-account="$SA_EMAIL"
fi

echo "==> 10. Add these lines to .env.local"
echo "VITE_PHOTOS_BASE_URL=https://storage.googleapis.com/$BUCKET"
echo "GCS_BUCKET=$BUCKET"
echo "GCS_SERVICE_ACCOUNT_KEY=$(base64 < "$KEY_FILE" | tr -d '\n')"
echo "ADMIN_PASSWORD=<choose a long random string>"
