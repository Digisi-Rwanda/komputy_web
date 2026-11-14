import { AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function FormAlert({ tone = "negative", children }: { tone?: "negative" | "warning"; children: React.ReactNode }) {
  const I = tone === "warning" ? AlertTriangle : XCircle;
  return (
    <div role="alert" className={cn("mb-5 flex gap-2.5 rounded-card border px-3.5 py-3 text-small text-fg", tone === "warning" ? "border-warning/40 bg-warning-tint" : "border-negative/40 bg-negative-tint")}>
      <I aria-hidden className={cn("mt-0.5 size-4 shrink-0", tone === "warning" ? "text-warning" : "text-negative")} />
      <div>{children}</div>
    </div>
  );
}
