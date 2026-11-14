import type { ReactNode } from "react";
import { Tooltip } from "@/components/molecules/Overlays";

/** Shows the first `max` items then "+n" with the rest in a tooltip. */
export function TruncatedList({ items, max = 2, renderItem }: { items: string[]; max?: number; renderItem: (s: string) => ReactNode }) {
  const rest = items.slice(max);
  return (
    <span className="inline-flex items-center gap-1">
      {items.slice(0, max).map((s) => <span key={s}>{renderItem(s)}</span>)}
      {rest.length > 0 && (
        <Tooltip content={rest.join(", ")}>
          <button type="button" className="inline-flex h-5 items-center rounded-full bg-neutral-tint px-2 text-micro text-fg-muted">+{rest.length}</button>
        </Tooltip>
      )}
    </span>
  );
}
