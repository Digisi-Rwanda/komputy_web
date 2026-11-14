"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Sparkles, Wrench, TrendingUp } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { date } from "@/lib/format";
import type { Update, UpdateTag } from "@/data/updates";

function Visual({ kind }: { kind: Update["visual"] }) {
  return (
    <div aria-hidden className="bg-blueprint flex h-40 items-center justify-center rounded-card border border-line bg-raised">
      {kind === "checks" && <div className="grid grid-cols-4 gap-2">{Array.from({ length: 7 }, (_, i) => <span key={i} className="inline-flex size-8 items-center justify-center rounded-md bg-positive-tint text-positive"><Check className="size-4" /></span>)}</div>}
      {kind === "matrix" && <div className="grid grid-cols-4 gap-1">{Array.from({ length: 12 }, (_, i) => <span key={i} className="size-6 rounded-sm bg-accent" style={{ opacity: [1, 0.3, 0.2, 0.15, 0.4, 0.9, 0.3, 0.2, 0.15, 0.25, 0.85, 0.2][i] }} />)}</div>}
      {kind === "calendar" && <div className="grid grid-cols-7 gap-1.5">{Array.from({ length: 28 }, (_, i) => <span key={i} className={i === 24 ? "size-4 rounded-sm bg-accent" : "size-4 rounded-sm bg-surface-active"} />)}</div>}
      {kind === "launch" && <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <span key={i} className="h-3 w-24 rounded-full bg-accent" style={{ marginLeft: i === 1 ? 24 : 0, opacity: 1 - i * 0.3 }} />)}</div>}
    </div>
  );
}

const List = ({ icon: I, title, items }: { icon: typeof Check; title: string; items: string[] }) =>
  items.length ? <div><p className="flex items-center gap-1.5 text-small text-fg"><I aria-hidden className="size-4 text-fg-muted" />{title}</p><ul className="mt-1 list-disc pl-6 text-small text-fg-muted">{items.map((x) => <li key={x}>{x}</li>)}</ul></div> : null;

/** P9 timeline with service filter kept in the URL (?tag=ECL). */
export function UpdatesTimeline({ updates }: { updates: Update[] }) {
  const router = useRouter();
  const tag = (useSearchParams().get("tag") ?? "All") as UpdateTag | "All";
  const list = tag === "All" ? updates : updates.filter((u) => u.tags.includes(tag));
  return (
    <div className="flex flex-col gap-10">
      <ToggleGroup label="Filter by service" value={tag} onChange={(v) => router.replace(v === "All" ? "/updates" : `/updates?tag=${v}`, { scroll: false })} options={["All", "ECL", "Leases", "Platform"].map((v) => ({ value: v, label: v }))} />
      <ol className="relative flex flex-col gap-12 border-l border-line pl-8">
        {list.map((u) => (
          <li key={u.id} id={u.id} className="relative grid scroll-mt-24 gap-6 md:grid-cols-[200px_1fr]">
            <span aria-hidden className="absolute -left-[37px] top-1.5 size-2.5 rounded-full bg-fg ring-4 ring-canvas" />
            <div className="flex flex-col gap-2">
              <h2 className="text-h4"><a href={`#${u.id}`} className="hover:underline">{u.version} — {u.title}</a></h2>
              <time dateTime={u.date} className="text-micro text-fg-muted">{date(u.date)}</time>
              <div className="flex flex-wrap gap-1">{u.tags.map((t) => <Badge key={t} tone="info">{t}</Badge>)}</div>
            </div>
            <div className="grid gap-5 rounded-panel border border-line p-5 lg:grid-cols-[1fr_1.2fr]">
              <Visual kind={u.visual} />
              <div className="flex flex-col gap-3">
                <List icon={Sparkles} title="What's new" items={u.new} />
                <List icon={TrendingUp} title="Improved" items={u.improved} />
                <List icon={Wrench} title="Fixed" items={u.fixed} />
                {u.note && <p className="font-mono text-micro text-fg-muted">{u.note}</p>}
              </div>
            </div>
          </li>
        ))}
        {!list.length && <li className="text-small text-fg-muted">No updates for {tag} yet.</li>}
      </ol>
    </div>
  );
}
