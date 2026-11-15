"use client";
import { useState } from "react";
import { GripVertical, X } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { saveCatalog } from "@/lib/actions/platform";

export interface Pkg { name: string; price: string; unit: string; detail: string; cta: string; featured: boolean; features: string[] }
export type ServiceStatus = "live" | "soon" | "hidden";
export interface CatalogDoc { services: { name: string; status: ServiceStatus }[]; packages: Pkg[]; trialDefaults: [string, string][] }

/** PA6 services & packages editor with live public-card preview and publish. */
export function ServicesEditor({ draft, published: pub }: { draft: CatalogDoc; published: CatalogDoc }) {
  const router = useRouter();
  const INIT = pub.packages;
  const SVC = pub.services.map((x) => [x.name, x.status] as [string, string]);
  const [tab, setTab] = useState("packages");
  const [svcs, setSvcs] = useState(draft.services.map((x) => [x.name, x.status] as [string, string]));
  const [pkgs, setPkgs] = useState(draft.packages);
  const published = JSON.stringify([INIT, SVC]);
  const [busy, setBusy] = useState(false);
  const doc = (): CatalogDoc => ({ services: svcs.map(([name, status]) => ({ name, status: status as ServiceStatus })), packages: pkgs, trialDefaults: draft.trialDefaults });
  const save = async (publish: boolean) => { setBusy(true); const r = await saveCatalog({ draft: doc(), publish }); setBusy(false); if (!r.ok) { toast.error(r.error); return; } toast.success(publish ? "Published to /pricing" : "Draft saved"); router.refresh(); };
  const [sel, setSel] = useState(2);
  const [drag, setDrag] = useState<number | null>(null);
  const dirty = JSON.stringify([pkgs, svcs]) !== published;
  const changes = dirty ? pkgs.filter((p, i) => JSON.stringify(p) !== JSON.stringify(INIT[i])).length + svcs.filter((s, i) => s[1] !== SVC[i]?.[1]).length : 0;
  const up = (i: number, patch: Partial<Pkg>) => setPkgs((x) => x.map((p, j) => (j === i ? { ...p, ...patch } : patch.featured ? { ...p, featured: false } : p)));
  const p = pkgs[sel];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3"><ToggleGroup label="Editor" value={tab} onChange={setTab} options={[{ value: "services", label: "Services" }, { value: "packages", label: "Packages" }, { value: "trial", label: "Trial defaults" }]} />
        <span className="ml-auto flex items-center gap-3">{dirty && <span className="flex items-center gap-2 text-small text-warning"><span className="size-2 rounded-full bg-warning" />{changes || 1} unpublished change{changes === 1 ? "" : "s"}</span>}<Button disabled={!dirty} loading={busy} onClick={() => save(true)}>Publish changes</Button></span></div>
      {tab === "services" && <ul className="divide-y divide-line rounded-panel border border-line">{svcs.map(([n, s], i) => <li key={n} className="flex flex-wrap items-center gap-3 px-4 py-3"><span className="flex-1 text-small text-fg">{n}</span><Select aria-label={`Status of ${n}`} value={s} onChange={(e) => setSvcs((x) => x.map((y, j) => (j === i ? [y[0], e.target.value] : y)))} wrapperClassName="w-44"><option value="live">Live</option><option value="soon">Coming soon</option><option value="hidden">Hidden</option></Select></li>)}</ul>}
      {tab === "trial" && <ul className="divide-y divide-line rounded-panel border border-line">{draft.trialDefaults.map(([n, d]) => <li key={n} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-small"><span className="text-fg">{n}</span><span className="font-mono text-micro text-fg-body">{d}</span></li>)}</ul>}
      {tab === "packages" && <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <ul className="flex flex-col gap-2">{pkgs.map((x, i) => <li key={i}><button type="button" aria-pressed={sel === i} onClick={() => setSel(i)} className={cn("flex w-full flex-col rounded-card border px-3 py-2 text-left", sel === i ? "border-fg" : "border-line")}><span className="text-small text-fg">{x.name}</span><span className="text-micro text-fg-muted">{x.price} {x.unit}{x.featured && " · Most popular"}</span></button></li>)}</ul>
        <section className="flex flex-col gap-4 rounded-panel border border-line p-5">
          <div className="grid gap-3 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-small text-fg-body">Name<Input value={p.name} onChange={(e) => up(sel, { name: e.target.value })} /></label><label className="flex flex-col gap-1.5 text-small text-fg-body">Price<Input value={p.price} onChange={(e) => up(sel, { price: e.target.value })} /></label><label className="flex flex-col gap-1.5 text-small text-fg-body">Unit<Input value={p.unit} onChange={(e) => up(sel, { unit: e.target.value })} /></label><label className="flex flex-col gap-1.5 text-small text-fg-body">CTA label<Input value={p.cta} onChange={(e) => up(sel, { cta: e.target.value })} maxLength={24} /></label></div>
          <Switch checked={p.featured} onCheckedChange={(v) => up(sel, { featured: v })} label="Most popular" description="Only one package can be highlighted." />
          <div className="flex flex-col gap-2"><span className="text-small text-fg-body">Features (drag to reorder)</span>
            {p.features.map((ft, i) => <div key={i} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag == null) return; const f = [...p.features]; const [m] = f.splice(drag, 1); f.splice(i, 0, m); up(sel, { features: f }); setDrag(null); }} className="flex items-center gap-2"><GripVertical aria-hidden className="size-4 cursor-grab text-fg-subtle" /><Input aria-label={`Feature ${i + 1}`} value={ft} onChange={(e) => up(sel, { features: p.features.map((x, j) => (j === i ? e.target.value : x)) })} /><button type="button" aria-label={`Remove feature ${i + 1}`} onClick={() => up(sel, { features: p.features.filter((_, j) => j !== i) })} className="inline-flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-surface"><X className="size-3.5" /></button></div>)}
            <Button size="sm" variant="secondary" className="w-fit" onClick={() => up(sel, { features: [...p.features, ""] })}>+ Add feature</Button></div>
        </section>
        <aside className="flex h-fit flex-col gap-3"><Badge mono className="w-fit">PREVIEW</Badge>
          <div className={cn("flex flex-col gap-4 rounded-panel border p-6", p.featured ? "border-fg" : "border-line")}>{p.featured && <Badge tone="info" className="w-fit">Most popular</Badge>}<p className="text-h4">{p.name || "Untitled"}</p><p><span className="text-h2 tracking-[-0.03em]">{p.price}</span> <span className="text-small text-fg-muted">{p.unit}</span></p>
            <ul className="flex flex-col gap-1.5">{p.features.filter(Boolean).map((f) => <li key={f} className="text-small text-fg-body">✓ {f}</li>)}</ul><span className="inline-flex h-10 items-center justify-center rounded-full bg-fg text-small text-fg-inverse">{p.cta || "No button"}</span></div></aside>
      </div>}
      <p className="text-micro text-fg-muted">Trial defaults: {draft.trialDefaults.map(([n, d]) => `${n.replace("Expected Credit Loss", "ECL").replace("Lease Accounting", "Leases")} ${d}`).join(" · ")}</p>
    </div>
  );
}
