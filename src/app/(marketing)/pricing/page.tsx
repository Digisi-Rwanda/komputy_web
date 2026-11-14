import type { Metadata } from "next";
import { Comparison, PlanCards } from "@/components/organisms/marketing/PricingPlans";
import { Cta } from "@/components/organisms/marketing/Cta";
import { Faq, faqJsonLd } from "@/components/organisms/marketing/Faq";
import { Frame, SectionHeading } from "@/components/organisms/marketing/Frame";
import { PageHero } from "@/components/organisms/marketing/PageHero";
import { QuoteCalculator } from "@/components/organisms/marketing/QuoteCalculator";
import { PRICING_FAQ } from "@/data/pricing";

export const metadata: Metadata = { title: "Pricing", description: "Start with one service, add the rest when you need them. Free 14-day trial; packages agreed with you.", alternates: { canonical: "/pricing" } };

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow={<span className="label-mono">Pricing</span>} title="Transparent pricing for every organisation." sub="Start with one service, add the rest when you need them. Every plan starts with a free 14-day trial — no card required." />
      <Frame id="plans" label="Packages" inner="pt-12"><PlanCards /></Frame>
      <Frame id="calculator" label="Build your package"><SectionHeading label="Calculator" title="Build your package" sub="Select the services and scale that fit your organisation." /><div className="mt-10"><QuoteCalculator /></div></Frame>
      <Frame id="compare" label="Compare packages"><SectionHeading title="Compare features" sub="See what's included in each package." /><div className="mt-10"><Comparison /></div></Frame>
      <Faq items={PRICING_FAQ} title="Pricing questions" label="FAQ" />
      <Cta title="Ready to simplify your IFRS reporting?" sub="Start your free trial or talk to us for a tailored plan." />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(PRICING_FAQ)) }} />
    </>
  );
}
