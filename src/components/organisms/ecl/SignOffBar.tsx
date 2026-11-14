"use client";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Textarea } from "@/components/atoms/Textarea";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";

const ME = "Aline Mugisha";

/** LM3.2–3.4: sticky Return / Approve & sign off for a run awaiting review. Modals become bottom sheets on phones. */
export function SignOffBar({ id, preparer }: { id: string; preparer: string }) {
  const [state, setState] = useState<"open" | "signed" | "returned">("open");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const self = preparer === ME;
  if (state !== "open") return (
    <div className="flex flex-col items-center gap-3 rounded-panel border border-line p-8 text-center">
      <CheckCircle2 className={state === "signed" ? "size-10 text-positive" : "size-10 text-fg-muted"} />
      <p className="text-h4 text-fg">{state === "signed" ? "Signed off · 12 Nov 10:02" : `Returned to ${preparer}`}</p>
      <Link href="/home" className="text-small text-link hover:underline">Back to inbox</Link>
    </div>
  );
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-panel sm:border">
      <p className="hidden flex-1 text-small text-fg-body sm:block">{self ? "You prepared this run, so someone else must sign it off." : `Prepared by ${preparer} · waiting for your sign-off`}</p>
      <Modal title={`Return ${id}?`} description={`${preparer} gets your reason and can resubmit.`} size="sm" trigger={<Button variant="secondary" className="h-11 flex-1 sm:h-10 sm:flex-none">Return</Button>}
        footer={<Button disabled={reason.trim().length < 5} disabledReason={reason.trim().length < 5 ? "Give a reason" : undefined} onClick={() => { setState("returned"); toast(`${id} returned to ${preparer}`); }}>Return run</Button>}>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Reason (required)<Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></label>
      </Modal>
      <Modal title={`Sign off ${id}?`} description="Signed off runs can't be edited." size="sm" trigger={<Button disabled={self} disabledReason={self ? "You can't sign off a run you prepared." : undefined} className="h-11 flex-[2] sm:h-10 sm:flex-none">Approve &amp; sign off</Button>}
        footer={<Button onClick={() => { setState("signed"); toast.success(`${id} signed off`); }}>Sign off</Button>}>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Note (optional, shown in audit)<Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></label>
      </Modal>
    </div>
  );
}
