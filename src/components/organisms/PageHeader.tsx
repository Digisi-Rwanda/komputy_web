import type { ReactNode } from "react";
import { Breadcrumb, type Crumb } from "@/components/molecules/Breadcrumb";

/** Page anatomy (DS7.5): breadcrumb → title row (h1 + status + mono chips + actions) → description → tabs. */
export function PageHeader({ crumbs, title, status, meta, actions, description, tabs }: {
  crumbs?: Crumb[]; title: ReactNode; status?: ReactNode; meta?: ReactNode; actions?: ReactNode; description?: ReactNode; tabs?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4">
      {crumbs && <Breadcrumb items={crumbs} />}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-h3 tracking-[-0.03em] md:text-[32px] md:leading-tight">{title}</h1>
        {status}
        {meta && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
        {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">{actions}</div>}
      </div>
      {description && <p className="max-w-3xl text-small text-fg-muted">{description}</p>}
      {tabs}
    </header>
  );
}

/** Content with optional right side panel (filters, details); panel stacks below on small screens. */
export function PageContent({ children, panel, panelWidth = "lg:w-80" }: { children: ReactNode; panel?: ReactNode; panelWidth?: string }) {
  if (!panel) return <div className="flex flex-col gap-8">{children}</div>;
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-8">{children}</div>
      <aside className={`flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-20 ${panelWidth}`}>{panel}</aside>
    </div>
  );
}

/** Titled section block used across pages. */
export function Section({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-4 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center gap-3">
          {title && <h2 className="text-h4">{title}</h2>}
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
