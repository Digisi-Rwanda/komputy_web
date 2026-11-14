"use client";
import { useRouter } from "next/navigation";
import { setWorkspaceLogo, updateWorkspaceProfile } from "@/lib/actions/workspace-admin";
import { toSquareWebp } from "@/lib/image";
import { useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { CopyButton } from "@/components/atoms/CopyButton";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { FormSection } from "@/components/molecules/Field";
import { toast } from "@/components/organisms/Toaster";
import { SaveBar } from "@/components/molecules/SaveBar";

export interface WorkspaceProfile { id: string; name: string; legal: string; country: string; currency: string; fye: string; date: string; region: string; created: string; logo?: string | null }

/** CA6 workspace profile: identity, reporting, read-only data facts; save bar when dirty. */
export function Profile({ ws }: { ws: WorkspaceProfile }) {
  const router = useRouter();
  const INIT = { name: ws.name, legal: ws.legal, country: ws.country, currency: ws.currency, fye: ws.fye, date: ws.date };
  const [saved, setSaved] = useState(INIT);
  const [v, setV] = useState(INIT);
  const [logo, setLogo] = useState<string | null>(ws.logo ?? null);
  const file = useRef<HTMLInputElement>(null);
  const changes = (Object.keys(v) as (keyof typeof v)[]).filter((k) => v[k] !== saved[k]).length;
  const f = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value })) });
  const nameErr = !v.name.trim() ? "Workspace name is required" : undefined;
  return (
    <div className="flex flex-col divide-y divide-line pb-24">
      <FormSection title="Identity" description="Shown in the workspace switcher, emails and exported reports.">
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Workspace name<Input {...f("name")} invalid={Boolean(nameErr)} maxLength={80} />{nameErr && <span className="text-micro text-negative">{nameErr}</span>}</label>
        <div className="flex flex-wrap items-center gap-3">{/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          {logo ? <img src={logo} alt="Workspace logo" className="size-12 rounded-card object-cover" /> : <Avatar initials={ws.name.trim()[0]?.toUpperCase() ?? "W"} square size="lg" />}
          <input ref={file} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="sr-only" aria-label="Upload logo" onChange={async (e) => {
            const x = e.target.files?.[0]; e.target.value = "";
            if (!x) return; if (x.size > 5_000_000) { toast.error("Logo must be under 5 MB"); return; }
            try { const url = await toSquareWebp(x); const r = await setWorkspaceLogo({ logo: url }); if (!r.ok) { toast.error(r.error); return; } setLogo(url); toast.success("Logo updated"); router.refresh(); } catch (err) { toast.error(err instanceof Error ? err.message : "Couldn't read that image."); }
          }} />
          <Button size="sm" variant="secondary" onClick={() => file.current?.click()}>Upload logo</Button><Button size="sm" variant="ghost" disabled={!logo} onClick={async () => { const r = await setWorkspaceLogo({ logo: null }); if (!r.ok) { toast.error(r.error); return; } setLogo(null); toast.success("Logo removed"); router.refresh(); }}>Remove</Button><span className="text-micro text-fg-muted">PNG, SVG, JPEG or WebP · cropped square</span></div>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Legal name<Input {...f("legal")} maxLength={120} /></label>
      </FormSection>
      <FormSection title="Reporting" description="Defaults for new runs and leases.">
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Country<Select {...f("country")}>{["Rwanda", "Kenya", "Uganda", "Tanzania", "Burundi"].map((c) => <option key={c}>{c}</option>)}</Select></label>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Reporting currency<Select {...f("currency")}>{[["RWF", "RWF — Rwandan franc"], ["USD", "USD — US dollar"], ["KES", "KES — Kenyan shilling"], ["UGX", "UGX — Ugandan shilling"], ["TZS", "TZS — Tanzanian shilling"], ["EUR", "EUR — Euro"]].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select><span className="text-micro text-fg-muted">Changing currency affects new runs only.</span></label>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Fiscal year end<Select {...f("fye")}><option value="12-31">31 December</option><option value="06-30">30 June</option><option value="03-31">31 March</option></Select></label>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Default reporting date<Select {...f("date")}><option value="month-end">Month-end</option><option value="quarter-end">Quarter-end</option></Select></label>
      </FormSection>
      <FormSection title="Data" description="Fixed at creation. Contact us to change.">
        <dl className="grid gap-4 text-small">
          <div className="flex flex-col gap-1"><dt className="text-fg-muted">Workspace ID</dt><dd className="flex items-center gap-2 font-mono text-fg">{ws.id}<CopyButton value={ws.id} label="Copy workspace ID" /></dd></div>
          <div className="flex flex-col gap-1"><dt className="text-fg-muted">Data region</dt><dd className="flex items-center gap-2 text-fg"><Lock className="size-3.5 text-fg-muted" />{ws.region} <span className="text-micro text-fg-muted">Contact us to change</span></dd></div>
          <div className="flex flex-col gap-1"><dt className="text-fg-muted">Created</dt><dd className="font-mono text-fg">{ws.created}</dd></div>
        </dl>
      </FormSection>
      <SaveBar changes={changes} onDiscard={() => setV(saved)} onSave={async () => {
        if (nameErr) return;
        const r = await updateWorkspaceProfile({ name: v.name, legalName: v.legal, country: v.country, currency: v.currency as "USD", fiscalYearEnd: v.fye as "12-31", cadence: v.date === "quarter-end" ? "quarterly" : "monthly" });
        if (!r.ok) { toast.error(r.fieldErrors ? Object.values(r.fieldErrors)[0] : r.error); return; }
        setSaved(v); toast.success("Workspace profile saved"); router.refresh();
      }} />
    </div>
  );
}
