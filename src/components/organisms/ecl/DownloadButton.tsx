"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { toast } from "@/components/organisms/Toaster";

// shortcut: shows a toast instead of streaming the file; upgrade to the outputs API (signed S3 URL) when wired.
export function DownloadButton({ label, name, primary }: { label: string; name: string; primary?: boolean }) {
  return <Button size="sm" variant={primary ? "primary" : "secondary"} icon={<Download />} onClick={() => toast.success(`${name} download started`)}>{label}</Button>;
}
