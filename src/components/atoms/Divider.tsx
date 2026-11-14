import { cn } from "@/lib/cn";

export const Divider = ({ vertical, className }: { vertical?: boolean; className?: string }) => (
  <div role="separator" aria-orientation={vertical ? "vertical" : "horizontal"} className={cn("shrink-0 bg-line", vertical ? "w-px self-stretch" : "h-px w-full", className)} />
);
