import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchManifest, adminPing, requestUploadUrl, createPhoto, deletePhoto } from "../../src/lib/photosApi";

afterEach(() => vi.unstubAllGlobals());

describe("fetchManifest", () => {
  it("resolves the parsed manifest on 200", async () => {
    const manifest = { version: 1, updatedAt: "x", photos: [] };
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => manifest });
    vi.stubGlobal("fetch", f);
    await expect(fetchManifest("https://s/b")).resolves.toEqual(manifest);
    expect(f.mock.calls[0][0]).toMatch(/^https:\/\/s\/b\/photos\.json\?t=/);
    expect(f.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });
  it("returns an empty manifest on 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const m = await fetchManifest("https://s/b");
    expect(m.photos).toEqual([]);
    expect(m.version).toBe(1);
  });
  it("rejects on 500", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchManifest("https://s/b")).rejects.toThrow(/500/);
  });
});

describe("admin api", () => {
  it("adminPing sends bearer and maps 204/401", async () => {
    const f = vi.fn().mockResolvedValueOnce({ ok: true, status: 204 }).mockResolvedValueOnce({ ok: false, status: 401 });
    vi.stubGlobal("fetch", f);
    await expect(adminPing("p")).resolves.toBe(true);
    expect(f.mock.calls[0][0]).toBe("/api/admin/ping");
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer p");
    await expect(adminPing("p")).resolves.toBe(false);
  });
  it("requestUploadUrl posts JSON and returns parsed response", async () => {
    const out = { url: "https://u", headers: { "Content-Type": "image/jpeg", "Cache-Control": "x" } };
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => out });
    vi.stubGlobal("fetch", f);
    const args = { id: "a", kind: "full" as const, contentType: "image/jpeg" };
    await expect(requestUploadUrl("p", args)).resolves.toEqual(out);
    expect(f.mock.calls[0][0]).toBe("/api/photos/upload-url");
    expect(f.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual(args);
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer p");
  });
  it("createPhoto rejects with the server error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "upload not found" }) }));
    await expect(
      createPhoto("p", { id: "a", caption: "c", contentType: "image/jpeg", width: 1, height: 1, bytes: 1 }),
    ).rejects.toThrow("upload not found");
  });
  it("deletePhoto issues DELETE and resolves on 204", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", f);
    await expect(deletePhoto("p", "abc")).resolves.toBeUndefined();
    expect(f.mock.calls[0][0]).toBe("/api/photos/abc");
    expect(f.mock.calls[0][1].method).toBe("DELETE");
  });
});
