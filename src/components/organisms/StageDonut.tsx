import type { ReactNode } from "react";
import { ChartFrame } from "@/components/molecules/ChartFrame";

/** Donut of IFRS 9 stage shares (0-1) with centre label. */
export function StageDonut({ shares, center, size = 160, title = "Exposure by stage" }: { shares: [number, number, number]; center?: ReactNode; size?: number; title?: string }) {
  const r = 40, c = 2 * Math.PI * r, gap = 1.5;
  const starts = shares.map((_, i) => shares.slice(0, i).reduce((a, b) => a + b, 0) * c);
  return (
    <ChartFrame title={title} table={{ head: ["Stage", "Share"], rows: shares.map((s, i) => [`Stage ${i + 1}`, `${(s * 100).toFixed(1)} %`]) }}>
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg aria-hidden viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx={50} cy={50} r={r} fill="none" stroke="var(--surface)" strokeWidth={10} />
          {shares.map((s, i) => {
            const len = Math.max(0, s * c - gap);
            return <circle key={i} cx={50} cy={50} r={r} fill="none" stroke={`var(--stage-${i + 1})`} strokeWidth={10} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-starts[i]} />;
          })}
        </svg>
        {center && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>}
      </div>
    </ChartFrame>
  );
}
