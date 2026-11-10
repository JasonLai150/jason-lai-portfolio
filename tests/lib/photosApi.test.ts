import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchManifest } from "../../src/lib/photosApi";

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
