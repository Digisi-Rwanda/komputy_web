"use client";
import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Button } from "@/components/atoms/Button";

export interface RuleResult {
  code: string;
  title: string;
  status: "passed" | "warning" | "error";
  detail?: string;
  rows?: number;
  sample?: ReactNode;
}

const meta = {
  passed: [CheckCircle2, "text-positive", "Passed"],
  warning: [AlertTriangle, "text-warning", "Warning"],
  error: [XCircle, "text-negative", "Error"],
} as const;

/** DS4 validation report: summary counts, tabs by severity, expandable rule rows with sample rows. */
export function ValidationReport({ rules, onDownload }: { rules: RuleResult[]; onDownload?: (code: string) => void }) {
  const n = { error: 0, warning: 0, passed: 0 };
  rules.forEach((r) => n[r.status]++);
  const [tab, setTab] = useState<keyof typeof n>(n.error ? "error" : n.warning ? "warning" : "passed");
  const [open, setOpen] = useState<string>();
  const verdict = n.error ? ["negative", `Cannot continue — fix ${n.error} error${n.error > 1 ? "s" : ""}`] : n.warning ? ["warning", "Passed with warnings"] : ["positive", "All checks passed"];
  return (
    <div className="flex flex-col gap-4">
      <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border px-5 py-4", verdict[0] === "negative" ? "border-negative/40 bg-negative-tint" : verdict[0] === "warning" ? "border-warning/40 bg-warning-tint" : "border-positive/40 bg-positive-tint")}>
        <p className="flex-1 text-h4 text-fg">{verdict[1]}</p>
        {(["passed", "warning", "error"] as const).map((k) => {
          const [I, c] = meta[k];
          return <span key={k} className="flex items-center gap-1.5 text-small text-fg-body"><I aria-hidden className={cn("size-4", c)} />{n[k]} {k === "passed" ? "passed" : k === "warning" ? "warnings" : "errors"}</span>;
        })}
      </div>
      <ToggleGroup label="Filter rules by result" value={tab} onChange={(v) => setTab(v as keyof typeof n)} options={[{ value: "error", label: "Errors", count: n.error }, { value: "warning", label: "Warnings", count: n.warning }, { value: "passed", label: "Passed", count: n.passed }]} />
      <ul className="flex flex-col divide-y divide-line rounded-card border border-line">
        {rules.filter((r) => r.status === tab).map((r) => {
          const [I, c, word] = meta[r.status];
          const expanded = open === r.code;
          return (
            <li key={r.code}>
              <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? undefined : r.code)} className="flex w-full items-start gap-3 px-5 py-4 text-left">
                <I aria-hidden className={cn("mt-0.5 size-4 shrink-0", c)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-small text-fg"><span className="font-mono text-micro text-fg-muted">{r.code}</span> · {r.title}</span>
                  {r.detail && <span className="block text-micro text-fg-muted">{r.detail}</span>}
                </span>
                <span className={cn("text-micro", c)}>{word}</span>
                {r.rows != null && <span className="w-16 text-right font-mono text-micro text-fg-muted">{r.rows} rows</span>}
                {r.sample && <ChevronDown aria-hidden className={cn("size-4 text-fg-muted transition-transform", expanded && "rotate-180")} />}
              </button>
              {expanded && r.sample && (
                <div className="flex flex-col gap-3 px-5 pb-4 pl-12">
                  {r.sample}
                  {onDownload && <Button variant="link" size="sm" className="self-start" onClick={() => onDownload(r.code)}>Download all {r.rows} rows</Button>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
