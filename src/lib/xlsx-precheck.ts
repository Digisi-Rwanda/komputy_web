/**
 * Browser pre-check for .xlsx uploads, before anything leaves the machine: real zip, no macros, and every sheet's
 * header row contains the required columns. Streams only the first row of each sheet (works on 50 MB workbooks).
 * The authoritative validation still runs in the engine (Python); this only catches wrong files in seconds.
 */
export interface Precheck { ok: boolean; errors: string[]; sheets: { name: string; headers: string[] }[] }
// Mirrors the engine app/engine/workbook.py HEADER_SCAN_ROWS and pd_criteria._DATA_SHEET_HINT_THRESHOLD.
const HEADER_SCAN_ROWS = 20, DATA_SHEET_HINT = 2;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

interface Entry { name: string; method: number; size: number; offset: number }
async function entries(file: Blob): Promise<Entry[]> {
  const tail = new DataView(await file.slice(Math.max(0, file.size - 65_557)).arrayBuffer());
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("not-zip");
  const count = tail.getUint16(eocd + 10, true), cdSize = tail.getUint32(eocd + 12, true), cdOff = tail.getUint32(eocd + 16, true);
  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
  const out: Entry[] = [];
  for (let p = 0, n = 0; n < count && p + 46 <= cd.byteLength; n++) {
    if (cd.getUint32(p, true) !== 0x02014b50) throw new Error("not-zip");
    const nameLen = cd.getUint16(p + 28, true), extra = cd.getUint16(p + 30, true), comment = cd.getUint16(p + 32, true);
    out.push({ name: new TextDecoder().decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen)), method: cd.getUint16(p + 10, true), size: cd.getUint32(p + 20, true), offset: cd.getUint32(p + 42, true) });
    p += 46 + nameLen + extra + comment;
  }
  return out;
}

/** Decompressed text of one entry, read until `stop` returns true (or the end). */
async function readText(file: Blob, e: Entry, stop: (soFar: string) => boolean): Promise<string> {
  const h = new DataView(await file.slice(e.offset, e.offset + 30).arrayBuffer());
  const start = e.offset + 30 + h.getUint16(26, true) + h.getUint16(28, true);
  let stream = file.slice(start, start + e.size).stream() as ReadableStream<Uint8Array>;
  if (e.method === 8) stream = stream.pipeThrough(new DecompressionStream("deflate-raw") as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  else if (e.method !== 0) throw new Error("compression");
  const reader = stream.getReader(), dec = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (value) text += dec.decode(value, { stream: true });
    if (done || stop(text)) { void reader.cancel().catch(() => {}); return text; }
  }
}

const unxml = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

