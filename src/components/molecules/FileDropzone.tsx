"use client";
import { useRef, useState, type ReactNode } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ProgressBar } from "@/components/molecules/Progress";
import { cn } from "@/lib/cn";

export type DropzoneState = { kind: "idle" } | { kind: "uploading"; file: File; progress: number } | { kind: "done"; file: File };

interface Props {
  title: string;
  hint?: ReactNode;
  accept?: string;
  maxMb?: number;
  state?: DropzoneState;
  onFile: (f: File) => void;
  onRemove?: () => void;
  tip?: ReactNode;
}

const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

/** Drag-and-drop file input (DS4). Validates type and size before calling onFile; shows upload progress. */
export function FileDropzone({ title, hint, accept = ".xlsx", maxMb = 50, state = { kind: "idle" }, onFile, onRemove, tip }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string>();

  const take = (f?: File) => {
    if (!f) return;
    if (!accept.split(",").some((ext) => f.name.toLowerCase().endsWith(ext.trim()))) return setError(`Only ${accept} files are accepted.`);
    if (f.size > maxMb * 1024 * 1024) return setError(`${f.name} is ${mb(f.size)}. The limit is ${maxMb} MB.`);
    setError(undefined);
    onFile(f);
  };

  if (state.kind !== "idle") {
    return (
      <div className="flex items-center gap-4 rounded-panel border border-line p-4">
        <span className="inline-flex size-10 items-center justify-center rounded-md bg-positive-tint text-positive"><FileSpreadsheet className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-small text-fg">{state.file.name}</p>
          {state.kind === "uploading" ? (
            <ProgressBar value={state.progress} label={`Uploading ${state.file.name}`} className="mt-2" />
          ) : (
            <p className="text-micro text-fg-muted">{mb(state.file.size)} · uploaded</p>
          )}
        </div>
        {onRemove && <Button variant="ghost" size="icon-sm" aria-label="Remove file" onClick={onRemove}><X /></Button>}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}
      className={cn("flex flex-col items-center justify-center gap-3 rounded-panel border border-dashed px-6 py-10 text-center transition-colors duration-fast", over ? "border-accent bg-info-tint" : error ? "border-negative" : "border-line-strong")}
    >
      <Upload aria-hidden className="size-7 text-fg-muted" />
      <p className="text-h4 text-fg">{title}</p>
      {hint && <p className="max-w-sm text-small text-fg-muted">{hint}</p>}
      <Button size="sm" onClick={() => input.current?.click()}>Browse files</Button>
      <input ref={input} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-label={title} onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
      {error && <p role="alert" className="text-micro text-negative">{error}</p>}
      {tip && <p className="text-micro text-fg-muted">{tip}</p>}
    </div>
  );
}
