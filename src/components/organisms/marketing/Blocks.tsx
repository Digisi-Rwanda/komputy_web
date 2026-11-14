import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { Badge } from "@/components/atoms/Badge";
import { ServiceStatePill } from "@/components/atoms/StatusPill";
import { FadeIn } from "@/components/atoms/FadeIn";
import { SERVICES } from "@/lib/services";
import { cn } from "@/lib/cn";
import type { ServiceId } from "@/types/domain";
import type { InputFile } from "@/data/services";

/** Icon/title/body cards on a ruled grid. */
export function FeatureGrid({ items, columns = 3, className }: { items: { icon: IconName; title: string; body: string }[]; columns?: 2 | 3; className?: string }) {
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3", className)}>
      {items.map((f, i) => (
        <li key={f.title}>
          <FadeIn delay={i * 50} className="ring-inner flex h-full flex-col gap-3 rounded-panel border border-line bg-raised p-6">
            <span className="inline-flex size-10 items-center justify-center rounded-card bg-surface text-fg"><Icon name={f.icon} size={20} /></span>
            <h3 className="text-h4">{f.title}</h3>
            <p className="text-small text-fg-muted">{f.body}</p>
          </FadeIn>
        </li>
      ))}
    </ul>
  );
}

/** Numbered steps joined by a hairline (horizontal on desktop, vertical on phones). */
export function WorkflowSteps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
      <span aria-hidden className="absolute left-5 right-5 top-5 hidden h-px bg-line-strong lg:block" />
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
          <span className="relative z-[1] inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-canvas font-mono text-small text-fg">{i + 1}</span>
          <span className="flex flex-col gap-1"><span className="text-small font-medium text-fg">{s.title}</span><span className="text-micro text-fg-muted">{s.body}</span></span>
        </li>
      ))}
    </ol>
  );
}

/** Required input columns per file, with a no-sign-up template download (blueprint §6.2 trust signal). */
export function InputsTable({ files }: { files: InputFile[] }) {
  return (
    <div className={cn("grid gap-4", files.length > 1 && "lg:grid-cols-3")}>
      {files.map((f) => (
        <div key={f.name} className="flex flex-col rounded-panel border border-line">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <Icon name="sheet" className="text-positive" />
            <p className="flex-1 text-small text-fg">{f.name}</p>
            <a href={f.template} download className="inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary px-3 text-micro text-fg hover:bg-secondary-hover"><Download aria-hidden className="size-3.5" />Template</a>
          </div>
          <table className="w-full text-small">
            <caption className="sr-only">{f.name} columns</caption>
            <thead><tr className="text-micro text-fg-muted"><th scope="col" className="px-5 py-2 text-left font-normal">Column</th><th scope="col" className="px-5 py-2 text-right font-normal">Required</th></tr></thead>
            <tbody>
              {f.columns.map((c) => (
                <tr key={c.name} className="border-t border-line">
                  <td className="px-5 py-2.5 text-fg-body"><span className="font-mono text-micro text-fg">{c.name}</span>{c.note && <span className="block text-micro text-fg-muted">{c.note}</span>}</td>
                  <td className="px-5 py-2.5 text-right">{c.required ? <Badge tone="info">Required</Badge> : <Badge>Optional</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

/** Cards linking to the other services (live first). */
export function OtherServices({ exclude }: { exclude: ServiceId }) {
  const list = SERVICES.filter((s) => s.id !== exclude).sort((a, b) => Number(b.live) - Number(a.live));
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <li key={s.id}>
            <Link href={`/services/${s.id}`} className={cn("group flex h-full items-start gap-4 rounded-panel border border-line p-5 transition-colors hover:border-line-strong hover:bg-raised", !s.live && "opacity-70 hover:opacity-100")}>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <ServiceStatePill state={s.live ? "active" : "coming-soon"} />
                <span className="text-small text-fg">{s.name}{s.standard && ` (${s.standard})`}</span>
                <span className="text-micro text-fg-muted">{s.description}</span>
              </span>
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted group-hover:text-fg"><ArrowRight className="size-4" /></span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/#services" className="inline-flex w-fit items-center gap-1 text-small text-link hover:underline">All services<ArrowRight aria-hidden className="size-4" /></Link>
    </div>
  );
}
