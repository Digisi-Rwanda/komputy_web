"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Textarea } from "@/components/atoms/Textarea";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { reviewRun } from "@/lib/actions/ecl";

/**
 * LM3.2-3.4: sticky review bar. needs-review → reviewers Return / Approve & sign off (never their own run);
 * returned → the preparer resubmits. The engine enforces the same rules; this only mirrors them in the UI.
 */
export function SignOffBar({ id, name, status, preparer, preparerId, me, canReview, canPrepare }: {
  id: string; name: string; status: "needs-review" | "returned"; preparer: string; preparerId: string; me: string; canReview: boolean; canPrepare: boolean;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState<null | "return" | "sign" | "resubmit">(null);
  const self = preparerId === me;
  const act = (decision: "sign-off" | "return" | "resubmit", comment: string, ok: string) => start(async () => {
    const r = await reviewRun(id, decision, comment);
    if (!r.ok) { toast.error(r.error); return; }
    toast.success(ok); setOpen(null); setNote(""); setReason(""); router.refresh();
  });

  if (status === "returned") {
    if (!canPrepare) return null;
    return (
      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t border-line bg-canvas px-4 py-3 sm:mx-0 sm:rounded-panel sm:border">
        <p className="hidden flex-1 text-small text-fg-body sm:block">Returned for changes. Fix the inputs with a rerun, or resubmit with a note if nothing needs to change.</p>
        <Modal open={open === "resubmit"} onOpenChange={(o) => setOpen(o ? "resubmit" : null)} title={`Resubmit ${name}?`} description="Reviewers are notified." size="sm"
          trigger={<Button className="h-11 flex-1 sm:h-10 sm:flex-none">Resubmit for sign off</Button>}
          footer={<Button loading={busy} onClick={() => act("resubmit", note, `${name} resubmitted`)}>Resubmit</Button>}>
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Note for the reviewer (optional)<Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} /></label>
        </Modal>
      </div>
    );
  }
  if (!canReview) return <p className="rounded-panel border border-line px-4 py-3 text-small text-fg-muted">Waiting for a reviewer to sign off.</p>;
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t border-line bg-canvas px-4 py-3 sm:mx-0 sm:rounded-panel sm:border">
      <p className="hidden flex-1 text-small text-fg-body sm:block">{self ? "You prepared this run, so someone else must sign it off." : `Prepared by ${preparer} · waiting for your sign off`}</p>
      <Modal open={open === "return"} onOpenChange={(o) => setOpen(o ? "return" : null)} title={`Return ${name}?`} description={`${preparer} gets your reason and can resubmit.`} size="sm"
        trigger={<Button variant="secondary" disabled={self} className="h-11 flex-1 sm:h-10 sm:flex-none">Return</Button>}
        footer={<Button loading={busy} disabled={reason.trim().length < 3} disabledReason={reason.trim().length < 3 ? "Give a reason" : undefined} onClick={() => act("return", reason, `${name} returned to ${preparer}`)}>Return run</Button>}>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Reason (required)<Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} /></label>
      </Modal>
      <Modal open={open === "sign"} onOpenChange={(o) => setOpen(o ? "sign" : null)} title={`Sign off ${name}?`} description="Signed off figures are locked: they can't be edited, recomputed or deleted." size="sm"
        trigger={<Button disabled={self} disabledReason={self ? "You can't sign off a run you prepared." : undefined} className="h-11 flex-[2] sm:h-10 sm:flex-none">Approve &amp; sign off</Button>}
        footer={<Button loading={busy} onClick={() => act("sign-off", note, `${name} signed off`)}>Sign off</Button>}>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Note (optional, shown in audit)<Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} /></label>
      </Modal>
    </div>
  );
}
