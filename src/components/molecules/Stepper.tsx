import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Step { label: string; warn?: boolean; meta?: ReactNode; status?: ReactNode }

const circle = (done: boolean, on: boolean) =>
  cn(
    "relative inline-flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-micro transition-colors duration-base",
    done && "bg-accent text-fg-inverse",
    on && "bg-fg text-fg-inverse ring-4 ring-ring-light",
    !done && !on && "border border-line-strong text-fg-muted",
  );

/** Wizard stepper. Horizontal (DS7.6) or vertical with meta/status per step (month-end close). `current` is 0-based. */
export function Stepper({ steps, current, note, orientation = "horizontal" }: { steps: Step[]; current: number; note?: string; orientation?: "horizontal" | "vertical" }) {
  if (orientation === "vertical") {
    return (
      <ol className="flex flex-col">
        {steps.map((s, i) => {
          const done = i < current, on = i === current;
          return (
            <li key={s.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span aria-current={on ? "step" : undefined} className={circle(done, on)}>{done ? <Check className="size-3.5" /> : i + 1}</span>
                {i < steps.length - 1 && <span aria-hidden className={cn("w-px flex-1", done ? "bg-accent" : "bg-line-strong")} />}
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-3 pb-6 pt-1">
                <span className={cn("text-small", on || done ? "text-fg" : "text-fg-muted")}>{s.label}</span>
                {s.status}
                {s.meta && <span className="ml-auto text-micro text-fg-muted">{s.meta}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <ol className="flex w-full items-start overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const done = i < current, on = i === current;
        return (
          <li key={s.label} className="flex min-w-24 flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-2 px-1 text-center">
              <span aria-current={on ? "step" : undefined} className={circle(done, on)}>
                {done ? <Check className="size-3.5" /> : i + 1}
                {s.warn && <span role="img" aria-label="accepted with warnings" className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-canvas bg-warning" />}
              </span>
              <span className={cn("text-micro whitespace-nowrap", on ? "text-fg" : "text-fg-muted")}>{s.label}</span>
              {on && note && <span className="text-[11px] text-link">{note}</span>}
            </div>
            {i < steps.length - 1 && <span aria-hidden className={cn("mt-3.5 h-px flex-1", done ? "bg-accent" : "bg-line-strong")} />}
          </li>
        );
      })}
    </ol>
  );
}
