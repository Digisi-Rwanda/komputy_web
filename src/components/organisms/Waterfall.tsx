import { compact } from "@/lib/format";
import { ChartFrame } from "@/components/molecules/ChartFrame";

export interface WaterfallStep { label: string; value: number; kind?: "total" }

/** Movement waterfall (ECL Aug→Sep, lease roll-forward). Totals accent; increases amber (more provision), decreases green. */
export function Waterfall({ title, steps, height = 240, increaseIsBad = true }: { title: string; steps: WaterfallStep[]; height?: number; increaseIsBad?: boolean }) {
  const bars = steps.reduce<(WaterfallStep & { lo: number; hi: number; end: number })[]>((acc, s) => {
    const prev = acc.length ? acc[acc.length - 1].end : 0;
    const from = s.kind === "total" ? 0 : prev, to = s.kind === "total" ? s.value : prev + s.value;
    return [...acc, { ...s, lo: Math.min(from, to), hi: Math.max(from, to), end: to }];
  }, []);
  const totals = bars.filter((b) => b.kind === "total").map((b) => b.hi);
  const hi = Math.max(...bars.map((b) => b.hi)), lo = Math.min(...bars.filter((b) => !b.kind).map((b) => b.lo), ...totals);
  const base = Math.max(0, lo - (hi - lo) * 0.6);
  const W = 640, H = height, bw = W / steps.length, top = 24, bottom = H - 36;
  const y = (v: number) => top + (1 - (v - base) / (hi - base)) * (bottom - top);
  const up = increaseIsBad ? "var(--warning)" : "var(--positive)", down = increaseIsBad ? "var(--positive)" : "var(--warning)";
  return (
    <ChartFrame title={title} table={{ head: ["Step", "Amount"], rows: steps.map((s) => [s.label, s.value]) }}>
      <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="w-full">
        {bars.map((b, i) => {
          const x = i * bw + bw * 0.18, w = bw * 0.64, yt = y(b.hi), yb = b.kind === "total" ? bottom : y(b.lo);
          const next = bars[i + 1];
          return (
            <g key={b.label}>
              <rect x={x} y={yt} width={w} height={Math.max(2, yb - yt)} rx={2} fill={b.kind === "total" ? "var(--chart-1)" : b.value >= 0 ? up : down} />
              {next && <line x1={x + w} x2={x + bw} y1={y(b.kind === "total" ? b.hi : b.value >= 0 ? b.hi : b.lo)} y2={y(b.kind === "total" ? b.hi : b.value >= 0 ? b.hi : b.lo)} stroke="var(--line-strong)" strokeDasharray="2 2" />}
              <text x={x + w / 2} y={yt - 6} fontSize={10} textAnchor="middle" fill="var(--fg-body)">{b.kind === "total" ? compact(b.value) : `${b.value >= 0 ? "+" : ""}${compact(b.value)}`}</text>
              <text x={x + w / 2} y={H - 16} fontSize={10} textAnchor="middle" fill="var(--fg-muted)">{b.label}</text>
            </g>
          );
        })}
        <line x1={0} x2={W} y1={bottom} y2={bottom} stroke="var(--chart-grid)" />
      </svg>
    </ChartFrame>
  );
}
