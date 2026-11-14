import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Dark pill: tiny mono tag + text + chevron (marketing hero). */
export function AnnouncementPill({ tag = "NEW", children, href }: { tag?: string; children: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="ring-inner inline-flex h-8 items-center gap-2 rounded-full bg-canvas-deep/60 py-1 pl-1 pr-3 text-small text-fg-body backdrop-blur transition-colors hover:text-fg">
      <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-label tracking-[0.04em]">{tag}</span>
      {children}
      <ChevronRight aria-hidden className="size-4 text-fg-muted" />
    </Link>
  );
}
