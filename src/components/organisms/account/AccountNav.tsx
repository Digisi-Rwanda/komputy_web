import Link from "next/link";
import { cn } from "@/lib/cn";
import { TABS } from "@/lib/nav";

export const ACCOUNT_LABEL: Record<(typeof TABS.account)[number], string> = { profile: "Profile", security: "Security", notifications: "Notifications", appearance: "Appearance", workspaces: "My workspaces" };

/** Left sub-nav for the account area (horizontal scroll on phones). */
export function AccountNav({ tab }: { tab: string }) {
  return (
    <nav aria-label="Account" className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
      {TABS.account.map((t) => <Link key={t} href={`/account/${t}`} aria-current={t === tab ? "page" : undefined} className={cn("shrink-0 rounded-full px-4 py-2 text-small", t === tab ? "bg-surface-active text-fg" : "text-fg-muted hover:bg-surface hover:text-fg")}>{ACCOUNT_LABEL[t]}</Link>)}
    </nav>
  );
}
