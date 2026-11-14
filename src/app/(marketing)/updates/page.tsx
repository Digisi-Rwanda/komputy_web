import type { Metadata } from "next";
import { Suspense } from "react";
import { Rss } from "lucide-react";
import { NewsletterForm } from "@/components/molecules/NewsletterForm";
import { Frame } from "@/components/organisms/marketing/Frame";
import { PageHero } from "@/components/organisms/marketing/PageHero";
import { UpdatesTimeline } from "@/components/organisms/marketing/UpdatesTimeline";
import { UPDATES } from "@/data/updates";

export const metadata: Metadata = { title: "Updates", description: "What changed, and why it matters for your numbers.", alternates: { canonical: "/updates", types: { "application/rss+xml": "/updates/rss.xml" } } };

export default function UpdatesPage() {
  return (
    <>
      <PageHero eyebrow={<span className="label-mono">Updates</span>} title="Updates" sub="What changed, and why it matters for your numbers.">
        <div className="flex flex-wrap items-center gap-4">
          <NewsletterForm id="updates-email" placeholder="Subscribe for product updates" />
          <a href="/updates/rss.xml" className="inline-flex items-center gap-1.5 text-small text-fg-muted hover:text-fg"><Rss aria-hidden className="size-4" />RSS</a>
        </div>
      </PageHero>
      <Frame label="Changelog" inner="pt-12">
        <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><UpdatesTimeline updates={UPDATES} /></Suspense>
      </Frame>
    </>
  );
}
