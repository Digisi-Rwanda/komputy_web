import { Search } from "lucide-react";
import { Kbd } from "@/components/atoms/Kbd";
import { cn } from "@/lib/cn";

/** Top-bar search trigger; opens the command palette (⌘K). */
export function SearchPill({ placeholder = "Search runs, loans, leases…", onClick, className }: { placeholder?: string; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-keyshortcuts="Meta+K" className={cn("flex h-9 w-full max-w-md items-center gap-2 rounded-full bg-surface px-4 text-small text-fg-muted transition-colors hover:bg-surface-active hover:text-fg-body", className)}>
      <Search aria-hidden className="size-4" />
      <span className="flex-1 truncate text-left">{placeholder}</span>
      <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
    </button>
  );
}
