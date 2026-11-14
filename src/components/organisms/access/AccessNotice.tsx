import Link from "next/link";
import { Clock } from "lucide-react";
import { Banner } from "@/components/molecules/Banner";
import { Button } from "@/components/atoms/Button";
import type { ServiceState } from "@/types/domain";

export interface NoticeInfo { requestedAt?: string; ref?: string; trialEndedAt?: string; expiredAt?: string; archiveAt?: string; reason?: string; quota?: string }

/** Per-state notice for a service page (AC4). Returns null for states that need none (active, trial uses the shell banner). */
export function AccessNotice({ state, info = {} }: { state: ServiceState; info?: NoticeInfo }) {
  switch (state) {
    case "requested":
      return (
        <div role="status" className="flex flex-wrap items-center gap-4 rounded-panel border border-accent/40 bg-info-tint p-5">
          <Clock aria-hidden className="size-5 text-link" />
          <p className="flex-1 text-small text-fg">Request sent {info.requestedAt ?? "today"} · We&apos;ll contact you within 1 business day.</p>
          {info.ref && <span className="font-mono text-micro text-fg-muted">Ref {info.ref}</span>}
        </div>
      );
    case "trial-expired":
      return <Banner tone="warning" action={<Button asChild size="sm"><Link href="/contact?topic=quote">Request a quote</Link></Button>}>Your trial ended on {info.trialEndedAt ?? "—"} · read-only. Your data stays available.</Banner>;
    case "expired":
      return <Banner tone="warning" action={<Button asChild size="sm"><Link href="/contact?topic=quote">Renew</Link></Button>}>Contract expired {info.expiredAt ?? "—"} · read-only until {info.archiveAt ?? "—"}, then archived.</Banner>;
    case "suspended":
      return <Banner tone="negative" action={<Button size="sm" variant="secondary">Export all data</Button>}>Suspended{info.reason ? `: ${info.reason}` : ""}. Everything is read-only — you can still export.</Banner>;
    default:
      return null;
  }
}

/** Read-only wrapper: greys content and blocks interaction but keeps it visible (trial ended / suspended / expired). */
export const ReadOnly = ({ children }: { children: React.ReactNode }) => <div aria-disabled className="pointer-events-none select-none opacity-50 grayscale">{children}</div>;
