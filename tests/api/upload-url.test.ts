import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "../helpers/http";

vi.mock("../../api/_lib/env", () => ({
  getEnv: () => ({ bucket: "b", serviceAccount: { client_email: "x", private_key: "y" }, adminPassword: "p" }),
}));
vi.mock("../../api/_lib/storage", () => ({
  signedUploadUrl: vi.fn(async () => "https://signed.example/u"),
}));

import handler from "../../api/photos/upload-url";
import { signedUploadUrl } from "../../api/_lib/storage";

const CACHE = "public, max-age=31536000, immutable";
const auth = { authorization: "Bearer p" };

const run = async (init: Parameters<typeof mockReq>[0]) => {
  const r = mockRes();
  await handler(mockReq(init) as never, r.res as never);
  return r;
};
const post = (body: unknown) => run({ method: "POST", headers: auth, body });

beforeEach(() => vi.mocked(signedUploadUrl).mockClear());

describe("POST /api/photos/upload-url", () => {
  it("401 without auth", async () => {
    expect((await run({ method: "POST", body: {} })).status()).toBe(401);
  });
  it("405 for GET", async () => {
    expect((await run({ headers: auth })).status()).toBe(405);
  });
  it("signs a full upload", async () => {
    const r = await post({ id: "k3j9d02mfa", kind: "full", contentType: "image/png" });
    expect(r.status()).toBe(200);
    expect(signedUploadUrl).toHaveBeenCalledWith({
      path: "full/k3j9d02mfa.png",
      contentType: "image/png",
      cacheControl: CACHE,
    });
    expect(r.body()).toEqual({
      url: "https://signed.example/u",
      headers: { "Content-Type": "image/png", "Cache-Control": CACHE },
    });
  });
  it("forces jpeg for thumbs", async () => {
    const r = await post({ id: "k3j9d02mfa", kind: "thumb", contentType: "image/png" });
    expect(r.status()).toBe(200);
    expect(signedUploadUrl).toHaveBeenCalledWith({
      path: "thumbs/k3j9d02mfa.jpg",
      contentType: "image/jpeg",
      cacheControl: CACHE,
    });
  });
  it("400 for slug ids", async () => {
    expect((await post({ id: "alaska-2022", kind: "full", contentType: "image/png" })).status()).toBe(400);
  });
  it("400 for disallowed content type", async () => {
    expect((await post({ id: "k3j9d02mfa", kind: "full", contentType: "image/heic" })).status()).toBe(400);
  });
  it("400 for bad kind", async () => {
    expect((await post({ id: "k3j9d02mfa", kind: "x", contentType: "image/png" })).status()).toBe(400);
  });
  it("400 for missing body", async () => {
    expect((await post(undefined)).status()).toBe(400);
  });
  it("500 without leaking when signing fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(signedUploadUrl).mockRejectedValueOnce(new Error("boom"));
    const r = await post({ id: "k3j9d02mfa", kind: "full", contentType: "image/png" });
    expect(r.status()).toBe(500);
    expect(r.body()).toEqual({ error: "internal error" });
    spy.mockRestore();
  });
});
