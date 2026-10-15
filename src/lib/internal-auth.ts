import { timingSafeEqual } from "node:crypto";

// timingSafeEqual throws on unequal lengths, so handle that case separately.
function safeEqual(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export type InternalAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

// Fails closed: no GATEWAY_TOKEN means 503, never open.
export function checkInternalAuth(authorization: string | null): InternalAuthResult {
  const expected = process.env.GATEWAY_TOKEN?.trim();
  if (!expected) {
    return { ok: false, status: 503, error: "gateway_token_unset" };
  }

  const presented = /^Bearer (.+)$/.exec(authorization ?? "")?.[1];
  if (!presented || !safeEqual(presented, expected)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  return { ok: true };
}
