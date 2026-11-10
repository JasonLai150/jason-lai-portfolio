import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleError, requireAuth, sendError, sendJson } from "../_lib/http.js";
import { objectExists, updateManifest } from "../_lib/storage.js";
import {
  addPhoto,
  extForContentType,
  fullPath,
  isValidNewId,
  normalizeCaption,
  thumbPath,
  type PhotoEntry,
} from "../../src/lib/photos.js";

const isPositiveInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") return sendError(res, 405, "method not allowed");

  const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
  if (!isValidNewId(body.id)) return sendError(res, 400, "invalid id");
  const caption = normalizeCaption(body.caption);
  if (caption === null) return sendError(res, 400, "invalid caption");
  const ext = extForContentType(body.contentType);
  if (!ext) return sendError(res, 400, "unsupported content type");
  const { width, height, bytes } = body;
  if (!isPositiveInt(width) || !isPositiveInt(height) || !isPositiveInt(bytes)) {
    return sendError(res, 400, "invalid dimensions");
  }

  const full = fullPath(body.id, ext);
  const thumb = thumbPath(body.id);
  const entry: PhotoEntry = {
    id: body.id, caption, full, thumb, width, height, bytes, createdAt: new Date().toISOString(),
  };

  try {
    const [hasFull, hasThumb] = await Promise.all([objectExists(full), objectExists(thumb)]);
    if (!hasFull || !hasThumb) return sendError(res, 409, "upload not found");
    await updateManifest((m) => addPhoto(m, entry));
    sendJson(res, 201, entry);
  } catch (err) {
    handleError(res, err);
  }
}
