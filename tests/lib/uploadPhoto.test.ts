import { describe, it, expect, vi } from "vitest";
import { uploadPhoto, type UploadDeps, type UploadStage } from "../../src/lib/uploadPhoto";

function makeDeps() {
  const thumb = new Blob(["t"], { type: "image/jpeg" });
  const entry = { id: "id1" };
  const deps = {
    makeThumbnail: vi.fn().mockResolvedValue(thumb),
    readDimensions: vi.fn().mockResolvedValue({ width: 400, height: 300 }),
    api: {
      requestUploadUrl: vi.fn().mockImplementation(async (_p: string, a: { kind: string }) => ({
        url: `https://u/${a.kind}`,
        headers: { "Content-Type": "image/jpeg", "Cache-Control": a.kind },
      })),
      putToSignedUrl: vi.fn().mockResolvedValue(undefined),
      createPhoto: vi.fn().mockResolvedValue(entry),
    },
    newId: vi.fn().mockReturnValue("id1"),
  };
  return { deps, thumb, entry };
}
const jpg = () => new File([new Uint8Array(10)], "beach day.jpg", { type: "image/jpeg" });

describe("uploadPhoto", () => {
  it("emits stages in order", async () => {
    const { deps } = makeDeps();
    const stages: UploadStage[] = [];
    await uploadPhoto(jpg(), "beach day", "pw", (s) => stages.push(s), deps as unknown as UploadDeps);
    expect(stages).toEqual(["thumbnail", "dimensions", "signing", "uploading-full", "uploading-thumb", "saving", "done"]);
  });
  it("requests full and thumb URLs with the same id", async () => {
    const { deps } = makeDeps();
    await uploadPhoto(jpg(), "c", "pw", () => {}, deps as unknown as UploadDeps);
    const calls = deps.api.requestUploadUrl.mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual(["pw", { id: "id1", kind: "full", contentType: "image/jpeg" }]);
    expect(calls[1]).toEqual(["pw", { id: "id1", kind: "thumb", contentType: "image/jpeg" }]);
  });
  it("puts full file then thumb with returned headers", async () => {
    const { deps, thumb } = makeDeps();
    const file = jpg();
    await uploadPhoto(file, "c", "pw", () => {}, deps as unknown as UploadDeps);
    const puts = deps.api.putToSignedUrl.mock.calls;
    expect(puts).toHaveLength(2);
    expect(puts[0]).toEqual(["https://u/full", { "Content-Type": "image/jpeg", "Cache-Control": "full" }, file]);
    expect(puts[1]).toEqual(["https://u/thumb", { "Content-Type": "image/jpeg", "Cache-Control": "thumb" }, thumb]);
  });
  it("creates the photo record and returns it", async () => {
    const { deps, entry } = makeDeps();
    const file = jpg();
    const out = await uploadPhoto(file, "beach day", "pw", () => {}, deps as unknown as UploadDeps);
    expect(deps.api.createPhoto).toHaveBeenCalledWith("pw", {
      id: "id1", caption: "beach day", contentType: "image/jpeg", width: 400, height: 300, bytes: file.size,
    });
    expect(out).toBe(entry);
  });
  it("rejects heic before calling any dependency", async () => {
    const { deps } = makeDeps();
    const f = new File([new Uint8Array(10)], "x.heic", { type: "image/heic" });
    await expect(uploadPhoto(f, "c", "pw", () => {}, deps as unknown as UploadDeps)).rejects.toThrow("Unsupported file type");
    for (const fn of [deps.makeThumbnail, deps.readDimensions, deps.newId, deps.api.requestUploadUrl, deps.api.putToSignedUrl, deps.api.createPhoto]) {
      expect(fn).not.toHaveBeenCalled();
    }
  });
  it("does not create the photo if a PUT fails", async () => {
    const { deps } = makeDeps();
    deps.api.putToSignedUrl.mockRejectedValueOnce(new Error("boom"));
    await expect(uploadPhoto(jpg(), "c", "pw", () => {}, deps as unknown as UploadDeps)).rejects.toThrow("boom");
    expect(deps.api.createPhoto).not.toHaveBeenCalled();
  });
});
