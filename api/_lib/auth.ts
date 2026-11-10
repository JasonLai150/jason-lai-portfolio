import { createHash, timingSafeEqual } from "node:crypto";

const sha256 = (s: string) => createHash("sha256").update(s).digest();

export function isAuthorized(
  req: { headers: Record<string, string | string[] | undefined> },
  password: string,
): boolean {
  const header = req.headers["authorization"];
  if (typeof header !== "string") return false;
  const match = /^Bearer (.*)$/s.exec(header);
  if (!match) return false;
  return timingSafeEqual(sha256(match[1]), sha256(password));
}
