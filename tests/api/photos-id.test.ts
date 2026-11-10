import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "../helpers/http";
import type { PhotoManifest } from "../../src/lib/photos";

vi.mock("../../api/_lib/env", () => ({
  getEnv: () => ({ bucket: "b", serviceAccount: { client_email: "x", private_key: "y" }, adminPassword: "p" }),
}));
vi.mock("../../api/_lib/storage", () => ({
  updateManifest: vi.fn(),
  deleteObject: vi.fn(async () => {}),
}));

import handler from "../../api/photos/[id]";
import { deleteObject, updateManifest } from "../../api/_lib/storage";

const auth = { authorization: "Bearer p" };
const manifest: PhotoManifest = {
  version: 1,
  updatedAt: "2025-01-01T00:00:00.000Z",
  photos: [
    {
      id: "alaska-2022", caption: "Old", full: "full/alaska-2022.jpeg", thumb: "thumbs/alaska-2022.jpg",
      width: 1, height: 1, bytes: 1, createdAt: "2025-01-01T00:00:00.000Z",
    },
  ],
};

const call = async (method: string, id: string, body?: unknown, headers = auth) => {
  const r = mockRes();
  await handler(mockReq({ method, headers, body, query: { id } }) as never, r.res as never);
  return r;
};

beforeEach(() => {
  vi.mocked(updateManifest).mockReset().mockImplementation(async (mutate) => mutate(manifest));
  vi.mocked(deleteObject).mockReset().mockResolvedValue(undefined);
});

describe("/api/photos/:id", () => {
  it("401 without auth", async () => {
    expect((await call("DELETE", "alaska-2022", undefined, {})).status()).toBe(401);
  });
  it("405 for GET", async () => {
    expect((await call("GET", "alaska-2022")).status()).toBe(405);
  });

  it("PATCH updates the caption", async () => {
    const r = await call("PATCH", "alaska-2022", { caption: "  new  " });
    expect(r.status()).toBe(200);
    expect(r.body()).toMatchObject({ id: "alaska-2022", caption: "new" });
  });
  it("PATCH unknown id is 404", async () => {
    const r = await call("PATCH", "nope", { caption: "x" });
    expect(r.status()).toBe(404);
  });
  it.each(["../x", "Alaska"])("PATCH bad id %s is 400 and storage untouched", async (id) => {
    expect((await call("PATCH", id, { caption: "x" })).status()).toBe(400);
    expect(updateManifest).not.toHaveBeenCalled();
  });
  it("PATCH 201-char caption is 400", async () => {
    expect((await call("PATCH", "alaska-2022", { caption: "a".repeat(201) })).status()).toBe(400);
    expect(updateManifest).not.toHaveBeenCalled();
  });

  it("DELETE removes from manifest first, then objects", async () => {
    const r = await call("DELETE", "alaska-2022");
    expect(r.status()).toBe(204);
    expect(vi.mocked(deleteObject).mock.calls).toEqual([["full/alaska-2022.jpeg"], ["thumbs/alaska-2022.jpg"]]);
    expect(vi.mocked(updateManifest).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(deleteObject).mock.invocationCallOrder[0],
    );
  });
  it("DELETE unknown id is 404 and deletes nothing", async () => {
    expect((await call("DELETE", "nope")).status()).toBe(404);
    expect(deleteObject).not.toHaveBeenCalled();
  });
  it("DELETE bad id is 400", async () => {
    expect((await call("DELETE", "../x")).status()).toBe(400);
  });
});
