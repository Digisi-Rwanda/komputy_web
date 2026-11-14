"use client";
import Link from "next/link";
import { ChevronDown, Check, Lock } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { IconButton } from "@/components/atoms/IconButton";
import { Icon } from "@/components/atoms/Icon";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { ProgressCircle } from "@/components/molecules/Progress";
import { cn } from "@/lib/cn";
import type { ServiceState } from "@/types/domain";
import { GROUPS } from "@/data/checklist";
import { markDone, seedOnboarding, update, useOnboarding } from "@/hooks/useOnboarding";

/** O2 setup checklist: progress ring, collapsible groups, next item highlighted, locked services, hide/reopen. */
export function Checklist({ workspace, states, progress }: { workspace: string; states: Partial<Record<string, ServiceState>>; progress: { done: string[]; dismissed: boolean } }) {
  seedOnboarding(progress);
  const s = useOnboarding();
  const usable = (st?: ServiceState) => st === "active" || st === "trial";
  const groups = GROUPS.filter((g) => !g.service || usable(states[g.service]));
  const tasks = groups.flatMap((g) => g.tasks);
  const done = tasks.filter((t) => s.done.includes(t.id)).length;
  const nextId = tasks.find((t) => !s.done.includes(t.id))?.id;
  const locked = GROUPS.filter((g) => g.service && !usable(states[g.service]));

  if (s.dismissed) return (
    <p className="text-small text-fg-muted">Setup checklist hidden · <button type="button" onClick={() => update({ dismissed: false })} className="text-link hover:underline">Show it again</button></p>
  );
  if (done === tasks.length) return (
    <section className="flex items-center gap-4 rounded-panel border border-positive/40 bg-positive-tint p-5">
      <Icon name="check-circle" size={24} className="text-positive" />
      <p className="flex-1 text-small text-fg">{workspace} is set up. Nice work.</p>
      <Button variant="ghost" size="sm" onClick={() => update({ dismissed: true })}>Hide</Button>
    </section>
  );

  return (
    <section aria-labelledby="setup-title" className="rounded-panel border border-line">
      <header className="flex items-center gap-4 border-b border-line p-5">
        <ProgressCircle value={done} max={tasks.length} size={52} label="Setup progress"><span className="font-mono text-micro text-fg">{done}/{tasks.length}</span></ProgressCircle>
        <div className="flex-1"><h2 id="setup-title" className="text-h4">Set up {workspace}</h2><p className="text-micro text-fg-muted">{tasks.length - done} steps left · about 10 minutes</p></div>
        <DropdownMenu trigger={<IconButton label="Checklist options" size="sm"><Icon name="more" /></IconButton>} items={[{ label: "Hide checklist", onSelect: () => update({ dismissed: true }) }]} />
      </header>
      {groups.map((g) => {
        const open = !s.collapsed.includes(g.id);
        const gDone = g.tasks.filter((t) => s.done.includes(t.id)).length;
        const st = g.service && states[g.service];
        return (
          <div key={g.id} className="border-b border-line last:border-0">
            <button type="button" aria-expanded={open} onClick={() => update((x) => ({ collapsed: open ? [...x.collapsed, g.id] : x.collapsed.filter((c) => c !== g.id) }))} className="flex w-full items-center gap-3 px-5 py-3 text-left text-small text-fg">
              <span className="flex-1">{g.title}{st === "trial" && <Badge tone="warning" className="ml-2">Trial</Badge>}</span>
              <span className="font-mono text-micro text-fg-muted">{gDone}/{g.tasks.length}</span>
              <ChevronDown aria-hidden className={cn("size-4 text-fg-muted transition-transform", open && "rotate-180")} />
            </button>
            {open && (
              <ul className="flex flex-col gap-1 px-3 pb-3">
                {g.tasks.map((t) => {
                  const isDone = s.done.includes(t.id), isNext = t.id === nextId;
                  return (
                    <li key={t.id} className={cn("flex flex-wrap items-center gap-3 rounded-card px-3 py-2.5", isNext && "ring-1 ring-fg")}>
                      <button type="button" role="checkbox" aria-checked={isDone} aria-label={`Mark "${t.label}" ${isDone ? "not done" : "done"}`} onClick={() => update((x) => ({ done: isDone ? x.done.filter((d) => d !== t.id) : [...x.done, t.id] }))}
                        className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full border", isDone ? "border-positive bg-positive text-fg-inverse" : "border-line-strong")}>
                        {isDone && <Check className="size-3" strokeWidth={3} />}
                      </button>
                      <span className={cn("min-w-0 flex-1 text-small", isDone ? "text-fg-muted line-through" : "text-fg-body")}>
                        {t.label}{t.hint && <span className="text-fg-muted"> — {t.hint}</span>}
                        {isNext && <Badge tone="inverse" className="ml-2">Next</Badge>}
                      </span>
                      {!isDone && <Button asChild size="sm" variant={t.action.primary ? "primary" : "secondary"}><Link href={t.action.href} onClick={() => !t.action.primary && markDone(t.id)}>{t.action.label}</Link></Button>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      {locked.map((g) => (
        <div key={g.id} className="flex items-center gap-3 border-t border-line px-5 py-3 text-small text-fg-muted">
          <Lock aria-hidden className="size-4" /><span className="flex-1">{g.title} · Not active</span>
          <Link href="/admin/services" className="text-link hover:underline">Start trial</Link>
        </div>
      ))}
    </section>
  );
}
