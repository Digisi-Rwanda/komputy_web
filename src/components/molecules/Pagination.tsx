import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";

/** "1–10 of 31,204" + prev/next. Page is 1-based. */
export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1, to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-4 text-small text-fg-muted">
      <span className="tabular-nums">{from.toLocaleString("en-US")}–{to.toLocaleString("en-US")} of {total.toLocaleString("en-US")}</span>
      <div className="flex items-center gap-1">
        <IconButton label="Previous page" size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft /></IconButton>
        <span className="px-2 font-mono text-micro tabular-nums">{page} / {pages}</span>
        <IconButton label="Next page" size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight /></IconButton>
      </div>
    </div>
  );
}
