"use client";
import { Download, Link2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { toast } from "@/components/organisms/Toaster";
import { download, toCsv } from "@/lib/csv";

export function ExportMenu({ name, rows }: { name: string; rows: (string | number)[][] }) {
  return <DropdownMenu trigger={<Button size="sm" variant="secondary" icon={<Download />}>Export</Button>} items={[
    { label: "CSV", onSelect: () => download(`${name}.csv`, toCsv(rows)) },
    // shortcut: XLSX is generated server-side in the real app; here we hand over the same data as CSV.
    { label: "XLSX", onSelect: () => { download(`${name}.csv`, toCsv(rows)); toast("XLSX export is produced by the server; CSV downloaded for now."); } },
  ]} />;
}

export function CopyLink() {
  return <Button size="sm" variant="secondary" icon={<Link2 />} onClick={() => { void navigator.clipboard?.writeText(location.href).then(() => toast.success("Loan link copied")).catch(() => toast.error("Couldn't copy the link")); }}>Copy loan link</Button>;
}
