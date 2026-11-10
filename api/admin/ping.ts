import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, sendError } from "../_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "GET") return sendError(res, 405, "method not allowed");
  res.status(204).end();
}
