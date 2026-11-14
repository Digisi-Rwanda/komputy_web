"use client";
import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/atoms/Input";
import { strength } from "@/lib/password";
import { cn } from "@/lib/cn";

const bar = ["bg-negative", "bg-negative", "bg-warning", "bg-positive", "bg-positive"];

/** Password with show/hide and, when `meter`, strength bar + checklist (blueprint §7.1). */
export function PasswordField({ id, name = "password", meter, invalid, autoComplete = "current-password", describedBy, onValueChange }: { id: string; name?: string; meter?: boolean; invalid?: boolean; autoComplete?: string; describedBy?: string; onValueChange?: (v: string) => void }) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  const s = strength(value);
  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(e) => { setValue(e.target.value); onValueChange?.(e.target.value); }} invalid={invalid} aria-describedby={describedBy}
        trailing={<button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="pointer-events-auto text-fg-muted hover:text-fg">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>}
      />
      {meter && value && (
        <div aria-live="polite" className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= s.score ? bar[s.score] : "bg-surface-active")} />)}</div>
            <span className="text-micro text-fg-muted">{s.label}</span>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-micro">
            {[["12+ characters", s.checks.long], ["Upper, lower and a number", s.checks.mixed], ["Not found in known breaches", s.checks.notBreached]].map(([t, ok]) => (
              <li key={String(t)} className={cn("flex items-center gap-1", ok ? "text-positive" : "text-fg-muted")}>{ok ? <Check aria-hidden className="size-3" /> : <X aria-hidden className="size-3" />}{t}<span className="sr-only">{ok ? " met" : " not met"}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
