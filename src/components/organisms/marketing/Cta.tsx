import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { WordReveal } from "@/components/atoms/WordReveal";
import { FadeIn } from "@/components/atoms/FadeIn";
import { cta } from "@/data/content";

/** L8 (v1): concentric-ring backdrop, big headline, two CTAs, three ticked cards. */
export function Cta({ title = cta.title, sub = cta.sub, checks = cta.checks }: { title?: string; sub?: string; checks?: string[] }) {
  return (
    <section aria-label="Get started" className="relative overflow-hidden border-t border-line">
      <div className="relative mx-auto flex max-w-site flex-col items-center gap-7 border-x border-line px-4 py-24 text-center sm:px-8 lg:py-32">
        <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(closest-side,#000,transparent)]">
          {[1, 2, 3, 4].map((r) => <span key={r} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line" style={{ width: r * 260, height: r * 260 }} />)}
          <span className="absolute left-1/2 top-0 h-56 w-[50%] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
        </div>
        <WordReveal as="h2" text={title} className="relative max-w-3xl text-[40px] font-medium leading-[1.08] tracking-[-0.04em] text-fg md:text-display" />
        <FadeIn><p className="relative text-body-lg text-fg-muted">{sub}</p></FadeIn>
        <FadeIn delay={150} className="relative flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link href="/sign-up">Start free trial</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/contact">Talk to sales</Link></Button>
        </FadeIn>
        <ul className="relative mt-6 grid w-full max-w-4xl gap-3 sm:grid-cols-3">
          {checks.map((c) => (
            <li key={c} className="glass flex items-center gap-3 rounded-panel border border-line p-4 text-left text-small text-fg">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong"><Check aria-hidden className="size-3.5" /></span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
