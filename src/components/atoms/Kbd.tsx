import { cn } from "@/lib/cn";

export const Kbd = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong px-1 font-mono text-[11px] font-normal text-fg-muted", className)}>{children}</kbd>
);
