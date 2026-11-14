"use client";
import { useEffect, useState } from "react";
import { Switch } from "@/components/atoms/Switch";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { toast } from "@/components/organisms/Toaster";
import { applyDensity, applyMotion, applyTheme, readPrefs, saveNegatives, type Theme } from "@/lib/appearance";
import { cn } from "@/lib/cn";

function Mini({ light }: { light: boolean }) {
  const bg = light ? "#F7F7F5" : "#0B0B0B", side = light ? "#EFEFEC" : "#111111", line = light ? "#DADAD5" : "#1F1F1F";
  return <svg viewBox="0 0 120 72" aria-hidden className="w-full rounded-card"><rect width="120" height="72" fill={bg} /><rect width="30" height="72" fill={side} /><rect x="6" y="8" width="18" height="4" rx="2" fill={line} /><rect x="6" y="18" width="14" height="3" rx="1.5" fill={line} /><rect x="6" y="25" width="16" height="3" rx="1.5" fill={line} /><rect x="38" y="10" width="40" height="6" rx="3" fill={light ? "#111" : "#fff"} /><rect x="38" y="24" width="74" height="18" rx="4" fill="none" stroke={line} /><rect x="38" y="48" width="34" height="16" rx="4" fill="none" stroke={line} /><rect x="78" y="48" width="34" height="16" rx="4" fill="none" stroke={line} /><rect x="42" y="30" width="22" height="4" rx="2" fill="#0072F5" /></svg>;
}

/** NA5.1 theme (dark default / light / system), density, reduce motion, negatives format. */
export function Appearance() {
  const [p, setP] = useState({ theme: "dark" as Theme, density: "comfortable", motion: false, negatives: "parens" });
  // Prefs live in localStorage, which only exists after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setP(readPrefs()), []);
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-3"><h2 className="text-h4">Theme</h2>
        <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">{([["dark", "Dark (default)"], ["light", "Light"], ["system", "System"]] as [Theme, string][]).map(([t, l]) => (
          <button key={t} type="button" role="radio" aria-checked={p.theme === t} onClick={() => { applyTheme(t); setP((x) => ({ ...x, theme: t })); toast.success(`Theme: ${l}`); }} className={cn("flex flex-col gap-2 rounded-panel border p-3 text-left", p.theme === t ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong")}>
            {t === "system" ? <span className="grid grid-cols-2 overflow-hidden rounded-card"><Mini light={false} /><Mini light /></span> : <Mini light={t === "light"} />}<span className="text-small text-fg">{l}</span></button>))}</div>
      </section>
      <section className="flex flex-col gap-3"><h2 className="text-h4">Density</h2><ToggleGroup label="Density" value={p.density} onChange={(d) => { applyDensity(d); setP((x) => ({ ...x, density: d })); }} options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} /><p className="text-micro text-fg-muted">Compact fits more rows in tables.</p></section>
      <Switch checked={p.motion} onCheckedChange={(v) => { applyMotion(v); setP((x) => ({ ...x, motion: v })); }} label="Reduce motion" description="Turns off animations. We also follow your system setting." />
      <section className="flex flex-col gap-3"><h2 className="text-h4">Number negatives</h2><ToggleGroup label="Negative numbers" value={p.negatives} onChange={(v) => { saveNegatives(v); setP((x) => ({ ...x, negatives: v })); toast.success("Saved for exports and reports"); }} options={[{ value: "parens", label: "(1,240.00)" }, { value: "minus", label: "−1,240.00" }]} /></section>
    </div>
  );
}
