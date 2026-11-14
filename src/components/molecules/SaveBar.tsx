import { Button } from "@/components/atoms/Button";

/** Sticky footer for forms with unsaved edits (E7/E8). */
export function SaveBar({ changes, onDiscard, onSave, saveLabel = "Save changes", note }: { changes: number; onDiscard: () => void; onSave: () => void; saveLabel?: string; note?: string }) {
  return (
    <div className="glass sticky bottom-4 z-[var(--z-sticky)] flex flex-wrap items-center gap-3 rounded-full border border-line py-2 pl-5 pr-2">
      <span className="text-small text-fg" aria-live="polite">{changes ? `${changes} unsaved change${changes > 1 ? "s" : ""}` : "All changes saved"}</span>
      {note && <span className="hidden text-micro text-fg-muted md:inline">{note}</span>}
      <span className="ml-auto flex gap-2"><Button variant="ghost" size="sm" disabled={!changes} onClick={onDiscard}>Discard</Button><Button size="sm" disabled={!changes} onClick={onSave}>{saveLabel}</Button></span>
    </div>
  );
}
