// Finance formatting rules: tabular, negatives in parentheses, currency code once in headers.
const num = (d: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** 1240 -> "1,240.00"; -1240 -> "(1,240.00)" */
export function money(value: number, decimals = 2) {
  const s = num(decimals).format(Math.abs(value));
  return value < 0 ? `(${s})` : s;
}

/** 12846210.55 -> "12.85M" */
export function compact(value: number) {
  const a = Math.abs(value);
  const s = a >= 1e9 ? `${(a / 1e9).toFixed(2)}B` : a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(1)}K` : a.toFixed(0);
  return value < 0 ? `(${s})` : s;
}

/** 0.0231 -> "2.31 %" (ratio in, percent out) */
export function percent(ratio: number, decimals = 2) {
  return `${num(decimals).format(ratio * 100)} %`;
}

/** PD shown to 4 decimals: 0.0213 -> "0.0213" */
export function pd(value: number) {
  return value.toFixed(4);
}

/** Signed delta: 0.042 -> "+4.2 %" */
export function delta(ratio: number, decimals = 1) {
  return `${ratio >= 0 ? "+" : "−"}${num(decimals).format(Math.abs(ratio) * 100)} %`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-30" -> "30 Sep 2026" (fixed names: en-GB renders "Sept") */
export function date(iso: string) {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "9f2c4e…a71" style short hash */
export function shortHash(hash: string) {
  return hash.length > 10 ? `${hash.slice(0, 4)}…${hash.slice(-3)}` : hash;
}

/** 1536 → "1.5 KB" (binary units, one decimal from KB up). */
export function bytes(n: number) {
  if (!Number.isFinite(n) || n < 1024) return `${Math.max(0, Math.round(n || 0))} B`;
  const u = ["KB", "MB", "GB", "TB"];
  let i = -1, v = n;
  do { v /= 1024; i++; } while (v >= 1024 && i < u.length - 1);
  return `${v.toFixed(1)} ${u[i]}`;
}
