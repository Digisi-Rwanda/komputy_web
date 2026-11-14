import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";
import { pricing } from "@/data/content";
import { publishedPlans } from "@/server/dal/catalog-public";
import { Frame, SectionHeading } from "@/components/organisms/marketing/Frame";

/** L7 pricing teaser: 3 packages, Dual featured; all CTAs go to sales (no card payment in-app). */
export async function PricingTeaser() {
  const plans = await publishedPlans();
  return (
    <Frame id="pricing" label="Pricing" inner="overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[60%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(0_114_245/0.18),rgb(110_61_245/0.08),transparent)] blur-2xl" />
      <SectionHeading label={pricing.label} title={<>{pricing.title[0]}<br />{pricing.title[1]}</>} className="relative" />
      <ul className="relative mt-12 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <li key={p.name} className={cn("relative flex flex-col gap-3 rounded-panel border p-6", p.featured ? "border-fg bg-raised" : "border-line")}>
            {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-micro font-medium text-primary-fg">Most popular</span>}
            <h3 className="text-h4">{p.name}</h3>
            <p className="text-h3 font-medium tracking-[-0.02em] text-fg">{p.price} <span className="text-small font-normal text-fg-muted">{p.unit}</span></p>
            <p className="text-micro text-fg-muted">{p.detail}</p>
            <Button asChild variant={p.featured ? "primary" : "outline"} className="mt-3 w-full"><Link href="/contact">{p.cta}</Link></Button>
          </li>
        ))}
      </ul>
      <p className="relative mt-6 flex flex-wrap items-center gap-x-3 text-small text-fg-muted">
        {pricing.note}
        <Link href={pricing.link.href} className="inline-flex items-center gap-1 text-link hover:underline">{pricing.link.label}<ArrowRight aria-hidden className="size-4" /></Link>
      </p>
    </Frame>
  );
}
