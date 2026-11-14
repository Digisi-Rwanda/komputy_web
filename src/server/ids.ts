import { randomBytes } from "node:crypto";

const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** ULID (26 chars, time-sortable), same format as ECL-Server's `new_ulid()`. */
export function ulid(now = Date.now()): string {
  let t = "", n = now;
  for (let i = 0; i < 10; i++) { t = B32[n % 32] + t; n = Math.floor(n / 32); }
  const r = randomBytes(16);
  let s = "";
  for (let i = 0; i < 16; i++) s += B32[r[i] % 32];
  return t + s;
}
