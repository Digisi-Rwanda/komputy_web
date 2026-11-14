import Link from "next/link";

export interface Crumb { label: string; href?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-2 text-small text-fg-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span aria-hidden className="text-fg-subtle">/</span>}
              {c.href && !last ? (
                <Link href={c.href} className="truncate transition-colors hover:text-fg">{c.label}</Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate text-fg-body">{c.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
