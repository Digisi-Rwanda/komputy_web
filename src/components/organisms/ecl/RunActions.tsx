"use client";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { toast } from "@/components/organisms/Toaster";

export function RunActions({ id, draft }: { id: string; draft: boolean }) {
  const router = useRouter();
  return (
    <DropdownMenu trigger={<IconButton label={`More actions for ${id}`} variant="secondary"><Icon name="more" /></IconButton>} items={[
      { label: "Rerun as new version", onSelect: () => router.push(`/ecl/runs/new?from=${id}`) },
      { label: "Duplicate as new run", onSelect: () => router.push(`/ecl/runs/new?from=${id}`) },
      { label: "Copy link", onSelect: () => { void navigator.clipboard?.writeText(location.href); toast.success("Link copied"); } },
      ...(draft ? [{ label: "Delete draft", danger: true, separatorBefore: true, onSelect: () => { toast(`${id} deleted`); router.push("/ecl/runs"); } }] : []),
    ]} />
  );
}
