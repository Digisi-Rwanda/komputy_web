import { cn } from "@/lib/cn";

// Soft colour wash behind the hero product window, drawn in CSS for the light theme (blue, violet, pink, warm gold
// on the canvas). Two layers crossfade slowly for gentle motion; reduced motion keeps the first one still.
const A =
  "radial-gradient(40% 55% at 18% 70%, rgb(0 114 245 / 0.22), transparent 70%), radial-gradient(35% 50% at 52% 85%, rgb(110 61 245 / 0.16), transparent 70%), radial-gradient(38% 55% at 85% 75%, rgb(245 201 122 / 0.35), transparent 70%)";
const B =
  "radial-gradient(42% 55% at 25% 80%, rgb(110 61 245 / 0.18), transparent 70%), radial-gradient(36% 50% at 60% 70%, rgb(240 168 216 / 0.28), transparent 70%), radial-gradient(40% 55% at 80% 85%, rgb(0 114 245 / 0.18), transparent 70%)";

export function HeroGradient({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("grain absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0" style={{ backgroundImage: A }} />
      <div
        className="absolute inset-0 opacity-0 motion-safe:animate-hero-drift"
        style={{ backgroundImage: B }}
      />
    </div>
  );
}
