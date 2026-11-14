"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

/** Copies `value`; flips to a check for 1.5 s. */
export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={done ? "Copied" : label}
      title={done ? "Copied" : label}
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked: no-op */ }
      }}
      className={cn("inline-flex size-6 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface hover:text-fg", className)}
    >
      {done ? <Check className="size-3.5 text-positive" /> : <Copy className="size-3.5" />}
    </button>
  );
}
