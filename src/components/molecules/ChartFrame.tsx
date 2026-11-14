import type { ReactNode } from "react";
import { compact, money, percent } from "@/lib/format";

/** Accessors and formatters may be names (serialisable from Server Components) or functions (client callers). */
export type Accessor<T, R> = keyof T | ((d: T) => R);
export type Format = "compact" | "money" | "percent" | "plain" | ((v: number) => string);
export const read = <T, R>(a: Accessor<T, R>, d: T): R => (typeof a === "function" ? a(d) : (d[a] as R));
export const fmt = (f: Format = "plain"): ((v: number) => string) => (typeof f === "function" ? f : f === "compact" ? compact : f === "money" ? (v) => money(v) : f === "percent" ? (v) => percent(v) : String);


export interface Series { key: string; label: string; color: string }

/** Wraps a chart: legend, and a screen-reader data table (charts are aria-hidden visually-rich SVG). */
export function ChartFrame({ title, legend, table, children }: { title: string; legend?: Series[]; table: { head: string[]; rows: (string | number)[][] }; children: ReactNode }) {
  return (
    <figure className="flex w-full flex-col gap-3">
      <figcaption className="sr-only">{title}</figcaption>
      {children}
      {legend && (
        <div aria-hidden className="flex flex-wrap gap-4 text-micro text-fg-muted">
          {legend.map((s) => <span key={s.key} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: s.color }} />{s.label}</span>)}
        </div>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead><tr>{table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
      </table>
    </figure>
  );
}

export { ticks } from "@/lib/ticks";
