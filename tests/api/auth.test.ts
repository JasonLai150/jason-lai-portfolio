import { describe, expect, it } from "vitest";
import { isAuthorized } from "../../api/_lib/auth";
import { mockReq } from "../helpers/http";

const password = "correct horse";

describe("isAuthorized", () => {
  it("accepts the correct bearer token", () => {
    expect(isAuthorized(mockReq({ headers: { authorization: "Bearer correct horse" } }), password)).toBe(true);
  });
  it("rejects a wrong token", () => {
    expect(isAuthorized(mockReq({ headers: { authorization: "Bearer wrong" } }), password)).toBe(false);
  });
  it("rejects a different-length token without throwing", () => {
    expect(isAuthorized(mockReq({ headers: { authorization: "Bearer correct horse!" } }), password)).toBe(false);
  });
  it("rejects non-bearer schemes and missing header", () => {
    expect(isAuthorized(mockReq({ headers: { authorization: "Basic xyz" } }), password)).toBe(false);
    expect(isAuthorized(mockReq(), password)).toBe(false);
  });
  it("rejects an array-valued header without throwing", () => {
    const req = { headers: { authorization: ["Bearer correct horse"] } };
    expect(isAuthorized(req, password)).toBe(false);
  });
});
