// Renders the Komputy mark (src/app/icon.svg) into the raster icons Next.js serves by file convention.
// Run after changing the mark: node scripts/build-icons.mjs (outputs are committed).
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync(new URL("../src/app/icon.svg", import.meta.url));
const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
const out = (name, buf) => writeFileSync(new URL(`../${name}`, import.meta.url), buf);

out("src/app/apple-icon.png", await png(180));
out("public/brand/icon-192.png", await png(192));
out("public/brand/icon-512.png", await png(512));

// favicon.ico: PNG-compressed entries at 16, 32 and 48 px (supported by every current browser).
const sizes = [16, 32, 48], imgs = await Promise.all(sizes.map(png));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(imgs[i].length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += imgs[i].length;
});
out("src/app/favicon.ico", Buffer.concat([head, ...imgs]));
console.log("icons written");
