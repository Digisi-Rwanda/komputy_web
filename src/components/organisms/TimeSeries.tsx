"use client";
import { useState } from "react";
import { ChartFrame, fmt, read, ticks, type Accessor, type Format, type Series } from "@/components/molecules/ChartFrame";

interface Props<T> {
  title: string;
  data: T[];
  x: Accessor<T, string>;
  series: (Series & { value: Accessor<T, number> })[];
  /** area fill under each line */
  area?: boolean;
  format?: Format;
  height?: number;
}

/** Multi-series line/area chart with hover crosshair + synced tooltip (ECL trend, term structure, lease roll-forward). */
export function TimeSeries<T>({ title, data, x, series, area, format: formatter, height = 220 }: Props<T>) {
  const format = fmt(formatter), xv = (d: T) => read(x, d), val = (s: { value: Accessor<T, number> }, d: T) => read(s.value, d);
  const [hover, setHover] = useState<number>();
  const W = 640, H = height, L = 48, B = 24, T = 8;
  const max = Math.max(...data.flatMap((d) => series.map((s) => val(s, d)))) * 1.05;
  const tk = ticks(max), top = tk[tk.length - 1] || 1;
  const px = (i: number) => L + (i / Math.max(1, data.length - 1)) * (W - L - 8);
  const py = (v: number) => T + (1 - v / top) * (H - B - T);
  return (
    <ChartFrame title={title} legend={series} table={{ head: ["", ...series.map((s) => s.label)], rows: data.map((d) => [xv(d), ...series.map((s) => format(val(s, d)))]) }}>
      <div className="relative">
        <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" onMouseLeave={() => setHover(undefined)}
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const rel = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(data.length - 1, Math.round(((rel - L) / (W - L - 8)) * (data.length - 1))))); }}>
          <defs>{series.map((s) => <linearGradient key={s.key} id={`g-${s.key}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={s.color} stopOpacity="0.25" /><stop offset="1" stopColor={s.color} stopOpacity="0" /></linearGradient>)}</defs>
          {tk.map((t) => <g key={t}><line x1={L} x2={W} y1={py(t)} y2={py(t)} stroke="var(--chart-grid)" /><text x={L - 8} y={py(t) + 4} fontSize={10} textAnchor="end" fill="var(--fg-muted)">{format(t)}</text></g>)}
          {data.map((d, i) => <text key={i} x={px(i)} y={H - 6} fontSize={10} textAnchor="middle" fill="var(--fg-muted)">{xv(d)}</text>)}
          {series.map((s) => {
            const pts = data.map((d, i) => `${px(i)},${py(val(s, d))}`).join(" ");
            return (
              <g key={s.key}>
                {area && <polygon points={`${px(0)},${py(0)} ${pts} ${px(data.length - 1)},${py(0)}`} fill={`url(#g-${s.key})`} />}
                <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              </g>
            );
          })}
          {hover != null && (
            <g>
              <line x1={px(hover)} x2={px(hover)} y1={T} y2={H - B} stroke="var(--chart-crosshair)" strokeDasharray="3 3" />
              {series.map((s) => <circle key={s.key} cx={px(hover)} cy={py(val(s, data[hover]))} r={4} fill={s.color} stroke="var(--canvas)" strokeWidth={2} />)}
            </g>
          )}
        </svg>
        {hover != null && (
          <div className="pointer-events-none absolute top-2 z-10 min-w-36 -translate-x-1/2 rounded-md border border-line bg-chart-tooltip px-3 py-2 text-micro" style={{ left: `${(px(hover) / W) * 100}%` }}>
            <p className="mb-1 text-fg">{xv(data[hover])}</p>
            {series.map((s) => <p key={s.key} className="flex items-center gap-2 text-fg-muted"><span className="size-1.5 rounded-full" style={{ background: s.color }} />{s.label}<span className="ml-auto pl-3 tabular-nums text-fg">{format(val(s, data[hover]))}</span></p>)}
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
