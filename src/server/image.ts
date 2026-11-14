import "server-only";

const MAGIC: [string, (b: Buffer) => boolean][] = [
  ["image/webp", (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP"],
  ["image/png", (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ["image/jpeg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
];

/**
 * Accepts a small raster data URL (the browser resizes to 256px WebP first) and checks the bytes match the type.
 * SVG is never accepted (script risk). shortcut: images live in the DB row (≤ 200 KB); move to S3 + CDN if they grow.
 */
export function validImage(dataUrl: string): string | null {
  const m = /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m || m[2].length > 270_000) return null;
  const bytes = Buffer.from(m[2], "base64");
  return MAGIC.some(([type, ok]) => type === m[1] && ok(bytes)) ? dataUrl : null;
}
