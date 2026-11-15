"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { service } from "@/lib/services";
import { cn } from "@/lib/cn";
import { chooseWorkspace } from "@/lib/actions/auth";
import type { Workspace } from "@/types/domain";

export interface PickerItem { ws: Workspace; role: string; lastOpened: string; suspended?: boolean }

/** A5: searchable workspace cards (radio), service chips with state, remember choice. */
export function WorkspacePicker({ items, next = "/home" }: { items: PickerItem[]; next?: string }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(items[0]?.ws.id);
  const list = items.filter((i) => i.ws.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <form action={chooseWorkspace} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex h-control items-center gap-2 rounded-full bg-surface px-4 focus-within:ring-2 focus-within:ring-focus">
        <Search aria-hidden className="size-4 text-fg-muted" /><span className="sr-only">Find workspace</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find workspace" className="flex-1 bg-transparent text-small text-fg outline-none placeholder:text-fg-subtle" />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Workspaces</legend>
        {list.map(({ ws, role, lastOpened, suspended }) => (
          <label key={ws.id} className={cn("flex cursor-pointer items-center gap-4 rounded-card border p-4 transition-colors hover:bg-raised has-[:checked]:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus", sel === ws.id ? "border-accent" : "border-line", suspended && "opacity-60")}>
            <Avatar initials={ws.initial} size="lg" square />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 text-small text-fg">{ws.name}<Badge>{role}</Badge></span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-micro text-fg-muted">
                {suspended ? <Badge tone="negative">Suspended · read-only</Badge> : ws.entitlements.filter((e) => e.state !== "coming-soon").map((e) => (
                  <Badge key={e.service} tone={e.state === "active" ? "positive" : e.state === "trial" ? "warning" : "neutral"}>{service(e.service).short} · {e.state === "trial" ? "Trial" : e.state === "active" ? "Active" : "Not active"}</Badge>
                ))}
                <span>· {lastOpened}</span>
              </span>
            </span>
            <input type="radio" name="workspace" value={ws.id} checked={sel === ws.id} onChange={() => setSel(ws.id)} className="size-4 accent-accent" />
          </label>
        ))}
        {!list.length && <p className="py-6 text-center text-small text-fg-muted">No workspace matches “{q}”.</p>}
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox name="remember" label="Remember my choice" defaultChecked />
        <Button type="submit" size="lg" disabled={!sel}>Continue</Button>
      </div>
    </form>
  );
}
