"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Command, useCommandState } from "cmdk";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Kbd } from "@/components/atoms/Kbd";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { RunStatusPill } from "@/components/atoms/StatusPill";
import { useEffect, useState } from "react";
import { paletteData } from "@/lib/actions/palette";
import { switchWorkspace } from "@/lib/actions/workspace";
import { toggleTheme } from "@/components/organisms/ThemeToggle";
import { toast } from "@/components/organisms/Toaster";
import type { RunStatus } from "@/types/domain";

export interface CommandItem { group: string; label: string; href?: string; run?: () => void; icon?: IconName; status?: RunStatus; meta?: string }

type Data = NonNullable<Awaited<ReturnType<typeof paletteData>>>;
const PAGES: [string, string, IconName, keyof Data["can"] | null][] = [["Home", "/home", "home", null], ["ECL overview", "/ecl", "ecl", "ecl"], ["ECL runs", "/ecl/runs", "ecl", "ecl"], ["Lease register", "/leases/register", "leases", "leases"], ["Month-end close", "/leases/close", "calendar", "leases"], ["Workspace admin", "/admin/overview", "admin", "admin"], ["Members", "/admin/members", "users", "admin"], ["Audit log", "/admin/audit", "admin", "admin"], ["Notifications", "/notifications", "bell", null], ["Account settings", "/account/profile", "user", null], ["Security", "/account/security", "user", null], ["Platform console", "/platform", "admin", "staff"]];

/** Commands for what this person can do, their workspaces and (admins) people. Runs/leases join once the engine search exists (Phase 5). */
export function buildCommands(d: Data | null, switchTo: (id: string, name: string) => void): CommandItem[] {
  const ok = (k: keyof Data["can"] | null) => k === null || Boolean(d?.can[k]);
  return [
    ...(ok("ecl") ? [{ group: "Actions", label: "New ECL run", href: "/ecl/runs/new", icon: "plus" as IconName }] : []),
    ...(ok("leases") ? [{ group: "Actions", label: "New lease", href: "/leases/new", icon: "plus" as IconName }] : []),
    ...(ok("admin") ? [{ group: "Actions", label: "Invite member", href: "/admin/members?invite=1", icon: "users" as IconName }] : []),
    { group: "Actions", label: "Toggle theme", run: toggleTheme, icon: "eye" },
    ...PAGES.filter(([, , , k]) => ok(k)).map(([label, href, icon]) => ({ group: "Pages", label, href, icon })),
    ...(d?.people ?? []).map((m) => ({ group: "People", label: m.name, href: `/admin/members?q=${encodeURIComponent(m.email)}`, icon: "user" as IconName, meta: m.email })),
    ...(d?.workspaces ?? []).filter((w) => w.id !== d?.current).map((w) => ({ group: "Switch workspace", label: w.name, meta: w.role, run: () => switchTo(w.id, w.name), icon: "workspaces" as IconName })),
  ];
}

/** Label with the typed letters highlighted (SH4). */
function Highlight({ text }: { text: string }) {
  const q = useCommandState((s) => s.search).trim().toLowerCase();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="bg-transparent font-medium text-fg">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

/** ⌘K palette (SH4): actions, runs with status, leases, people, pages, workspaces, theme. ⌘↵ opens in a new tab. */
export function CommandPalette({ open, onOpenChange, commands: given }: { open: boolean; onOpenChange: (v: boolean) => void; commands?: CommandItem[] }) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => { if (open && !given) void paletteData().then(setData).catch(() => {}); }, [open, given]);
  const commands = given ?? buildCommands(data, async (id, name) => { const r = await switchWorkspace(id); if (!r.ok) { toast.error("Couldn't switch workspace."); return; } toast.success(`Switched to ${name}`); router.push("/home"); router.refresh(); });
  const groups = [...new Set(commands.map((c) => c.group))];
  const exec = (c: CommandItem, newTab: boolean) => {
    onOpenChange(false);
    if (c.run) return c.run();
    if (!c.href) return;
    if (newTab) window.open(c.href, "_blank", "noopener");
    else router.push(c.href);
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-scrim backdrop-blur-[20px] data-[state=open]:animate-fade-in" />
        <Dialog.Content className="glass ring-inner fixed left-1/2 top-[14vh] z-[var(--z-modal)] w-[640px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-panel border border-line outline-none data-[state=open]:animate-scale-in">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">Search runs, leases, people and pages, or run an action</Dialog.Description>
          <Command loop onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              const v = document.querySelector<HTMLElement>("[cmdk-item][data-selected=true]")?.dataset.value;
              const c = commands.find((x) => `${x.group} ${x.label}`.toLowerCase() === v?.toLowerCase());
              if (c) exec(c, true);
            }
          }}>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search aria-hidden className="size-4 text-fg-muted" />
              <Command.Input autoFocus placeholder="Type a command or search…" className="h-14 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-subtle" />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[50vh] overflow-y-auto p-2">
              <Command.Empty className="p-8 text-center text-small text-fg-muted">No results</Command.Empty>
              {groups.map((g) => (
                <Command.Group key={g} heading={g} className="[&_[cmdk-group-heading]]:label-mono [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3">
                  {commands.filter((c) => c.group === g).map((c) => (
                    <Command.Item key={c.group + c.label} value={`${c.group} ${c.label}`} onSelect={() => exec(c, false)} className="group flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-small text-fg-muted data-[selected=true]:bg-surface data-[selected=true]:text-fg-body">
                      {c.icon && <Icon name={c.icon} className="shrink-0" />}
                      <span className="flex-1 truncate"><Highlight text={c.label} />{c.meta && <span className="ml-2 text-micro text-fg-subtle">{c.meta}</span>}</span>
                      {c.status && <RunStatusPill status={c.status} />}
                      <span aria-hidden className="hidden text-fg-muted group-data-[selected=true]:inline">↵</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
          <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-micro text-fg-muted"><span>↑↓ navigate</span><span>↵ open</span><span>⌘↵ open in new tab</span><span>Esc close</span></p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
