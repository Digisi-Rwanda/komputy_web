"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Banner } from "@/components/molecules/Banner";
import { LiveDot } from "@/components/atoms/LiveDot";
import { daysLeft, quotaLeft } from "@/lib/entitlements";
import { service } from "@/lib/services";
import type { Workspace } from "@/types/domain";

interface Item { id: string; tone: "info" | "warning" | "negative" | "positive"; text: React.ReactNode; action?: React.ReactNode; dismissible: boolean; live?: boolean }

const online = (cb: () => void) => { window.addEventListener("online", cb); window.addEventListener("offline", cb); return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); }; };
const link = "text-small text-fg underline-offset-4 hover:underline";

/** SH5 banner zone below the top bar: trial, suspended, support session, verify email, offline. Max 2 visible + "+N more". */
export function BannerStack({ workspace, support, unverifiedEmail, suspendedReason }: { workspace: Workspace; support?: { by: string; until: string; approvedBy: string }; unverifiedEmail?: string; suspendedReason?: string }) {
  const isOnline = useSyncExternalStore(online, () => navigator.onLine, () => true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  const items: Item[] = [];
  if (!isOnline) items.push({ id: "offline", tone: "warning", live: true, dismissible: false, text: "We can't reach Komputy. Showing the last loaded data.", action: <button type="button" onClick={() => location.reload()} className={link}>Retry</button> });
  if (suspendedReason) items.push({ id: "suspended", tone: "negative", dismissible: false, text: `This workspace is suspended: ${suspendedReason}. Everything is read-only.`, action: <Link href="/contact" className={link}>Contact us →</Link> });
  if (support) items.push({ id: "support", tone: "info", live: true, dismissible: false, text: `Komputy Support (${support.by}) is viewing this workspace until ${support.until}, approved by ${support.approvedBy}.`, action: <Link href="/admin/security" className={link}>End session</Link> });
  for (const e of workspace.entitlements) {
    if (e.state === "trial") items.push({ id: `trial-${e.service}`, tone: "warning", dismissible: false, text: `${service(e.service).name} trial · ${e.quota ? `${quotaLeft(e)} of ${e.quota.limit} ${e.quota.unit} left · ` : ""}${daysLeft(e)} days remaining`, action: <Link href="/admin/services" className={link}>Request access →</Link> });
    if (e.state === "suspended" || e.state === "trial-expired") items.push({ id: `blocked-${e.service}`, tone: "negative", dismissible: false, text: `${service(e.service).name} is read-only. You can still export your data.`, action: <Link href="/contact" className={link}>Contact sales →</Link> });
  }
  if (unverifiedEmail) items.push({ id: "verify", tone: "info", dismissible: true, text: `Verify your email to upload files. We sent a link to ${unverifiedEmail}.`, action: <Link href="/verify-email-pending" className={link}>Resend</Link> });

  const visible = items.filter((i) => !dismissed.includes(i.id));
  if (!visible.length) return null;
  const shown = expanded ? visible : visible.slice(0, 2);
  return (
    <div role="region" aria-label="Notices" className="flex flex-col gap-2">
      {shown.map((b) => (
        <Banner key={b.id} tone={b.tone} action={<>
          {b.action}
          {b.dismissible && <button type="button" aria-label="Dismiss" onClick={() => setDismissed((d) => [...d, b.id])} className="text-fg-muted hover:text-fg"><X className="size-4" /></button>}
        </>}>
          <span className="inline-flex items-center gap-2">{b.live && <LiveDot tone={b.tone === "info" ? "info" : "warning"} pulse />}{b.text}</span>
        </Banner>
      ))}
      {visible.length > 2 && <button type="button" onClick={() => setExpanded((v) => !v)} className="w-fit rounded-full bg-surface px-3 py-1 text-micro text-fg-muted hover:text-fg">{expanded ? "Show less" : `+${visible.length - 2} more`}</button>}
    </div>
  );
}
