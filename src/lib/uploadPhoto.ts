import { ALLOWED_CONTENT_TYPES, newId, type PhotoEntry } from "./photos";
import * as photosApi from "./photosApi";
import { makeThumbnail, readDimensions } from "./thumbnail";

export type UploadStage =
  | "thumbnail"
  | "dimensions"
  | "signing"
  | "uploading-full"
  | "uploading-thumb"
  | "saving"
  | "done";

export interface UploadDeps {
  makeThumbnail: (file: File) => Promise<Blob>;
  readDimensions: (file: File) => Promise<{ width: number; height: number }>;
  api: Pick<typeof photosApi, "requestUploadUrl" | "putToSignedUrl" | "createPhoto">;
  newId: () => string;
}

const defaultDeps: UploadDeps = {
  makeThumbnail,
  readDimensions,
  api: photosApi,
  newId,
};

export async function uploadPhoto(
  file: File,
  caption: string,
  password: string,
  onStage: (s: UploadStage) => void,
  deps: UploadDeps = defaultDeps,
): Promise<PhotoEntry> {
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_CONTENT_TYPES, file.type)) throw new Error("Unsupported file type");
  const { api } = deps;
  const id = deps.newId();

  onStage("thumbnail");
  const thumb = await deps.makeThumbnail(file);
  onStage("dimensions");
  const { width, height } = await deps.readDimensions(file);

  onStage("signing");
  const full = await api.requestUploadUrl(password, { id, kind: "full", contentType: file.type });
  const thumbUrl = await api.requestUploadUrl(password, { id, kind: "thumb", contentType: file.type });

  onStage("uploading-full");
  await api.putToSignedUrl(full.url, full.headers, file);
  onStage("uploading-thumb");
  await api.putToSignedUrl(thumbUrl.url, thumbUrl.headers, thumb);

  onStage("saving");
  const entry = await api.createPhoto(password, { id, caption, contentType: file.type, width, height, bytes: file.size });
  onStage("done");
  return entry;
}
