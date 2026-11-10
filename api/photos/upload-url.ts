import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleError, requireAuth, sendError, sendJson } from "../_lib/http.js";
import { signedUploadUrl } from "../_lib/storage.js";
import { extForContentType, fullPath, IMMUTABLE_CACHE, isValidNewId, thumbPath } from "../../src/lib/photos.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") return sendError(res, 405, "method not allowed");

  const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
  if (!isValidNewId(body.id)) return sendError(res, 400, "invalid id");

  let path: string;
  let contentType: string;
  if (body.kind === "thumb") {
    contentType = "image/jpeg";
    path = thumbPath(body.id);
  } else if (body.kind === "full") {
    const ext = extForContentType(body.contentType);
    if (!ext) return sendError(res, 400, "unsupported content type");
    contentType = body.contentType as string;
    path = fullPath(body.id, ext);
  } else {
    return sendError(res, 400, "invalid kind");
  }

  try {
    const url = await signedUploadUrl({ path, contentType, cacheControl: IMMUTABLE_CACHE });
    sendJson(res, 200, { url, headers: { "Content-Type": contentType, "Cache-Control": IMMUTABLE_CACHE } });
  } catch (err) {
    handleError(res, err);
  }
}
