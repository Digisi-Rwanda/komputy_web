"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Sticky in-page navigation with scroll-spy. Vertical list on desktop, select on small screens. */
export function SectionNav({ items, label = "On this page", numbered }: { items: { id: string; label: string }[]; label?: string; numbered?: boolean }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: "-90px 0px -60% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav aria-label={label} className="lg:sticky lg:top-24">
      <label className="flex flex-col gap-1.5 lg:hidden">
        <span className="label-mono">{label}</span>
        <select value={active} onChange={(e) => { setActive(e.target.value); document.getElementById(e.target.value)?.scrollIntoView({ behavior: "smooth" }); }} className="h-control rounded-input border border-line bg-surface px-3 text-small text-fg">
          {items.map((i, n) => <option key={i.id} value={i.id}>{numbered ? `${n + 1}. ` : ""}{i.label}</option>)}
        </select>
      </label>
      <div className="hidden lg:block">
        <p className="label-mono mb-3">{label}</p>
        <ol className="flex flex-col border-l border-line">
          {items.map((i, n) => (
            <li key={i.id}>
              <a href={`#${i.id}`} aria-current={active === i.id ? "location" : undefined} className={cn("-ml-px flex gap-2 border-l py-1.5 pl-4 text-small transition-colors", active === i.id ? "border-fg text-fg" : "border-transparent text-fg-muted hover:text-fg")}>
                {numbered && <span className="font-mono text-micro text-fg-subtle tabular-nums">{n + 1}</span>}
                {i.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
