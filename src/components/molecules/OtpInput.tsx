"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Six single-digit boxes: auto-advance, backspace back, paste fills all. Submits as hidden `name`. */
export function OtpInput({ name = "code", invalid, onComplete }: { name?: string; invalid?: boolean; onComplete?: (code: string) => void }) {
  const [d, setD] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (next: string[]) => { setD(next); if (next.every(Boolean)) onComplete?.(next.join("")); };
  return (
    <div className="flex justify-center gap-2" role="group" aria-label="6-digit code">
      <input type="hidden" name={name} value={d.join("")} />
      {d.map((v, i) => (
        <input
          key={i} ref={(el) => { refs.current[i] = el; }} value={v} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={1} aria-label={`Digit ${i + 1}`} aria-invalid={invalid || undefined} autoFocus={i === 0}
          onChange={(e) => { const c = e.target.value.replace(/\D/g, "").slice(-1); const n = [...d]; n[i] = c; set(n); if (c && i < 5) refs.current[i + 1]?.focus(); }}
          onKeyDown={(e) => { if (e.key === "Backspace" && !d[i] && i > 0) refs.current[i - 1]?.focus(); }}
          onPaste={(e) => { const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (!p) return; e.preventDefault(); set(Array.from({ length: 6 }, (_, k) => p[k] ?? "")); refs.current[Math.min(p.length, 5)]?.focus(); }}
          className={cn("size-12 rounded-input border bg-surface text-center font-mono text-h4 text-fg outline-none focus-visible:border-focus focus-visible:ring-4 focus-visible:ring-info-tint", invalid ? "border-negative" : "border-line")}
        />
      ))}
    </div>
  );
}
