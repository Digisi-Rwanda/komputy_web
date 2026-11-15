"use client";
import Link from "next/link";
import { Database, Settings2, Users } from "lucide-react";
import { Modal } from "@/components/organisms/Modal";
import { Button } from "@/components/atoms/Button";
import { Logo } from "@/components/atoms/Logo";
import { Badge } from "@/components/atoms/Badge";
import { update, useOnboarding } from "@/hooks/useOnboarding";

const ROWS = [
  { icon: Database, title: "Try it with sample data", body: "See a full run in 2 minutes." },
  { icon: Settings2, title: "Set up your own data", body: "Segments, collateral, templates." },
  { icon: Users, title: "Invite your team", body: "Reviewers sign off, analysts upload." },
];

/** O1 first sign-in welcome. Shows once (or when forced via ?welcome=1). */
export function WelcomeModal({ name, workspace, trial, force }: { name: string; workspace: string; trial: string; force?: boolean }) {
  const s = useOnboarding();
  const open = force ? !s.welcomed || force : !s.welcomed;
  const close = () => update({ welcomed: true });
  return (
    <Modal open={open && !s.welcomed} onOpenChange={(v) => !v && close()} size="lg" title={`Welcome to Komputy, ${name}.`} description={`${workspace} is ready. ${trial}`}
      icon={<span className="inline-flex size-12 items-center justify-center rounded-card bg-surface shadow-[0_0_32px_rgb(0_114_245/0.35)]"><Logo wordmark={false} /></span>}
      footer={<span className="mr-auto self-center"><Badge tone="warning">Trial · 3 of 3 runs · 14 days</Badge></span>}>
      <ul className="flex flex-col divide-y divide-line rounded-card border border-line">
        {ROWS.map((r) => <li key={r.title} className="flex items-center gap-4 p-4"><r.icon aria-hidden className="size-5 text-fg-muted" /><span className="text-small text-fg">{r.title} <span className="text-fg-muted">· {r.body}</span></span></li>)}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild onClick={close}><Link href="/ecl/sample?run=1">Start with sample data</Link></Button>
        <Button variant="secondary" onClick={close}>Set up my workspace</Button>
        <Button variant="link" className="ml-auto" onClick={close}>Skip for now</Button>
      </div>
    </Modal>
  );
}
