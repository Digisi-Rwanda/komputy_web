"use client";
import { useState } from "react";
import { ChartFrame, fmt, read, ticks, type Accessor, type Format, type Series } from "@/components/molecules/ChartFrame";

/** Stacked monthly bars (ECL by stage) with hover tooltip. */
export function StackedBars<T>({ title, data, x, series, format: formatter, height = 220 }: {
  title: string; data: T[]; x: Accessor<T, string>; series: (Series & { value: Accessor<T, number> })[]; format?: Format; height?: number;
}) {
  const format = fmt(formatter), xv = (d: T) => read(x, d), val = (s: { value: Accessor<T, number> }, d: T) => read(s.value, d);
  const [hover, setHover] = useState<number>();
  const W = 640, H = height, L = 48, B = 24, T = 8, bw = (W - L) / data.length;
  const totals = data.map((d) => series.reduce((a, s) => a + val(s, d), 0));
  const tk = ticks(Math.max(...totals) * 1.05), top = tk[tk.length - 1] || 1;
  const py = (v: number) => T + (1 - v / top) * (H - B - T);
  return (
    <ChartFrame title={title} legend={series} table={{ head: ["", ...series.map((s) => s.label), "Total"], rows: data.map((d, i) => [xv(d), ...series.map((s) => format(val(s, d))), format(totals[i])]) }}>
      <div className="relative">
        <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(undefined)}>
          {tk.map((t) => <g key={t}><line x1={L} x2={W} y1={py(t)} y2={py(t)} stroke="var(--chart-grid)" /><text x={L - 8} y={py(t) + 4} fontSize={10} textAnchor="end" fill="var(--fg-muted)">{format(t)}</text></g>)}
          {data.map((d, i) => {
            const x0 = L + i * bw;
            let acc = 0;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} opacity={hover == null || hover === i ? 1 : 0.45} className="transition-opacity duration-fast">
                <rect x={x0} y={T} width={bw} height={H - B - T} fill="transparent" />
                {series.map((s) => { const y0 = py(acc), y1 = py((acc += val(s, d))); return <rect key={s.key} x={x0 + bw * 0.25} y={y1} width={bw * 0.5} height={Math.max(0, y0 - y1)} fill={s.color} />; })}
                <text x={x0 + bw / 2} y={H - 6} fontSize={10} textAnchor="middle" fill="var(--fg-muted)">{xv(d)}</text>
              </g>
            );
          })}
        </svg>
        {hover != null && (
          <div className="pointer-events-none absolute top-2 z-10 min-w-36 -translate-x-1/2 rounded-md border border-line bg-chart-tooltip px-3 py-2 text-micro backdrop-blur" style={{ left: `${((L + (hover + 0.5) * bw) / W) * 100}%` }}>
            <p className="mb-1 text-fg">{xv(data[hover])}</p>
            {series.map((s) => <p key={s.key} className="flex items-center gap-2 text-fg-muted"><span className="size-1.5 rounded-full" style={{ background: s.color }} />{s.label}<span className="ml-auto pl-3 tabular-nums text-fg">{format(val(s, data[hover]))}</span></p>)}
            <p className="mt-1 flex border-t border-line pt-1 text-fg-muted">Total<span className="ml-auto tabular-nums text-fg">{format(totals[hover])}</span></p>
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
