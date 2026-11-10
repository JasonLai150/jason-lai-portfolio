import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleError, requireAuth, sendError, sendJson } from "../_lib/http.js";
import { deleteObject, updateManifest } from "../_lib/storage.js";
import {
  isValidId,
  normalizeCaption,
  removePhoto,
  setCaption,
  type PhotoEntry,
} from "../../src/lib/photos.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "PATCH" && req.method !== "DELETE") return sendError(res, 405, "method not allowed");

  const id = req.query.id;
  if (!isValidId(id)) return sendError(res, 400, "invalid id");

  if (req.method === "PATCH") {
    const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
    const caption = normalizeCaption(body.caption);
    if (caption === null) return sendError(res, 400, "invalid caption");
    try {
      const next = await updateManifest((m) => setCaption(m, id, caption));
      const updated = next.photos.find((p) => p.id === id);
      sendJson(res, 200, updated);
    } catch (err) {
      handleError(res, err);
    }
    return;
  }

  try {
    let removed: PhotoEntry | undefined;
    await updateManifest((m) => {
      const result = removePhoto(m, id);
      removed = result.removed;
      return result.manifest;
    });
    if (removed) {
      await deleteObject(removed.full);
      await deleteObject(removed.thumb);
    }
    res.status(204).end();
  } catch (err) {
    handleError(res, err);
  }
}
