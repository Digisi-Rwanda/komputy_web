"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar, type SidebarProps } from "@/components/organisms/Sidebar";

/** Below lg: menu button opens the sidebar as a left drawer over a dimmed page; closes on navigation. */
export function MobileNav({ sidebar }: { sidebar: SidebarProps }) {
  const path = usePathname();
  // Open state is tied to the path it was opened on, so navigating closes it without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === path;
  const setOpen = (v: boolean) => setOpenedAt(v ? path : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <>
      <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg md:hidden">
        <Menu className="size-4" />
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Navigation" className="fixed inset-0 z-[var(--z-drawer)] flex md:hidden">
          <div className="animate-slide-in-left"><Sidebar {...sidebar} mode="full" onNavigate={() => setOpen(false)} /></div>
          <button type="button" aria-label="Close menu" className="flex-1 bg-scrim animate-fade-in" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
