"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/atoms/Logo";
import { Button } from "@/components/atoms/Button";
import { ServiceStatePill } from "@/components/atoms/StatusPill";
import { Popover } from "@/components/molecules/Overlays";
import { SERVICES } from "@/lib/services";
import { MARKETING_NAV } from "@/lib/nav";

const link = "text-[15px] text-fg-muted transition-colors hover:text-fg";

function ServicesMenu() {
  return (
    <div className="grid w-[720px] max-w-[calc(100vw-2rem)] gap-1 p-2 md:grid-cols-[1fr_200px]">
      <div className="grid gap-1 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <Link key={s.id} href={`/services/${s.id}`} className={`flex flex-col gap-1.5 rounded-card p-3 transition-colors hover:bg-surface ${s.live ? "" : "opacity-60"}`}>
            <span className="flex items-center gap-2 text-small text-fg">{s.name}<ServiceStatePill state={s.live ? "active" : "coming-soon"} /></span>
            <span className="text-micro text-fg-muted">{s.description}</span>
          </Link>
        ))}
      </div>
      <Link href="/contact" className="bg-blueprint flex flex-col justify-end gap-2 rounded-card border border-line p-4 text-small text-fg">
        Not sure which service?
        <span className="text-link">Talk to sales →</span>
      </Link>
    </div>
  );
}

/** Glass marketing nav (DS7.9) with Services mega-menu and full-screen mobile menu. */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="glass sticky top-0 z-[var(--z-sticky)] border-b border-line">
      <div className="mx-auto flex h-marketing-bar max-w-site items-center gap-8 px-4 lg:px-6">
        <Link href="/" aria-label="Ledgerline home"><Logo /></Link>
        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-8 md:flex">
          <Popover align="center" trigger={<button type="button" className={`${link} inline-flex items-center gap-1 data-[state=open]:text-fg`}>Services <ChevronDown className="size-3.5" /></button>}>
            <ServicesMenu />
          </Popover>
          {MARKETING_NAV.filter((n) => n.label !== "Services").map((n) => <Link key={n.href} href={n.href} className={link}>{n.label}</Link>)}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm"><Link href="/sign-in">Sign in</Link></Button>
          <Button asChild size="sm"><Link href="/sign-up">Start free trial</Link></Button>
        </div>
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="ml-auto inline-flex size-10 items-center justify-center rounded-full text-fg md:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Mobile" className="glass fixed inset-x-0 bottom-0 top-marketing-bar flex flex-col gap-1 overflow-y-auto p-4 md:hidden animate-fade-in">
          {SERVICES.filter((s) => s.live).map((s) => <Link key={s.id} href={`/services/${s.id}`} onClick={() => setOpen(false)} className="rounded-card px-3 py-3 text-h4 text-fg hover:bg-surface">{s.name}</Link>)}
          {MARKETING_NAV.filter((n) => n.label !== "Services").map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-card px-3 py-3 text-h4 text-fg hover:bg-surface">{n.label}</Link>)}
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Button asChild size="lg"><Link href="/sign-up">Start free trial</Link></Button>
            <Button asChild variant="secondary" size="lg"><Link href="/sign-in">Sign in</Link></Button>
          </div>
        </nav>
      )}
    </header>
  );
}
