import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PhotoError } from "../../src/lib/photos.js";
import { getEnv } from "./env.js";
import { isAuthorized } from "./auth.js";

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

export function sendError(res: VercelResponse, status: number, message: string): void {
  sendJson(res, status, { error: message });
}

export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  let adminPassword: string;
  try {
    adminPassword = getEnv().adminPassword;
  } catch (err) {
    console.error(err);
    sendError(res, 500, "internal error");
    return false;
  }
  if (isAuthorized(req, adminPassword)) return true;
  sendError(res, 401, "unauthorized");
  return false;
}

export function handleError(res: VercelResponse, err: unknown): void {
  if (err instanceof PhotoError) {
    sendError(res, err.status, err.message);
    return;
  }
  console.error(err);
  sendError(res, 500, "internal error");
}
