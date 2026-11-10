import { describe, it, expect, vi, afterEach } from "vitest";
import { mockReq, mockRes } from "../helpers/http";

vi.mock("../../api/_lib/env", () => ({
  getEnv: () => {
    throw new Error("Missing env: ADMIN_PASSWORD");
  },
}));

import { requireAuth } from "../../api/_lib/http";

afterEach(() => vi.restoreAllMocks());

describe("requireAuth", () => {
  it("sends a JSON 500 when getEnv throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { res, status, body } = mockRes();
    const ok = requireAuth(mockReq({ headers: { authorization: "Bearer x" } }) as never, res as never);
    expect(ok).toBe(false);
    expect(status()).toBe(500);
    expect(body()).toEqual({ error: "internal error" });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
