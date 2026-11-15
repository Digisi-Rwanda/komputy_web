import type { Metadata } from "next";
import { Cta } from "@/components/organisms/marketing/Cta";
import { EclDeepDive, LeasesDeepDive } from "@/components/organisms/marketing/DeepDives";
import { Faq, faqJsonLd } from "@/components/organisms/marketing/Faq";
import { Hero } from "@/components/organisms/marketing/Hero";
import { HowItWorks } from "@/components/organisms/marketing/HowItWorks";
import { Manifesto } from "@/components/organisms/marketing/Manifesto";
import { PricingTeaser } from "@/components/organisms/marketing/Pricing";
import { Proof } from "@/components/organisms/marketing/Proof";
import { Services } from "@/components/organisms/marketing/LandingServices";
import { Testimonials } from "@/components/organisms/marketing/Testimonials";
import { TrustStrip } from "@/components/organisms/marketing/TrustStrip";
import { hero } from "@/data/content";

export const metadata: Metadata = {
  title: { absolute: "Ledgerline — IFRS 9 and IFRS 16 reporting, from upload to sign-off" },
  description: hero.sub,
  alternates: { canonical: "/" },
  openGraph: { title: "Ledgerline — IFRS reporting, from upload to sign-off", description: hero.sub, url: "/", type: "website", images: [{ url: "/brand/og-landing.jpg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Ledgerline — IFRS reporting, from upload to sign-off", description: hero.sub, images: ["/brand/og-landing.jpg"] },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Ledgerline",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: hero.sub,
  offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: "1200", offerCount: 3 },
  publisher: { "@type": "Organization", name: "Ledgerline", url: "https://komputy.com" },
};

// Landing `/` — section order per REDESIGN_UX_BLUEPRINT §6.1, visuals per inspiration/to_build/phase-01-landing (L0–L9).
export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, faqJsonLd()]) }} />
      <Hero />
      <TrustStrip />
      <Manifesto />
      <Services />
      <HowItWorks />
      <EclDeepDive />
      <LeasesDeepDive />
      <Proof />
      <PricingTeaser />
      <Testimonials />
      <Faq />
      <Cta />
    </>
  );
}
