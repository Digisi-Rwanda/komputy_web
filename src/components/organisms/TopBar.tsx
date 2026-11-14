"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { CircleHelp, Search } from "lucide-react";
import { NotificationBell } from "@/components/organisms/account/NotificationBell";
import { SearchPill } from "@/components/molecules/SearchPill";
import { Breadcrumb } from "@/components/molecules/Breadcrumb";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { Avatar } from "@/components/atoms/Avatar";
import { CommandPalette } from "@/components/organisms/CommandPalette";
import { accountItems } from "@/components/organisms/UserMenu";
import { useHotkey } from "@/hooks/useHotkey";
import { crumbsFor } from "@/lib/nav";

const iconLink = "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface hover:text-fg";

/** Glass top bar (DS7.7, SH1): menu slot, breadcrumb, ⌘K search, help, notifications, avatar menu. */
export function TopBar({ initials, image, notifications, menu }: { initials: string; image?: string; notifications: boolean; menu?: ReactNode }) {
  const [palette, setPalette] = useState(false);
  const path = usePathname();
  const crumbs = crumbsFor(path);
  useHotkey("k", useCallback(() => setPalette(true), []));
  return (
    <header className="glass sticky top-0 z-[var(--z-sticky)] flex h-topbar shrink-0 items-center gap-2 border-b border-line px-3 lg:px-6">
      {menu}
      <div className="hidden min-w-0 flex-1 md:block">{crumbs.length > 0 && <Breadcrumb items={crumbs} />}</div>
      <p className="min-w-0 flex-1 truncate text-small text-fg md:hidden">{crumbs.at(-1)?.label}</p>
      <div className="hidden w-full max-w-sm sm:block"><SearchPill onClick={() => setPalette(true)} /></div>
      <div className="flex flex-1 items-center justify-end gap-1">
        <button type="button" aria-label="Search" onClick={() => setPalette(true)} className={`${iconLink} sm:hidden`}><Search className="size-4" /></button>
        <Link href="/help" aria-label="Help" className={`${iconLink} hidden sm:inline-flex`}><CircleHelp className="size-4" /></Link>
        {notifications && <NotificationBell className={iconLink} />}
        <DropdownMenu align="end" items={accountItems()} trigger={<button type="button" aria-label="Account menu" className="ml-1 rounded-full"><Avatar initials={initials} src={image} /></button>} />
      </div>
      <CommandPalette open={palette} onOpenChange={setPalette} />
    </header>
  );
}
