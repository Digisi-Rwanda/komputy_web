"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { ConfirmDialog } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { deleteRun, rerunRun } from "@/lib/actions/ecl";

export function RunActions({ id, name, canDelete, canRerun }: { id: string; name: string; canDelete: boolean; canRerun: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [, start] = useTransition();
  const rerun = () => start(async () => {
    const r = await rerunRun(id);
    if (!r.ok) { toast.error(r.error); return; }
    toast.success("Rerun created with the same inputs"); router.push(`/ecl/runs/new/review?run=${r.data.fullId}`);
  });
  return (
    <>
      <DropdownMenu trigger={<IconButton label={`More actions for ${name}`} variant="secondary"><Icon name="more" /></IconButton>} items={[
        ...(canRerun ? [{ label: "Rerun as new version", onSelect: rerun }] : []),
        { label: "Copy link", onSelect: () => { void navigator.clipboard?.writeText(location.href); toast.success("Link copied"); } },
        ...(canDelete ? [{ label: "Delete run", danger: true, separatorBefore: true, onSelect: () => setConfirm(true) }] : []),
      ]} />
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={`Delete ${name}?`} description="It's removed from lists but kept for audit." confirmLabel="Delete"
        onConfirm={async () => { const r = await deleteRun(id); if (!r.ok) { toast.error(r.error); return; } toast.success(`${name} deleted`); router.push("/ecl/runs"); }} />
    </>
  );
}
