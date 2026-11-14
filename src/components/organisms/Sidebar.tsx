"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronDown, Lock, PanelLeftClose } from "lucide-react";
import * as RPopover from "@radix-ui/react-popover";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { Badge } from "@/components/atoms/Badge";
import { Logo } from "@/components/atoms/Logo";
import { Tooltip, floatingPanel } from "@/components/molecules/Overlays";
import { ProgressBar } from "@/components/molecules/Progress";
import { WorkspaceSwitcher } from "@/components/organisms/WorkspaceSwitcher";
import { UserMenu } from "@/components/organisms/UserMenu";
import { cn } from "@/lib/cn";
import { isActive } from "@/lib/nav";
import type { NavItem } from "@/types/ui";
import type { ServiceState, Workspace } from "@/types/domain";

export interface SidebarProps {
  nav: NavItem[];
  footer?: NavItem[];
  workspace?: Workspace;
  workspaces?: Workspace[];
  /** role label per workspace id, shown in the switcher */
  roles?: Record<string, string>;
  user: { name: string; initials: string; role: string; image?: string };
  /** service state per top-level href, e.g. { "/ecl": "active", "/leases": "trial" } */
  states?: Record<string, ServiceState>;
  /** replaces the workspace switcher (platform console) */
  header?: ReactNode;
  /** trial/quota meter shown above the user row */
  usage?: { label: string; used: number; limit: number; note?: string; href?: string };
  onNavigate?: () => void;
  /** "auto" = user-toggled (remembered); "rail" = always collapsed (tablet); "full" = always expanded (mobile drawer) */
  mode?: "auto" | "rail" | "full";
}

// Remembered collapse preference (shared by every sidebar instance).
const KEY = "ll_sidebar_collapsed";
const subs = new Set<() => void>();
const getCollapsed = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
const setCollapsedPref = (v: boolean) => { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch {} subs.forEach((f) => f()); };

const dot: Partial<Record<ServiceState, string>> = { active: "bg-svc-ecl", trial: "bg-svc-leases", suspended: "bg-negative", "trial-expired": "bg-fg-muted", expired: "bg-fg-muted", requested: "bg-accent" };
const row = "flex h-9 items-center gap-3 rounded-full px-3 text-[15px] transition-colors duration-fast";

/** Collapsed-rail group: icon + glass flyout of its pages on hover or click (SH2). */
function RailGroup({ n, active, stateDot, onNavigate, path }: { n: NavItem; active: boolean; stateDot?: string; onNavigate?: () => void; path: string }) {
  const [open, setOpen] = useState(false);
  return (
    <RPopover.Root open={open} onOpenChange={setOpen}>
      <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <RPopover.Trigger aria-label={n.label} className={cn("relative mx-auto flex size-10 items-center justify-center rounded-card transition-colors", active ? "bg-surface text-fg" : "text-fg-muted hover:text-fg")}>
          {n.icon && <Icon name={n.icon as IconName} />}
          {stateDot && <span aria-hidden className={cn("absolute right-1.5 top-1.5 size-1.5 rounded-full", stateDot)} />}
        </RPopover.Trigger>
        <RPopover.Portal>
          <RPopover.Content side="right" align="start" sideOffset={8} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} className={cn(floatingPanel, "w-52 p-1.5")}>
            <p className="label-mono px-2 pb-1 pt-1.5">{n.label}</p>
            {n.children?.map((c) => (
              <Link key={c.href} href={c.href} onClick={() => { setOpen(false); onNavigate?.(); }} aria-current={path === c.href ? "page" : undefined} className={cn("flex h-8 items-center rounded-md px-2 text-small", path === c.href ? "bg-surface text-fg" : "text-fg-body hover:bg-surface")}>{c.label}</Link>
            ))}
          </RPopover.Content>
        </RPopover.Portal>
      </div>
    </RPopover.Root>
  );
}

