import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "../helpers/http";
import type { PhotoManifest } from "../../src/lib/photos";

vi.mock("../../api/_lib/env", () => ({
  getEnv: () => ({ bucket: "b", serviceAccount: { client_email: "x", private_key: "y" }, adminPassword: "p" }),
}));
vi.mock("../../api/_lib/storage", () => ({
  objectExists: vi.fn(async () => true),
  updateManifest: vi.fn(),
}));

import handler from "../../api/photos/index";
import { objectExists, updateManifest } from "../../api/_lib/storage";

const auth = { authorization: "Bearer p" };
const empty: PhotoManifest = { version: 1, updatedAt: "2025-01-01T00:00:00.000Z", photos: [] };
const valid = { id: "k3j9d02mfa", caption: "  Hello  ", contentType: "image/jpeg", width: 100, height: 50, bytes: 1234 };

const post = async (body: unknown, headers: Record<string, string> = auth, method = "POST") => {
  const r = mockRes();
  await handler(mockReq({ method, headers, body }) as never, r.res as never);
  return r;
};

beforeEach(() => {
  vi.mocked(objectExists).mockReset().mockResolvedValue(true);
  vi.mocked(updateManifest).mockReset().mockImplementation(async (mutate) => mutate(empty));
});

describe("POST /api/photos", () => {
  it("401 without auth", async () => {
    expect((await post(valid, {})).status()).toBe(401);
  });
  it("405 for GET", async () => {
    expect((await post(undefined, auth, "GET")).status()).toBe(405);
  });
  it("creates the entry", async () => {
    const r = await post(valid);
    expect(r.status()).toBe(201);
    expect(objectExists).toHaveBeenCalledWith("full/k3j9d02mfa.jpg");
    expect(objectExists).toHaveBeenCalledWith("thumbs/k3j9d02mfa.jpg");
    expect(updateManifest).toHaveBeenCalledTimes(1);
    const b = r.body() as Record<string, unknown>;
    expect(b).toMatchObject({
      id: "k3j9d02mfa", caption: "Hello", full: "full/k3j9d02mfa.jpg", thumb: "thumbs/k3j9d02mfa.jpg",
      width: 100, height: 50, bytes: 1234,
    });
    expect(new Date(b.createdAt as string).toISOString()).toBe(b.createdAt);
  });
  it("409 when the thumb is missing", async () => {
    vi.mocked(objectExists).mockImplementation(async (p) => !p.startsWith("thumbs/"));
    const r = await post(valid);
    expect(r.status()).toBe(409);
    expect(r.body()).toEqual({ error: "upload not found" });
    expect(updateManifest).not.toHaveBeenCalled();
  });
  it("409 duplicate id from addPhoto", async () => {
    await post(valid);
    const existing = (await vi.mocked(updateManifest).mock.results[0].value) as PhotoManifest;
    vi.mocked(updateManifest).mockImplementation(async (mutate) => mutate(existing));
    const r = await post(valid);
    expect(r.status()).toBe(409);
    expect(r.body()).toEqual({ error: "Photo k3j9d02mfa already exists" });
  });
  it.each([
    ["blank caption", { caption: "   " }],
    ["negative width", { width: -1 }],
    ["string bytes", { bytes: "big" }],
    ["fractional height", { height: 1.5 }],
    ["slug id", { id: "alaska-2022" }],
    ["bad content type", { contentType: "image/heic" }],
  ])("400 for %s", async (_n, patch) => {
    const r = await post({ ...valid, ...patch });
    expect(r.status()).toBe(400);
    expect(objectExists).not.toHaveBeenCalled();
    expect(updateManifest).not.toHaveBeenCalled();
  });
  it("400 for missing body", async () => {
    expect((await post(undefined)).status()).toBe(400);
  });
});
