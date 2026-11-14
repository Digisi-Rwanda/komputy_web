import type { Metadata } from "next";
import { Suspense } from "react";
import { BookOpen, Headphones, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/organisms/marketing/ContactForm";
import { Frame, SectionHeading } from "@/components/organisms/marketing/Frame";
import { PageHero } from "@/components/organisms/marketing/PageHero";
import { SERVICE_IDS } from "@/lib/validation";

export const metadata: Metadata = { title: "Talk to us", description: "Tell us what you need. We'll come back within one business day.", alternates: { canonical: "/contact" } };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Form({ searchParams }: { searchParams: PageProps<"/contact">["searchParams"] }) {
  const sp = await searchParams;
  const services = (one(sp.services) ?? one(sp.waitlist) ?? "").split(",").filter((s) => (SERVICE_IDS as readonly string[]).includes(s));
  return <ContactForm prefill={{ pkg: one(sp.package), services, size: one(sp.size)?.slice(0, 200), topic: one(sp.waitlist) ? "waitlist" : one(sp.topic), range: one(sp.range)?.match(/^\d+-\d+$/)?.[0] }} />;
}

const WAYS = [
  { icon: Headphones, title: "Sales", body: "Talk to our team about your needs.", contact: "sales@ledgerline.app" },
  { icon: BookOpen, title: "Support (existing customers)", body: "Open the Help menu in the app.", contact: "support@ledgerline.app" },
  { icon: ShieldCheck, title: "Security", body: "Report a vulnerability.", contact: "security@ledgerline.app" },
];

export default function ContactPage({ searchParams }: PageProps<"/contact">) {
  return (
    <>
      <PageHero eyebrow={<span className="label-mono">Contact</span>} title="Talk to us" sub="Tell us what you need. We'll come back within one business day." />
      <Frame id="form" label="Request form" inner="pt-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <figure className="bg-blueprint ring-inner flex flex-col justify-end gap-4 rounded-panel border border-line bg-raised p-8 lg:min-h-[420px]">
            <blockquote className="text-h3 leading-snug text-fg">“Ledgerline replied in four hours and had us on a trial by lunch.”</blockquote>
            <figcaption className="text-small text-fg-muted">— Lakeshore Microfinance</figcaption>
          </figure>
          <Suspense fallback={<div className="skeleton h-[560px] rounded-panel" />}><Form searchParams={searchParams} /></Suspense>
        </div>
      </Frame>
      <Frame id="other-ways" label="Other ways">
        <SectionHeading title="Other ways" />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {WAYS.map((w) => (
            <li key={w.title} className="flex gap-4 rounded-panel border border-line p-5">
              <w.icon aria-hidden className="size-5 shrink-0 text-fg-muted" />
              <div><p className="text-small text-fg">{w.title}</p><p className="text-micro text-fg-muted">{w.body}</p><p className="mt-2 font-mono text-micro text-link select-all">{w.contact}</p></div>
            </li>
          ))}
        </ul>
      </Frame>
    </>
  );
}
