"use client";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/lib/actions/platform";
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { FilterBar, type FilterValues } from "@/components/organisms/FilterBar";
import { Modal } from "@/components/organisms/Modal";
import { StateView } from "@/components/organisms/StateView";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import type { PWorkspace } from "@/types/domain";
import { day, SvcPill } from "@/components/organisms/platform/shared";

const NOW = "2026-11-11";
const soon = (w: PWorkspace) => Boolean(w.trialEnds && (Date.parse(w.trialEnds) - Date.parse(NOW)) / 864e5 <= 7);
const VIEWS: Record<string, (w: PWorkspace) => boolean> = { all: () => true, trials: (w) => w.services.some((s) => s[1] === "trial"), paying: (w) => w.paying, risk: (w) => w.inactiveDays > 30 || w.services.some((s) => s[1] === "suspended" || s[1] === "expired") || soon(w) };

/** PA2 workspaces list with saved views, filters and create. */
export function WorkspacesList({ rows }: { rows: PWorkspace[] }) {
  const router = useRouter();
  const [view, setView] = useState("all");
  const [q, setQ] = useState("");
  const [f, setF] = useState<FilterValues>({ ending: ["7"] });
  const all = rows;
  const list = all.filter((w) => VIEWS[view](w) && (w.name + w.owner + w.country).toLowerCase().includes(q.toLowerCase())
    && (!f.service?.length || w.services.some((s) => f.service.includes(s[0]))) && (!f.state?.length || w.services.some((s) => f.state.includes(s[1])))
    && (!f.ending?.length || soon(w)) && (!f.inactive?.length || w.inactiveDays > 30));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup label="Saved views" value={view} onChange={setView} options={[{ value: "all", label: "All" }, { value: "trials", label: "Trials" }, { value: "paying", label: "Paying" }, { value: "risk", label: "At risk" }]} />
        <span className="ml-auto"><CreateWorkspace onCreate={(id) => { setF({}); router.push(`/platform/workspaces/${id}/services`); }} /></span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-64"><span className="sr-only">Search workspaces</span><Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-fg-muted" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search workspaces" className="rounded-full pl-9" /></label>
        <FilterBar value={f} onChange={setF} filters={[{ key: "service", label: "Service", options: [{ value: "ECL", label: "ECL" }, { value: "Leases", label: "Leases" }] }, { key: "state", label: "State", options: ["active", "trial", "suspended", "expired", "requested"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) }, { key: "ending", label: "Trial ending", options: [{ value: "7", label: "≤ 7 days" }] }, { key: "inactive", label: "Inactive", options: [{ value: "30", label: "> 30 days" }] }]} />
      </div>
      {list.length === 0 ? <StateView icon="workspaces" title="No workspaces match" description="Clear a filter or switch the saved view." /> : (
        <div className="relative overflow-x-auto rounded-panel border border-line">
          <table className="w-full min-w-[980px] text-small"><caption className="sr-only">Workspaces</caption>
            <thead><tr className="border-b border-line text-fg-muted">{["Workspace", "Services", "Trial ends", "Usage", "Last activity", "Account manager"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 text-left font-normal">{h}</th>)}</tr></thead>
            <tbody>{list.map((w) => (
              <tr key={w.id} className="border-b border-line last:border-0 hover:bg-surface/40">
                <td className="px-4 py-3"><Link href={`/platform/workspaces/${w.id}/summary`} className="text-fg hover:underline">{w.name}</Link><span className="block text-micro text-fg-muted">{w.country} · {w.owner}</span></td>
                <td className="px-4"><span className="flex flex-wrap gap-1.5">{w.services.map(([s, st]) => <SvcPill key={s} svc={s} state={st} />)}</span></td>
                <td className={cn("px-4 font-mono text-micro", soon(w) ? "text-warning" : "text-fg-body")}>{w.trialEnds ? day(w.trialEnds) : "—"}</td>
                <td className="px-4">{w.usage.length ? <span className="flex flex-col gap-1">{w.usage.map(([u, a, b]) => <span key={u} className="flex items-center gap-2 text-micro text-fg-muted"><span className="h-1.5 w-16 rounded-full bg-surface"><span className={cn("block h-full rounded-full", a / b >= 0.8 ? "bg-warning" : "bg-[var(--chart-1)]")} style={{ width: `${Math.min(100, (a / b) * 100)}%` }} /></span>{u} {a}/{b}</span>)}</span> : <span className="text-fg-subtle">—</span>}</td>
                <td className={cn("px-4", w.inactiveDays > 30 ? "text-warning" : "text-fg-body")}>{w.last}</td>
                <td className="px-4">{w.am ?? <span className="text-fg-subtle">Unassigned</span>}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      <p className="text-micro text-fg-muted">Showing {list.length} of {rows.length}</p>
    </div>
  );
}

function CreateWorkspace({ onCreate }: { onCreate: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [country, setCountry] = useState("Rwanda");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const ok = name.trim().length >= 2 && emailOk;
  return (
    <Modal open={open} onOpenChange={setOpen} title="Create workspace" description="The owner gets an invite email. No services are enabled until you grant a trial or activate one." trigger={<Button icon={<Icon name="plus" />}>Create workspace</Button>}
      footer={<Button loading={busy} disabled={!ok} disabledReason={!ok ? "Name and a valid owner email are required" : undefined} onClick={async () => {
        setBusy(true); const r = await createWorkspace({ name: name.trim(), ownerEmail: email.trim(), country }); setBusy(false);
        if (!r.ok) { toast.error(r.fieldErrors ? Object.values(r.fieldErrors)[0] : r.error); return; }
        toast.success(`${name.trim()} created · invite sent to ${email}`, { description: "Grant a trial or activate a service next." }); setOpen(false); setName(""); setEmail(""); onCreate(r.data.id);
      }}>Create workspace</Button>}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Workspace name<Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Owner email<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={email.length > 3 && !emailOk} /></label>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Country<Select value={country} onChange={(e) => setCountry(e.target.value)}>{["Rwanda", "Kenya", "Uganda", "Tanzania", "Ghana"].map((c) => <option key={c}>{c}</option>)}</Select></label>
      </div>
    </Modal>
  );
}
