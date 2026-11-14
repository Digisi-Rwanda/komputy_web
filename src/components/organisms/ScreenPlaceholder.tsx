import { PageHeader } from "@/components/organisms/PageHeader";
import { Badge } from "@/components/atoms/Badge";
import type { Crumb } from "@/components/molecules/Breadcrumb";

/** Scaffold for a route not yet built: its phase and the approved reference images to build from. */
export function ScreenPlaceholder({ title, phase, refs, crumbs, tabs }: { title: string; phase: string; refs: string[]; crumbs?: Crumb[]; tabs?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader crumbs={crumbs} title={title} status={<Badge mono>{phase}</Badge>} tabs={tabs} />
      <div className="bg-blueprint flex flex-col gap-3 rounded-panel border border-dashed border-line-strong p-8">
        <p className="label-mono">Build from</p>
        <ul className="flex flex-col gap-1 font-mono text-micro text-fg-body">{refs.map((r) => <li key={r}>inspiration/to_build/{r}</li>)}</ul>
      </div>
    </div>
  );
}
