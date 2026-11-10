import { beforeEach, describe, expect, it, vi } from "vitest";
import { MANIFEST_CACHE, PhotoError, type PhotoManifest } from "../../src/lib/photos";

const file = {
  download: vi.fn(),
  getMetadata: vi.fn(),
  save: vi.fn(),
  exists: vi.fn(),
  delete: vi.fn(),
  getSignedUrl: vi.fn(),
};

vi.mock("@google-cloud/storage", () => ({
  Storage: class {
    bucket() {
      return { file: () => file };
    }
  },
}));
vi.mock("../../api/_lib/env", () => ({
  getEnv: () => ({
    bucket: "b",
    serviceAccount: { client_email: "x", private_key: "y" },
    adminPassword: "p",
  }),
}));

import { deleteObject, readManifest, signedUploadUrl, updateManifest, writeManifest } from "../../api/_lib/storage";

const manifest = (n: number): PhotoManifest => ({
  version: 1,
  updatedAt: "2025-01-01T00:00:00.000Z",
  photos: Array.from({ length: n }, (_, i) => ({
    id: `id${i}`, caption: "", full: "f", thumb: "t", width: 1, height: 1, bytes: 1, createdAt: "2025-01-01T00:00:00.000Z",
  })),
});

beforeEach(() => {
  Object.values(file).forEach((f) => f.mockReset());
});

describe("readManifest", () => {
  it("returns an empty manifest and generation 0 on 404", async () => {
    file.getMetadata.mockRejectedValue({ code: 404 });
    const r = await readManifest();
    expect(r.generation).toBe("0");
    expect(r.manifest.version).toBe(1);
    expect(r.manifest.photos).toEqual([]);
  });

  it("returns the parsed manifest and generation", async () => {
    file.getMetadata.mockResolvedValue([{ generation: "17" }]);
    file.download.mockResolvedValue([Buffer.from(JSON.stringify(manifest(2)))]);
    const r = await readManifest();
    expect(r.generation).toBe("17");
    expect(r.manifest.photos).toHaveLength(2);
  });
});

describe("writeManifest", () => {
  it("saves with content type, cache control and generation precondition", async () => {
    file.save.mockResolvedValue(undefined);
    await writeManifest(manifest(1), "17");
    const [body, opts] = file.save.mock.calls[0];
    expect(typeof body).toBe("string");
    expect(opts.contentType).toBe("application/json");
    expect(opts.metadata.cacheControl).toBe(MANIFEST_CACHE);
    expect(opts.preconditionOpts.ifGenerationMatch).toBe(17);
    expect(opts.resumable).toBe(false);
  });
});

describe("updateManifest", () => {
  it("re-reads and retries after a 412", async () => {
    file.getMetadata
      .mockResolvedValueOnce([{ generation: "1" }])
      .mockResolvedValueOnce([{ generation: "2" }]);
    file.download
      .mockResolvedValueOnce([Buffer.from(JSON.stringify(manifest(1)))])
      .mockResolvedValueOnce([Buffer.from(JSON.stringify(manifest(2)))]);
    file.save.mockRejectedValueOnce({ code: 412 }).mockResolvedValueOnce(undefined);

    const result = await updateManifest((m) => ({ ...m, photos: [...m.photos, manifest(1).photos[0]] }));

    expect(file.save).toHaveBeenCalledTimes(2);
    expect(file.getMetadata).toHaveBeenCalledTimes(2);
    expect(file.save.mock.calls[0][1].preconditionOpts.ifGenerationMatch).toBe(1);
    expect(file.save.mock.calls[1][1].preconditionOpts.ifGenerationMatch).toBe(2);
    expect(result.photos).toHaveLength(3);
  });

  it("throws a 409 PhotoError after three consecutive 412s", async () => {
    file.getMetadata.mockResolvedValue([{ generation: "1" }]);
    file.download.mockResolvedValue([Buffer.from(JSON.stringify(manifest(1)))]);
    file.save.mockRejectedValue({ code: 412 });
    const err = await updateManifest((m) => m).catch((e) => e);
    expect(err).toBeInstanceOf(PhotoError);
    expect(err.status).toBe(409);
    expect(file.save).toHaveBeenCalledTimes(3);
  });
});

describe("signedUploadUrl", () => {
  it("requests a V4 write URL with cache-control extension header", async () => {
    file.getSignedUrl.mockResolvedValue(["https://signed"]);
    const url = await signedUploadUrl({ path: "full/a.jpg", contentType: "image/jpeg", cacheControl: "c" });
    expect(url).toBe("https://signed");
    const opts = file.getSignedUrl.mock.calls[0][0];
    expect(opts.version).toBe("v4");
    expect(opts.action).toBe("write");
    expect(opts.contentType).toBe("image/jpeg");
    expect(opts.extensionHeaders).toEqual({ "cache-control": "c" });
    expect(Math.abs(opts.expires - (Date.now() + 15 * 60 * 1000))).toBeLessThan(5000);
  });
});

describe("deleteObject", () => {
  it("ignores 404", async () => {
    file.delete.mockRejectedValue({ code: 404 });
    await expect(deleteObject("full/a.jpg")).resolves.toBeUndefined();
  });
});
