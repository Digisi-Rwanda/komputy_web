import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { AnnouncementPill } from "@/components/molecules/AnnouncementPill";
import { HeroGradient } from "@/components/atoms/HeroGradient";
import { WordReveal } from "@/components/atoms/WordReveal";
import { FadeIn } from "@/components/atoms/FadeIn";
import { hero } from "@/data/content";
import { ProductWindow } from "@/components/organisms/marketing/ProductWindow";

/** L1: announcement, word-reveal headline, CTAs, trial ticks, then the live product window over the gradient bloom. */
export function Hero() {
  return (
    <section aria-label="Introduction" className="relative overflow-hidden">
      <div className="relative mx-auto max-w-site border-x border-line">
        <div aria-hidden className="bg-blueprint fade-y absolute inset-0 opacity-50" />
        <div className="relative flex flex-col items-center gap-6 px-4 pb-14 pt-16 text-center sm:px-8 md:pt-24">
          <FadeIn><AnnouncementPill tag={hero.announcement.tag} href={hero.announcement.href}>{hero.announcement.text}</AnnouncementPill></FadeIn>
          <WordReveal text={hero.title} className="max-w-4xl text-[40px] font-medium leading-[1.08] tracking-[-0.04em] text-fg sm:text-[52px] md:text-display" />
          <FadeIn delay={250}><p className="max-w-2xl text-body text-fg-muted md:text-body-lg">{hero.sub}</p></FadeIn>
          <FadeIn delay={350} className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href={hero.primary.href}>{hero.primary.label}</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href={hero.secondary.href}>{hero.secondary.label}</Link></Button>
          </FadeIn>
          <FadeIn delay={450}>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-micro text-fg-muted">
              {hero.checks.map((c) => <li key={c} className="flex items-center gap-1.5"><span aria-hidden className="text-positive">✓</span>{c}</li>)}
            </ul>
          </FadeIn>
        </div>
        <div className="relative px-3 pb-0 sm:px-8 lg:px-12">
          <div aria-hidden className="absolute inset-x-0 bottom-0 top-16 overflow-hidden opacity-90 [mask-image:radial-gradient(70%_70%_at_50%_60%,#000_40%,transparent_100%)]"><HeroGradient /></div>
          <ProductWindow />
        </div>
      </div>
    </section>
  );
}
