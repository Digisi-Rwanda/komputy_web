"use client";
import { useEffect, useState } from "react";
import { Switch } from "@/components/atoms/Switch";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { toast } from "@/components/organisms/Toaster";
import { applyDensity, applyMotion, readPrefs, saveNegatives } from "@/lib/appearance";


/** NA5.1 density, reduce motion, negatives format. (Komputy has one light theme.) */
export function Appearance() {
  const [p, setP] = useState({ density: "comfortable", motion: false, negatives: "parens" });
  // Prefs live in localStorage, which only exists after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setP(readPrefs()), []);
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-3"><h2 className="text-h4">Density</h2><ToggleGroup label="Density" value={p.density} onChange={(d) => { applyDensity(d); setP((x) => ({ ...x, density: d })); }} options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} /><p className="text-micro text-fg-muted">Compact fits more rows in tables.</p></section>
      <Switch checked={p.motion} onCheckedChange={(v) => { applyMotion(v); setP((x) => ({ ...x, motion: v })); }} label="Reduce motion" description="Turns off animations. We also follow your system setting." />
      <section className="flex flex-col gap-3"><h2 className="text-h4">Number negatives</h2><ToggleGroup label="Negative numbers" value={p.negatives} onChange={(v) => { saveNegatives(v); setP((x) => ({ ...x, negatives: v })); toast.success("Saved for exports and reports"); }} options={[{ value: "parens", label: "(1,240.00)" }, { value: "minus", label: "Minus sign" }]} /></section>
    </div>
  );
}
