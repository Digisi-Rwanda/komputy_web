import Image from "next/image";
import { cn } from "@/lib/cn";

// The original is a live Framer WebGL shader; these are two 2× stills captured from it, crossfaded to imitate its motion.
// shortcut: crossfade of two stills, not the real shader; upgrade to a WebGL shader if the hero needs true flowing motion.
export function HeroGradient({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("grain absolute inset-0 overflow-hidden", className)}>
      <Image src="/textures/hero-gradient-a.webp" alt="" fill priority sizes="100vw" className="object-cover" />
      <Image src="/textures/hero-gradient-b.webp" alt="" fill sizes="100vw" className="object-cover opacity-0 motion-safe:animate-hero-drift" />
    </div>
  );
}
