import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PhotoError } from "../../src/lib/photos";
import { getEnv } from "./env";
import { isAuthorized } from "./auth";

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

export function sendError(res: VercelResponse, status: number, message: string): void {
  sendJson(res, status, { error: message });
}

export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (isAuthorized(req, getEnv().adminPassword)) return true;
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
