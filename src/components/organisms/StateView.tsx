import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { Button } from "@/components/atoms/Button";
import { Skeleton } from "@/components/atoms/Skeleton";
import { LiveDot } from "@/components/atoms/LiveDot";
import { ProgressBar } from "@/components/molecules/Progress";

/** DS9 composition: icon in a ringed circle, title, one line, one primary action, at most one secondary link. */
export function StateView({ icon = "file", art, tone, title, description, action, secondary, children, className }: {
  icon?: IconName; /** replaces the icon circle, e.g. a big "404" numeral */ art?: ReactNode; tone?: "negative" | "warning" | "muted"; title: ReactNode; description?: ReactNode; action?: ReactNode; secondary?: ReactNode; children?: ReactNode; className?: string;
}) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-panel border border-line px-6 py-16 text-center", className)}>
      <div aria-hidden className="bg-blueprint fade-y absolute inset-0 opacity-60" />
      {art ? <div className="relative">{art}</div> : <span className={cn("ring-inner relative inline-flex size-[72px] items-center justify-center rounded-full bg-raised", tone === "negative" ? "text-negative" : tone === "warning" ? "text-warning" : tone === "muted" ? "text-fg-muted" : "text-fg")}>
        <Icon name={icon} size={28} />
      </span>}
      <h3 className="relative text-[20px] leading-snug">{title}</h3>
      {description && <p className="relative max-w-[60ch] text-small text-fg-muted">{description}</p>}
      {children && <div className="relative w-full max-w-sm">{children}</div>}
      {(action || secondary) && <div className="relative flex flex-wrap items-center justify-center gap-4">{action}{secondary}</div>}
    </div>
  );
}

const linkBtn = (href: string, label: string) => <Button asChild variant="link"><Link href={href}>{label}</Link></Button>;

/** The twelve DS9 states as ready presets. */
export const States = {
  LoadingTable: () => (
    <div aria-busy className="flex flex-col gap-3 rounded-panel border border-line p-4">
      <div className="flex gap-2"><Skeleton className="h-8 w-24 rounded-full" /><Skeleton className="h-8 w-24 rounded-full" /></div>
      {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10" />)}
    </div>
  ),
  LoadingDashboard: () => (
    <div aria-busy className="flex flex-col gap-6">
      <Skeleton className="h-4 w-48" /><Skeleton className="h-12 w-80" />
      <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>
      <Skeleton className="h-64 rounded-card" />
    </div>
  ),
  NoRuns: () => <StateView icon="ecl" title="No ECL runs yet" description="Upload PD, LGD and EAD data to compute your first provision." action={<Button asChild icon={<Icon name="plus" />}><Link href="/ecl/runs/new">New run</Link></Button>} secondary={<>{linkBtn("/ecl/runs/new?sample=1", "Try with sample data")}{linkBtn("/ecl/setup/templates", "Download templates")}</>} />,
  NoLeases: () => <StateView icon="leases" title="Your lease register is empty" description="Add a lease or import a spreadsheet." action={<Button asChild icon={<Icon name="plus" />}><Link href="/leases/new">New lease</Link></Button>} secondary={linkBtn("/leases/imports", "Import leases")} />,
  Filtered: ({ onClear }: { onClear?: () => void }) => <StateView icon="filter" tone="muted" title="No runs match these filters" action={<Button variant="secondary" onClick={onClear}>Clear filters</Button>} />,
  PageError: ({ refId = "req_01HF7K…9Q", onRetry }: { refId?: string; onRetry?: () => void }) => <StateView icon="x-circle" tone="negative" title="We couldn't load this run" description={<>The server didn&apos;t respond. Your data is safe. <span className="block pt-2 font-mono text-micro">Ref: {refId}</span></>} action={<Button variant="secondary" onClick={onRetry} icon={<Icon name="refresh" />}>Try again</Button>} />,
  NoPermission: ({ what = "sign off runs", role = "Reviewer", admins = "Aline Mugisha, Eric Uwase" }: { what?: string; role?: string; admins?: string }) => <StateView icon="lock" title={`You don't have access to ${what}`} description={<>Ask an administrator to give you the {role} role.<span className="block pt-2 text-micro">Admins: {admins}</span></>} action={<Button variant="secondary">Request role</Button>} />,
  LockedService: ({ name = "Lease Accounting", features = ["IFRS 16 schedules & journals", "Month-end close", "Disclosures"] }: { name?: string; features?: string[] }) => (
    <StateView icon="lock" tone="muted" title={`${name} isn't active in this workspace`} action={<Button>Start 14-day trial</Button>} secondary={<><Button variant="secondary">Request access</Button>{linkBtn("/pricing", "See pricing")}</>}>
      <ul className="flex flex-col gap-2 text-left text-small text-fg-body">{features.map((f) => <li key={f} className="flex items-center gap-2"><Icon name="check" className="text-positive" />{f}</li>)}</ul>
    </StateView>
  ),
  QuotaReached: ({ used = 5, limit = 5, unit = "trial runs" }: { used?: number; limit?: number; unit?: string }) => (
    <StateView icon="gauge" tone="warning" title={`You've used all ${limit} ${unit}`} description="Existing runs stay available. Request more to keep computing." action={<Button>Request more runs</Button>}>
      <ProgressBar value={used} max={limit} label={unit} tone="warning" showValue />
    </StateView>
  ),
  ReadOnly: () => <StateView icon="lock" tone="negative" title="Read-only: this workspace is suspended" description="You can still view and export everything." action={<Button variant="secondary" icon={<Icon name="download" />}>Export all data</Button>} />,
  NotFound: () => (
    <StateView title="This page doesn't exist" art={<span aria-hidden className="font-serif text-[120px] leading-none text-line-strong">404</span>} action={<Button asChild><Link href="/">Go home</Link></Button>} />
  ),
  Maintenance: () => <StateView icon="clock" title={<span className="inline-flex items-center gap-2"><LiveDot tone="warning" pulse />Komputy is updating</span>} description="Back in about 10 minutes. Uploads are paused, everything else is read-only." secondary={linkBtn("/status", "Status page")} />,
};