/** App sidebar (DS7.1/7.2, SH1/SH2): groups with guide line, active pill, service dots, Trial/Soon, collapse rail with flyouts, usage meter. */
export function Sidebar({ nav, footer = [], workspace, workspaces = [], roles, user, states = {}, header, usage, onNavigate, mode = "auto" }: SidebarProps) {
  const path = usePathname();
  const pref = useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), getCollapsed, () => false);
  const collapsed = mode === "rail" || (mode === "auto" && pref);
  const inGroup = (n: NavItem) => Boolean(n.children?.some((c) => path === c.href || isActive(path, c.href)));
  const [open, setOpen] = useState<string | undefined>(nav.find(inGroup)?.href);

  const status = (href: string) => {
    const s = states[href];
    return s === "trial" ? <Badge tone="warning">Trial</Badge> : s && dot[s] ? <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot[s])} /> : null;
  };

  const leaf = (n: NavItem, child = false) => {
    const on = path === n.href || (!n.children && isActive(path, n.href));
    const soon = n.badge === "Soon" || states[n.href] === "coming-soon" || states[n.href] === "locked";
    if (collapsed && !child) {
      return (
        <Tooltip key={n.href} content={`${n.label}${soon ? " · Soon" : ""}`} side="right">
          <Link href={n.href} onClick={onNavigate} aria-label={n.label} aria-current={on ? "page" : undefined} className={cn("relative mx-auto flex size-10 items-center justify-center rounded-card transition-colors", on ? "bg-surface text-fg" : "text-fg-muted hover:text-fg", soon && "opacity-60")}>
            {n.icon && <Icon name={n.icon as IconName} />}
            {soon && <Lock aria-hidden className="absolute bottom-1 right-1 size-2.5" />}
          </Link>
        </Tooltip>
      );
    }
    return (
      <Link key={n.href} href={n.href} onClick={onNavigate} aria-current={on ? "page" : undefined} className={cn(row, on ? "bg-surface text-fg" : "text-fg-muted hover:text-fg", soon && "opacity-60")}>
        {!child && n.icon && <Icon name={n.icon as IconName} />}
        <span className="flex-1 truncate">{n.label}</span>
        {status(n.href)}
        {soon && (<><Lock aria-hidden className="size-3.5" /><Badge>Soon</Badge></>)}
        {n.badge && n.badge !== "Soon" && <Badge className="text-fg-body">{n.badge}</Badge>}
      </Link>
    );
  };

  return (
    <aside aria-label="Sidebar" className={cn("flex h-full shrink-0 flex-col border-r border-line bg-sidebar transition-[width] duration-base", collapsed ? "w-sidebar-collapsed" : "w-sidebar")}>
      <div className={cn("flex h-topbar shrink-0 items-center gap-1 px-3", collapsed && "justify-center px-0")}>
        {collapsed ? <Link href="/home" aria-label="Home"><Logo wordmark={false} /></Link> : header ?? (workspace && <WorkspaceSwitcher current={workspace} workspaces={workspaces} roles={roles} staff />)}
        {mode === "auto" && !collapsed && (
          <button type="button" aria-label="Collapse sidebar" title="Collapse sidebar" onClick={() => setCollapsedPref(true)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg">
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>
      <nav aria-label="Main" className={cn("flex flex-1 flex-col gap-0.5 overflow-y-auto py-2", collapsed ? "px-2" : "px-3")}>
        {nav.map((n) => {
          if (!n.children) return <div key={n.href}>{leaf(n)}</div>;
          if (collapsed) return <RailGroup key={n.href} n={n} path={path} active={inGroup(n)} stateDot={dot[states[n.href]]} onNavigate={onNavigate} />;
          return (
            <div key={n.href}>
              <button type="button" aria-expanded={open === n.href} onClick={() => setOpen(open === n.href ? undefined : n.href)} className={cn(row, "w-full", inGroup(n) ? "text-fg" : "text-fg-muted hover:text-fg")}>
                {n.icon && <Icon name={n.icon as IconName} />}
                <span className="flex-1 truncate text-left">{n.label}</span>
                {status(n.href)}
                <ChevronDown aria-hidden className={cn("size-3.5 transition-transform duration-base", open === n.href && "rotate-180")} />
              </button>
              {open === n.href && <div className="ml-5 flex flex-col gap-0.5 border-l border-line py-1 pl-3 animate-fade-in">{n.children.map((c) => <div key={c.href}>{leaf(c, true)}</div>)}</div>}
            </div>
          );
        })}
        {footer.length > 0 && <div className="my-2 h-px bg-line" />}
        {footer.map((n) => <div key={n.href}>{leaf(n)}</div>)}
      </nav>
      {usage && !collapsed && (
        <Link href={usage.href ?? "/admin/services"} className="mx-3 mb-2 flex flex-col gap-2 rounded-card border border-line p-3 text-micro transition-colors hover:border-line-strong">
          <span className="flex justify-between text-fg-body"><span>{usage.label}</span><span className="font-mono tabular-nums text-fg-muted">{usage.used} / {usage.limit}</span></span>
          <ProgressBar value={usage.used} max={usage.limit} label={usage.label} />
          {usage.note && <span className="text-fg-muted">{usage.note}</span>}
        </Link>
      )}
      <div className={cn("border-t border-line p-2", collapsed && "flex flex-col items-center gap-1")}>
        {mode === "auto" && collapsed && (
          <button type="button" aria-label="Expand sidebar" title="Expand sidebar" onClick={() => setCollapsedPref(false)} className="inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg">
            <PanelLeftClose className="size-4 rotate-180" />
          </button>
        )}
        <UserMenu {...user} collapsed={collapsed} />
      </div>
    </aside>
  );
}
