import { formatDistanceStrict } from "date-fns";
import { Tooltip } from "@/components/molecules/Overlays";
import { date } from "@/lib/format";

/** Relative time ("2 h ago") with exact UTC time on hover. `now` injectable for deterministic renders. */
export function Timestamp({ iso, now = new Date("2026-11-12T10:00:00Z") }: { iso: string; now?: Date }) {
  const d = new Date(iso);
  const exact = `${date(iso)} ${d.toISOString().slice(11, 16)} UTC`;
  return (
    <Tooltip content={exact}>
      <time dateTime={iso} className="text-micro text-fg-muted tabular-nums">{formatDistanceStrict(d, now, { addSuffix: true })}</time>
    </Tooltip>
  );
}
