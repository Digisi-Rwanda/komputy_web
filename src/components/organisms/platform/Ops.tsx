"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { LiveDot } from "@/components/atoms/LiveDot";
import { StatusPill } from "@/components/atoms/StatusPill";
import { ConfirmDialog, Sheet } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { day } from "@/components/organisms/platform/shared";
import { promoteEngine } from "@/lib/actions/engines";
import { download, toCsv } from "@/lib/csv";
import type { Probe } from "@/server/health";

export interface EngineRow { version: string; current: boolean; released: string; pinned: number; changelog: string[] }

/** PA8.1 engine versions (from ECL-Server) with release notes and promote-to-default. */
export function Engines({ rows, error, canPromote }: { rows: EngineRow[]; error?: string; canPromote: boolean }) {
  const router = useRouter();
  const [notes, setNotes] = useState<EngineRow | null>(null);
  const current = rows.find((r) => r.current);
  if (error) return <p className="rounded-panel border border-line px-4 py-6 text-center text-small text-fg-muted">{error}</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[720px] text-small"><caption className="sr-only">Engine versions</caption>
        <thead><tr className="border-b border-line text-fg-muted">{["Version", "Status", "Released", "Workspaces pinned", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-2.5 text-left font-normal">{h}</th>)}</tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-6 text-center text-fg-muted">No engine versions registered.</td></tr> : rows.map((r) => <tr key={r.version} className="border-b border-line last:border-0"><td className="px-4 py-3 font-mono text-fg">{r.version}</td><td className="px-4"><StatusPill tone={r.current ? "positive" : "neutral"}>{r.current ? "Default" : "Available"}</StatusPill></td><td className="px-4 text-fg-muted">{day(r.released)}</td><td className="px-4 tabular-nums">{r.pinned}</td>
          <td className="px-4 text-right"><span className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setNotes(r)}>Release notes</Button>
            {!r.current && canPromote && <ConfirmDialog danger={false} title={`Promote ${r.version} to default?`} description={`New runs use it from now on. Workspaces pinned to ${current?.version ?? "older versions"} won't change.`} confirmLabel="Promote" onConfirm={async () => { const x = await promoteEngine(r.version); if (!x.ok) toast.error(x.error); else { toast.success(`${r.version} is now the default`); router.refresh(); } }} trigger={<Button size="sm">Promote</Button>} />}</span></td></tr>)}</tbody></table></div>
      <Sheet open={Boolean(notes)} onOpenChange={(v) => !v && setNotes(null)} title={notes ? `Engine ${notes.version}` : ""} description={notes ? `Released ${day(notes.released)}` : ""}>
        <ul className="flex flex-col gap-2">{notes?.changelog.length ? notes.changelog.map((n) => <li key={n} className="text-small text-fg-body">• {n}</li>) : <li className="text-small text-fg-muted">No notes.</li>}</ul>
      </Sheet>
    </div>
  );
}

/** PA8.2 live probes from this server. */
export function Health({ probes, checkedAt }: { probes: Probe[]; checkedAt: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{probes.map((p) => <div key={p.name} className="flex flex-col gap-2 rounded-card border border-line p-4"><span className="flex items-center gap-2 text-small text-fg-muted">{p.ok ? <LiveDot /> : <span className="size-2 rounded-full bg-negative" />}{p.name}</span><span className={`text-h4 ${p.ok ? "text-fg" : "text-negative"}`}>{p.value}</span>{p.ms !== null && <span className="font-mono text-micro text-fg-muted">{p.ms} ms</span>}</div>)}</div>
      <p className="text-micro text-fg-muted">Checked {new Date(checkedAt).toLocaleTimeString("en-GB")} · refresh the page to re-check.</p>
      {/* shortcut: no latency history or incident log yet; wire OpenTelemetry metrics + a status page (plan 0.7). */}
      <section className="flex flex-col gap-3"><h2 className="text-h4">Recent incidents</h2><p className="rounded-panel border border-line px-4 py-6 text-center text-small text-fg-muted">No incidents recorded.</p></section>
    </div>
  );
}

export interface AuditRow { at: string; actor: string; action: string; ws: string; detail: string; reason: string }

/** PA8.3 platform audit (staff actions only) with CSV export. */
export function PlatformAudit({ rows }: { rows: AuditRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end"><Button variant="secondary" icon={<Download />} onClick={() => download("platform-audit.csv", toCsv([["Time (UTC)", "Staff", "Action", "Workspace", "Detail", "Reason"], ...rows.map((a) => [a.at, a.actor, a.action, a.ws, a.detail, a.reason])]))}>Export CSV</Button></div>
      <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[820px] text-small"><caption className="sr-only">Platform audit</caption>
        <thead><tr className="border-b border-line text-fg-muted">{["When", "Staff", "Action", "Workspace", "Reason"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 text-left font-normal">{h}</th>)}</tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-6 text-center text-fg-muted">No staff actions yet.</td></tr> : rows.map((a, i) => <tr key={i} className="border-b border-line last:border-0"><td className="px-4 py-3 font-mono text-micro text-fg-muted">{day(a.at)}</td><td className="px-4 text-fg">{a.actor}</td><td className="px-4 text-fg-body">{a.action.replace(/_/g, " ")}{a.detail && ` · ${a.detail}`}</td><td className="px-4">{a.ws}</td><td className="px-4 text-fg-muted">{a.reason && `“${a.reason}”`}</td></tr>)}</tbody></table></div>
    </div>
  );
}
