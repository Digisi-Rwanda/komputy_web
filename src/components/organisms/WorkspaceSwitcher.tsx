"use client";
import Link from "next/link";
import { Command } from "cmdk";
import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { Popover } from "@/components/molecules/Overlays";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { useRouter } from "next/navigation";
import { switchWorkspace } from "@/lib/actions/workspace";
import { toast } from "@/components/organisms/Toaster";
import { service } from "@/lib/services";
import type { Workspace } from "@/types/domain";

const ROLES: Record<string, string> = { "ws-kivu": "Administrator", "ws-lakeshore": "Analyst", "ws-northgate": "Reviewer" };

/** SH3 / DS7.3: search, role + service chips per workspace, switch without re-login, create, settings, staff console, key hints. */
export function WorkspaceSwitcher({ current, workspaces, roles = ROLES, staff }: { current: Workspace; workspaces: Workspace[]; roles?: Record<string, string>; staff?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pick = async (w: Workspace) => {
    setOpen(false);
    if (w.id === current.id) return;
    const r = await switchWorkspace(w.id);
    if (!r.ok) { toast.error(`Couldn't open ${w.name}`, { description: "You may no longer be a member." }); return; }
    toast.success(`Switched to ${w.name}`, { description: "No new sign in needed." });
    router.push("/home");
    router.refresh();
  };
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="w-[340px] p-0"
      trigger={
        <button type="button" aria-label={`Workspace: ${current.name}. Switch workspace`} className="flex min-w-0 flex-1 items-center gap-2 rounded-full py-1 pl-1 pr-2 text-small text-fg transition-colors hover:bg-surface data-[state=open]:bg-surface">
          <Avatar initials={current.initial} src={current.logo} size="sm" square className="bg-accent text-fg-inverse" />
          <span className="flex-1 truncate text-left">{current.name}</span>
          <ChevronsUpDown aria-hidden className="size-3.5 shrink-0 text-fg-muted" />
        </button>
      }
    >
      <Command loop>
        <Command.Input placeholder="Find workspace" className="h-10 w-full border-b border-line bg-transparent px-3 text-small text-fg outline-none placeholder:text-fg-subtle" />
        <Command.List className="max-h-72 overflow-y-auto p-1">
          <Command.Empty className="p-4 text-center text-small text-fg-muted">No workspace found</Command.Empty>
          <Command.Group heading="Your workspaces" className="[&_[cmdk-group-heading]]:label-mono [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            {workspaces.map((w) => (
              <Command.Item key={w.id} value={w.name} onSelect={() => pick(w)} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 data-[selected=true]:bg-surface">
                <Avatar initials={w.initial} src={w.logo} size="sm" square className={w.id === current.id ? "bg-accent text-fg-inverse" : undefined} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small text-fg">{w.name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1">
                    {roles[w.id] && <span className="mr-1 text-micro text-fg-muted">{roles[w.id]}</span>}
                    {w.entitlements.filter((e) => e.state === "active" || e.state === "trial").map((e) => (
                      <Badge key={e.service} tone={e.state === "trial" ? "warning" : "positive"}>{service(e.service).short}{e.state === "trial" && " · Trial"}</Badge>
                    ))}
                  </span>
                </span>
                {w.id === current.id && <Check aria-label="Current workspace" className="size-4 text-fg" />}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
      <div className="border-t border-line p-1">
        <Link href="/new-workspace" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-small text-fg-muted hover:bg-surface hover:text-fg"><Plus className="size-4" />Create workspace</Link>
        <Link href="/admin/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2 text-small text-fg-muted hover:bg-surface hover:text-fg"><Settings className="size-4" />Workspace settings</Link>
        {staff && <Link href="/platform" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-md px-2 py-2 text-small text-fg-muted hover:bg-surface hover:text-fg">Platform console <Badge mono>Staff</Badge></Link>}
      </div>
      <p className="border-t border-line px-3 py-2 text-micro text-fg-muted">↑↓ to move · ↵ to switch</p>
    </Popover>
  );
}
