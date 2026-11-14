import { pd } from "@/lib/format";

/** PD transition matrix heat table: cell tint scales with probability; diagonal outlined. */
export function PdMatrix({ rows, cols, values, caption = "PD transition matrix" }: { rows: string[]; cols: string[]; values: number[][]; caption?: string }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[420px] border-separate border-spacing-1 font-mono text-small tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead><tr><th scope="col" className="p-2"><span className="sr-only">From</span></th>{cols.map((c) => <th key={c} scope="col" className="p-2 text-center font-normal text-fg-muted">{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r}>
              <th scope="row" className="p-2 text-left font-normal text-fg-muted">{r}</th>
              {values[i].map((v, j) => (
                <td key={j} className={`rounded-md p-3 text-center text-fg ${i === j ? "ring-1 ring-accent" : ""}`} style={{ background: `color-mix(in srgb, var(--chart-1) ${Math.round(Math.sqrt(v) * 80)}%, var(--surface))` }}>{pd(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
