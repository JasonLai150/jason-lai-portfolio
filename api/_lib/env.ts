export interface Env {
  bucket: string;
  serviceAccount: { client_email: string; private_key: string; project_id?: string; [k: string]: unknown };
  adminPassword: string;
}

let cached: Env | undefined;

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getEnv(): Env {
  if (cached) return cached;
  const bucket = need("GCS_BUCKET");
  const keyB64 = need("GCS_SERVICE_ACCOUNT_KEY");
  const adminPassword = need("ADMIN_PASSWORD");
  const serviceAccount = JSON.parse(Buffer.from(keyB64, "base64").toString("utf8"));
  cached = { bucket, serviceAccount, adminPassword };
  return cached;
}
