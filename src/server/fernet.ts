import { createDecipheriv, createHmac, timingSafeEqual } from "node:crypto";

/** Decrypts a Python `cryptography.fernet` token (used once, to migrate the previous engine TOTP secrets). */
export function fernetDecrypt(token: string, key: string): string {
  const k = Buffer.from(key, "base64url"), t = Buffer.from(token, "base64url");
  if (k.length !== 32 || t[0] !== 0x80 || t.length < 57) throw new Error("Invalid Fernet key or token");
  const mac = t.subarray(t.length - 32), body = t.subarray(0, t.length - 32);
  if (!timingSafeEqual(mac, createHmac("sha256", k.subarray(0, 16)).update(body).digest())) throw new Error("Fernet signature mismatch");
  const d = createDecipheriv("aes-128-cbc", k.subarray(16), body.subarray(9, 25));
  return Buffer.concat([d.update(body.subarray(25)), d.final()]).toString("utf8");
}
