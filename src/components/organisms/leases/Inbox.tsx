"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { Textarea } from "@/components/atoms/Textarea";
import { Banner } from "@/components/molecules/Banner";
import { KeyValue } from "@/components/molecules/StatCard";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Sheet } from "@/components/organisms/Modal";
import { StateView } from "@/components/organisms/StateView";
import { toast } from "@/components/organisms/Toaster";
import { decideLease, decideSetup } from "@/lib/actions/leases";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";
import { money } from "@/lib/format";
type InboxItem = import("@/server/dal/leases").LeaseBook["inbox"][number];

const ICON: Record<InboxItem["type"], IconName> = { lease: "file", setup: "settings", event: "refresh", journal: "journal" };

/** LC-01 approvals inbox + decision drawer. Segregation of duties: you can't approve what you submitted. */
export function InboxLive() {
  const b = useLeaseData();
  return <Inbox waiting={b.inbox} mine={b.mySubmissions} me={b.me} />;
}

export function Inbox({ waiting, mine, me }: { waiting: InboxItem[]; mine: InboxItem[]; me: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [tab, setTab] = useState("waiting");
  const [items, setItems] = useState(waiting);
  const [done, setDone] = useState<InboxItem[]>([]);
  const [open, setOpen] = useState<InboxItem | null>(null);
  const [comment, setComment] = useState("");
  const list = tab === "waiting" ? items : tab === "mine" ? mine : done;
  const decide = (approve: boolean) => start(async () => {
    if (!open) return;
    if (open.type === "journal") { toast.info("Approve and post journal batches from Journals."); return; }
    const r = open.type === "setup" ? await decideSetup(open.kind as "policies" | "curves" | "gl", open.version!, approve, comment)
      : await decideLease(open.leaseId!, open.rev!, approve, comment);
    if (!r.ok) { toast.error(r.error); return; }
    setItems((x) => x.filter((i) => i.id !== open.id)); setDone((d) => [open, ...d]);
    toast.success(approve ? `${open.title.split(" · ").at(-1)} approved` : `Returned to ${open.by}`);
    setOpen(null); setComment(""); router.refresh();
  });
  const self = open?.byId === me;
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup label="Inbox" value={tab} onChange={setTab} options={[{ value: "waiting", label: "Waiting for me", count: items.length }, { value: "mine", label: "Submitted by me", count: mine.length }, { value: "done", label: "Done", count: done.length }]} />
      {list.length === 0 ? <StateView icon="check-circle" title="You're all caught up" description="New items appear here when someone submits them." /> : (
        <ul className="divide-y divide-line rounded-panel border border-line">
          {list.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-surface text-fg-muted"><Icon name={ICON[i.type]} /></span>
              <span className="min-w-0 flex-1"><span className="block text-small text-fg">{i.title}</span><span className="block text-micro text-fg-muted">{i.meta}</span></span>
              {i.due && <Badge tone="warning">Due today</Badge>}
              <span className="w-12 text-right font-mono text-micro text-fg-muted">{i.age}</span>
              {tab === "mine" ? <Button asChild size="sm" variant="secondary"><Link href={`/leases/register/${i.lease}/summary`}>Edit and resubmit</Link></Button> : tab === "waiting" && (i.type === "journal" ? <Button asChild size="sm"><Link href="/leases/journals">Open</Link></Button> : <Button size="sm" onClick={() => setOpen(i)}>Review</Button>)}
            </li>
          ))}
        </ul>
      )}
      {tab === "mine" && mine.filter((m) => m.returnComment).map((m) => <Banner key={m.id} tone="warning">{m.lease}: “{m.returnComment}”</Banner>)}
      <Sheet open={open !== null} onOpenChange={(v) => !v && setOpen(null)} width="w-[640px]" title={open ? `Approve ${open.title.toLowerCase()}` : ""}
        footer={<><Button variant="outline" loading={busy} disabled={comment.trim().length < 3} disabledReason={comment.trim().length < 3 ? "A comment is required to return" : undefined} onClick={() => decide(false)}>Return with comments</Button><Button loading={busy} disabled={self} disabledReason={self ? "You can't approve your own submission." : undefined} onClick={() => decide(true)}>Approve</Button></>}>
        {open && <div className="flex flex-col gap-5">
          {(open.type === "lease" || open.type === "event") && <><KeyValue columns={2} items={[["Lease", open.lease ?? "—"], ["Version", `v${open.version}`], ["Liability", open.liability != null ? money(open.liability) : "Not calculated"], ["ROU asset", open.rou != null ? money(open.rou) : "—"]]} />
            <Link href={`/leases/register/${open.lease}/schedule`} className="text-small text-link hover:underline">Open the full schedule →</Link></>}
          <p className="text-small text-fg-body">{open.meta}</p>
          <ul className="flex flex-col gap-1.5"><li className="flex items-center gap-2 text-small text-fg-body"><CheckCircle2 className="size-4 text-positive" />Calculated by the engine; checks run on approval</li></ul>
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Comments (required if returning)<Textarea value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} /></label>
          <p className="flex items-start gap-2 text-micro text-fg-muted"><Info className="mt-0.5 size-3.5" />{self ? "You submitted this item, so you can't approve it." : "Segregation of duties: you did not prepare this item."}</p>
        </div>}
      </Sheet>
    </div>
  );
}
