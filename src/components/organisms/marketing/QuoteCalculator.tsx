"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Slider } from "@/components/atoms/Slider";
import { Icon } from "@/components/atoms/Icon";
import { Badge } from "@/components/atoms/Badge";
import { quote } from "@/lib/pricing";
import { SERVICES } from "@/lib/services";

const SLIDERS = [
  { key: "loansPerRun", label: "Loans per run", min: 0, max: 100_000, step: 5_000, max_label: "100k", needs: "ecl" },
  { key: "activeLeases", label: "Active leases", min: 0, max: 1_000, step: 50, max_label: "1k", needs: "leases" },
  { key: "entities", label: "Legal entities", min: 1, max: 10, step: 1, max_label: "10" },
  { key: "users", label: "Users", min: 1, max: 100, step: 1, max_label: "100" },
] as const;

/** P5 "Build your package": live indicative range, "Request this quote" pre-fills /contact. */
export function QuoteCalculator() {
  const router = useRouter();
  const [svc, setSvc] = useState({ ecl: true, leases: true });
  const [v, setV] = useState({ loansPerRun: 50_000, activeLeases: 300, entities: 3, users: 25 });
  const q = quote({ ...svc, ...v });
  const fmt = (n: number) => n.toLocaleString("en-US");

  const request = () => {
    const services = Object.entries(svc).filter(([, on]) => on).map(([k]) => k).join(",");
    const size = [svc.ecl && `${fmt(v.loansPerRun)} loans`, svc.leases && `${fmt(v.activeLeases)} leases`, `${v.entities} entities`, `${v.users} users`].filter(Boolean).join(" · ");
    router.push(`/contact?topic=quote&package=${svc.ecl && svc.leases ? "dual" : "single"}&services=${services}&size=${encodeURIComponent(size)}${q ? `&range=${q.low}-${q.high}` : ""}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid gap-8 rounded-panel border border-line p-6 md:grid-cols-2">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-h4 text-fg">Services</legend>
          {SERVICES.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <Icon name={s.id === "ecl" ? "ecl" : s.id === "leases" ? "leases" : "file"} className="text-fg-muted" />
              <Checkbox
                className="flex-1"
                disabled={!s.live}
                checked={s.live ? svc[s.id as "ecl" | "leases"] : false}
                onCheckedChange={(c) => setSvc((o) => ({ ...o, [s.id]: c === true }))}
                label={<>{s.name}{s.standard && ` (${s.standard})`} {!s.live && <Badge className="ml-1">Coming soon</Badge>}</>}
              />
            </div>
          ))}
        </fieldset>
        <div className="flex flex-col gap-6">
          {SLIDERS.map((sl) => {
            const off = "needs" in sl && !svc[sl.needs];
            return (
              <div key={sl.key} className={off ? "opacity-40" : undefined}>
                <p className="flex items-baseline justify-between text-small text-fg-muted">{sl.label}<span className="text-micro">{sl.max_label}</span></p>
                <p className="mb-2 text-h3 font-medium text-fg tabular-nums">{fmt(v[sl.key])}</p>
                <Slider label={sl.label} disabled={off} min={sl.min} max={sl.max} step={sl.step} value={[v[sl.key]]} onValueChange={([n]) => setV((o) => ({ ...o, [sl.key]: n }))} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="ring-inner flex flex-col gap-6 rounded-panel border border-line bg-raised p-6">
        <p className="text-h4 text-fg">Indicative range</p>
        <p aria-live="polite" className="text-[34px] font-medium leading-tight tracking-[-0.03em] text-fg tabular-nums">
          {q ? <>USD {fmt(q.low)} – {fmt(q.high)} <span className="text-body font-normal text-fg-muted">/ month</span></> : <span className="text-h4 text-fg-muted">Pick at least one service</span>}
        </p>
        <Button size="lg" disabled={!q} onClick={request}>Request this quote</Button>
        <p className="flex gap-3 text-small text-fg-muted"><Info aria-hidden className="mt-0.5 size-4 shrink-0" />Final pricing is agreed with you. Nothing is charged online.</p>
      </div>
    </div>
  );
}
