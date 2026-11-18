// WCAG contrast of the theme tokens (src/app/globals.css :root). Fails on any pair under its minimum.
// Usage: node scripts/contrast-check.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);
const root = css.slice(
  css.indexOf(":root {"),
  css.indexOf("\n}\n", css.indexOf(":root {")),
);
const raw = Object.fromEntries(
  [...root.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
);
const hex = (name) => {
  let v = raw[name];
  for (let i = 0; i < 5 && v?.startsWith("var("); i++) v = raw[v.slice(6, -1)];
  if (!/^#[0-9a-f]{6}$/i.test(v ?? ""))
    throw new Error(`--${name} is not a solid hex colour: ${v}`);
  return v;
};
const lum = (h) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const TEXT = 4.5,
  UI = 3;
const pairs = [];
for (const fg of ["fg", "fg-body", "fg-muted", "fg-subtle", "link"])
  for (const bg of [
    "canvas",
    "canvas-deep",
    "raised",
    "sidebar",
    "surface",
    "surface-hover",
    "secondary",
  ])
    pairs.push([fg, bg, TEXT]);
for (const s of ["positive", "warning", "negative", "info"]) {
  pairs.push([s, `${s}-tint`, TEXT], [s, "raised", TEXT], [s, "canvas", TEXT]);
}
pairs.push(
  ["fg", "neutral-tint", TEXT],
  ["fg-muted", "neutral-tint", TEXT],
  ["fg", "selected", TEXT],
);
pairs.push(
  ["primary-fg", "primary", TEXT],
  ["primary-fg", "primary-hover", TEXT],
  ["secondary-fg", "secondary", TEXT],
  ["secondary-fg", "secondary-hover", TEXT],
);
pairs.push(
  ["fg-inverse", "accent", TEXT],
  ["fg-inverse", "negative", TEXT],
  ["fg-inverse", "fg", TEXT],
);
for (const c of [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
])
  pairs.push([c, "canvas", UI], [c, "raised", UI]);
pairs.push(
  ["focus", "canvas", UI],
  ["focus", "raised", UI],
  ["accent", "raised", UI],
);

let bad = 0;
for (const [a, b, min] of pairs) {
  const r = ratio(a, b);
  if (r < min) {
    bad++;
    console.log(`FAIL ${a} on ${b}: ${r.toFixed(2)} (needs ${min})`);
  }
}
console.log(`${pairs.length - bad} of ${pairs.length} pairs pass`);
process.exit(bad ? 1 : 0);
