"use client";
import { useRouter } from "next/navigation";
import { leaveWorkspace, switchWorkspace } from "@/lib/actions/workspace";
import { useState } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Tooltip } from "@/components/molecules/Overlays";
import { ConfirmDialog } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";

export interface MyWorkspace { id: string; name: string; role: string; services: string; initial: string; current: boolean }

/** NA5.2 my workspaces: switch, leave (owner can't leave). */
export function MyWorkspaces({ items }: { items: MyWorkspace[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  return (
    <ul className="grid max-w-3xl gap-3">{list.map((w) => (
      <li key={w.id} className="flex flex-wrap items-center gap-4 rounded-panel border border-line p-4">
        <Avatar initials={w.initial} square size="lg" />
        <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-small text-fg">{w.name}{w.current && <StatusPill tone="info">Current</StatusPill>}</span><span className="block text-micro text-fg-muted">{w.role} · {w.services}</span></span>
        {!w.current && <Button size="sm" variant="secondary" onClick={async () => { const r = await switchWorkspace(w.id); if (!r.ok) { toast.error(`Couldn't open ${w.name}`); return; } toast.success(`Switched to ${w.name}`, { description: "No new sign in needed." }); router.push("/home"); router.refresh(); }}>Switch</Button>}
        {w.role === "Owner" ? <Tooltip content="Owners can't leave. Transfer ownership first (Admin → Danger zone)."><span><Button size="sm" variant="ghost" disabled>Leave workspace</Button></span></Tooltip>
          : <ConfirmDialog title={`Leave ${w.name}?`} description="You lose access straight away. An administrator can invite you again." confirmLabel="Leave workspace" onConfirm={async () => { const r = await leaveWorkspace(w.id); if (!r.ok) { toast.error(r.error); return; } setList((l) => l.filter((x) => x.id !== w.id)); toast(`You left ${w.name}`); router.refresh(); }} trigger={<Button size="sm" variant="ghost">Leave workspace</Button>} />}
      </li>))}
    </ul>
  );
}
