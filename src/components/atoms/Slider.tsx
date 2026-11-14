"use client";
import * as R from "@radix-ui/react-slider";
import { cn } from "@/lib/cn";

export function Slider({ className, label, ...rest }: R.SliderProps & { label: string }) {
  const thumbs = (rest.value ?? rest.defaultValue ?? [0]).length;
  return (
    <R.Root className={cn("relative flex h-5 w-full touch-none items-center select-none", className)} {...rest}>
      <R.Track className="relative h-1 grow overflow-hidden rounded-full bg-surface-active">
        <R.Range className="absolute h-full bg-accent" />
      </R.Track>
      {Array.from({ length: thumbs }, (_, i) => (
        <R.Thumb key={i} aria-label={label} className="block size-4 rounded-full border-2 border-accent bg-white outline-none focus-visible:ring-4 focus-visible:ring-info-tint" />
      ))}
    </R.Root>
  );
}
