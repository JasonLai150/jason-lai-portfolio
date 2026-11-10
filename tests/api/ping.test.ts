import { describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "../helpers/http";

vi.mock("../../api/_lib/env", () => ({
  getEnv: () => ({ bucket: "b", serviceAccount: { client_email: "x", private_key: "y" }, adminPassword: "p" }),
}));

import handler from "../../api/admin/ping";

const run = async (init: Parameters<typeof mockReq>[0]) => {
  const r = mockRes();
  await handler(mockReq(init) as never, r.res as never);
  return r;
};

describe("GET /api/admin/ping", () => {
  it("204 with the right password", async () => {
    expect((await run({ headers: { authorization: "Bearer p" } })).status()).toBe(204);
  });
  it("401 with the wrong password", async () => {
    const r = await run({ headers: { authorization: "Bearer nope" } });
    expect(r.status()).toBe(401);
    expect(r.body()).toEqual({ error: "unauthorized" });
  });
  it("405 for POST", async () => {
    const r = await run({ method: "POST", headers: { authorization: "Bearer p" } });
    expect(r.status()).toBe(405);
    expect(r.body()).toEqual({ error: "method not allowed" });
  });
});
