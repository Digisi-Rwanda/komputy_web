import { cn } from "@/lib/cn";

const sizes = { xs: "size-5 text-[8px] tracking-normal", sm: "size-6 text-[9px] tracking-normal", md: "size-8 text-micro", lg: "size-10 text-small", xl: "size-20 text-h3" } as const;

/** Initials avatar. `square` for workspace tiles. */
export function Avatar({ initials, size = "md", square, src, className }: { initials: string; size?: keyof typeof sizes; square?: boolean; src?: string; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden bg-surface-active font-medium text-fg", square ? "rounded-md" : "rounded-full", sizes[size], className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny user avatars, any origin */}
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials}
    </span>
  );
}

/** Overlapping avatars with "+n". */
export function AvatarStack({ people, max = 3 }: { people: { initials: string }[]; max?: number }) {
  return (
    <span className="flex -space-x-2">
      {people.slice(0, max).map((p, i) => <Avatar key={i} initials={p.initials} size="sm" className="ring-2 ring-canvas" />)}
      {people.length > max && <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface text-[10px] text-fg-muted ring-2 ring-canvas">+{people.length - max}</span>}
    </span>
  );
}