export async function precheckXlsx(file: File, required: string[][], maxMb = 50): Promise<Precheck> {
  const errors: string[] = [];
  if (!/\.xlsx$/i.test(file.name)) return { ok: false, errors: [/\.xls[mb]$/i.test(file.name) ? "Macro enabled or binary workbooks aren't accepted. Save as .xlsx." : "Upload an Excel workbook (.xlsx)."], sheets: [] };
  if (file.size > maxMb * 1048576) return { ok: false, errors: [`The file is ${(file.size / 1048576).toFixed(1)} MB; the limit is ${maxMb} MB.`], sheets: [] };
  let list: Entry[];
  try { list = await entries(file); } catch { return { ok: false, errors: ["This file isn't a valid .xlsx workbook. Open it in Excel and save it again."], sheets: [] }; }
  if (list.some((e) => /vbaProject\.bin$/i.test(e.name))) return { ok: false, errors: ["This workbook contains macros. Save a copy as .xlsx without macros."], sheets: [] };
  const byName = new Map(list.map((e) => [e.name, e]));
  const wb = byName.get("xl/workbook.xml"), rels = byName.get("xl/_rels/workbook.xml.rels");
  if (!wb || !rels) return { ok: false, errors: ["This file isn't a valid .xlsx workbook."], sheets: [] };
  const [wbXml, relXml] = await Promise.all([readText(file, wb, () => false), readText(file, rels, () => false)]);
  const target = new Map([...relXml.matchAll(/<Relationship\b[^>]*>/g)].map((m) => [/Id="([^"]+)"/.exec(m[0])?.[1], /Target="([^"]+)"/.exec(m[0])?.[1]]));
  const sheetDefs = [...wbXml.matchAll(/<sheet\b[^>]*>/g)].map((m) => ({ name: unxml(/name="([^"]*)"/.exec(m[0])?.[1] ?? "Sheet"), path: target.get(/r:id="([^"]+)"/.exec(m[0])?.[1]) ?? "" }))
    .map((s) => ({ ...s, path: s.path.startsWith("/") ? s.path.slice(1) : `xl/${s.path.replace(/^\.\//, "")}` }));
  // First HEADER_SCAN_ROWS rows of each sheet (the engine allows title rows above the table), as raw cells.
  const sheetRows = await Promise.all(sheetDefs.map(async (s) => {
    const e = byName.get(s.path);
    const xml = e ? await readText(file, e, (t) => (t.match(/<\/row>/g)?.length ?? 0) >= HEADER_SCAN_ROWS || t.length > 4_000_000) : "";
    const rows = [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].slice(0, HEADER_SCAN_ROWS).map((row) =>
      [...row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map((c) => ({ shared: /t="s"/.test(c[1]), v: unxml((/<v>([\s\S]*?)<\/v>/.exec(c[2] ?? "")?.[1]) ?? (/<t[^>]*>([\s\S]*?)<\/t>/.exec(c[2] ?? "")?.[1]) ?? "") })));
    return { name: s.name, rows };
  }));
  const need = Math.max(-1, ...sheetRows.flatMap((r) => r.rows.flat().filter((c) => c.shared).map((c) => Number(c.v))));
  let strings: string[] = [];
  const ss = byName.get("xl/sharedStrings.xml");
  if (need >= 0 && ss) {
    const xml = await readText(file, ss, (t) => (t.match(/<\/si>/g)?.length ?? 0) > need);
    strings = [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => unxml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")));
  }
  const matches = (headers: string[]) => { const have = new Set(headers.map(norm)); return required.filter((alts) => alts.some((a) => have.has(norm(a)))).length; };
  // Per sheet, the header is the scanned row matching the most required columns (same rule as the engine).
  const sheets = sheetRows.map((r) => ({ name: r.name, headers: r.rows.map((cells) => cells.map((c) => (c.shared ? strings[Number(c.v)] ?? "" : c.v).trim()).filter(Boolean)).reduce((best, h) => (matches(h) > matches(best) ? h : best), [] as string[]) }));
  // Sheets matching fewer than DATA_SHEET_HINT columns are cover/notes tabs and skipped, like the engine does.
  const data = sheets.filter((s) => matches(s.headers) >= Math.min(DATA_SHEET_HINT, required.length));
  if (!data.length) errors.push(`No sheet has the expected columns (${required.map((a) => a[0]).join(", ")}). Check you picked the right file.`);
  for (const s of data) {
    const have = new Set(s.headers.map(norm));
    const missing = required.filter((alts) => !alts.some((a) => have.has(norm(a)))).map((alts) => alts[0]);
    if (missing.length) errors.push(`Sheet “${s.name}” is missing: ${missing.join(", ")}.`);
  }
  return { ok: !errors.length, errors, sheets };
}

/** Required columns per ECL dataset, with the aliases the engine accepts (app/engine/pd_engine.py, ecl_rules.py). */
export const ECL_REQUIRED: Record<"pd" | "lgd" | "ead", string[][]> = {
  pd: [["Loan ID"], ["Staging", "Staging (Stage)", "Stage"], ["Loan Amount"], ["SEGMENT"], ["Reporting Month", 'Reporting Month ("As At")', "As At"]],
  lgd: [["Customer ID"], ["Loan ID"], ["Outstanding Amount"]],
  ead: [["Loan ID"], ["Customer ID"], ["SEGMENT"], ["Reporting Date"], ["First Payment Date"], ["Maturity Date"], ["Stage", "Staging", "Staging (Stage)"], ["Outstanding Amount"], ["EIR", "Effective Interest Rate (EIR)", "Effective Interest Rate"]],
};
