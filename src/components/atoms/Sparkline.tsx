/** Tiny trend line with soft area fill (stat cards). Decorative: pair with the number it summarises. */
export function Sparkline({ values, color = "var(--chart-1)", className = "h-8 w-24" }: { values: number[]; color?: string; className?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), span = Math.max(...values) - min || 1;
  const line = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`).join(" ");
  return (
    <svg aria-hidden viewBox="0 0 100 30" preserveAspectRatio="none" className={className}>
      <polygon points={`0,30 ${line} 100,30`} fill={color} opacity={0.15} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
