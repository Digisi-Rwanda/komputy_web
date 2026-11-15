import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { ServiceStatePill } from "@/components/atoms/StatusPill";
import { Cta } from "@/components/organisms/marketing/Cta";
import { Faq, faqJsonLd } from "@/components/organisms/marketing/Faq";
import { FeatureGrid, InputsTable, OtherServices, WorkflowSteps } from "@/components/organisms/marketing/Blocks";
import { Frame, SectionHeading } from "@/components/organisms/marketing/Frame";
import { PageHero } from "@/components/organisms/marketing/PageHero";
import { ProductWindow } from "@/components/organisms/marketing/ProductWindow";
import { WaitlistForm } from "@/components/organisms/marketing/WaitlistForm";
import { SERVICE_PAGES, type LiveServicePage, type SoonServicePage } from "@/data/services";
import { SERVICES, service } from "@/lib/services";
import type { ServiceId } from "@/types/domain";


export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = SERVICE_PAGES[slug as ServiceId];
  if (!p) return {};
  const name = service(p.id).name;
  return { title: name, description: p.sub, alternates: { canonical: `/services/${slug}` }, openGraph: { title: `${name} · Komputy`, description: p.sub, siteName: "Komputy", images: ["/opengraph-image"] } };
}

const crumbs = (id: ServiceId) => [{ label: "Services", href: "/#services" }, { label: service(id).name }];

function Live({ p }: { p: LiveServicePage }) {
  const s = service(p.id);
  return (
    <>
      <PageHero
        crumbs={crumbs(p.id)}
        eyebrow={<><ServiceStatePill state="active" /><Badge mono>{p.eyebrow}</Badge></>}
        title={p.title}
        sub={p.sub}
        actions={<><Button asChild size="lg"><Link href={`/sign-up?service=${p.id}`}>Start {s.short} trial</Link></Button><Button asChild size="lg" variant="secondary"><Link href="#workflow">View product tour</Link></Button></>}
        visual={<ProductWindow />}
      />
      <Frame id="who" label="Who it's for"><SectionHeading label="Who it's for" title="Built for the teams that sign the numbers." /><div className="mt-10"><FeatureGrid items={p.audiences} /></div></Frame>
      <Frame id="workflow" label="Workflow"><SectionHeading label="Workflow" title="A streamlined workflow." /><div className="mt-12"><WorkflowSteps steps={p.workflow} /></div></Frame>
      <Frame id="inputs" label="Inputs"><SectionHeading label="Inputs" title="Know exactly what to upload." sub="Download the templates, no sign-up needed." /><div className="mt-10"><InputsTable files={p.inputs} /></div></Frame>
      <Frame id="outputs" label="Outputs"><SectionHeading label="Outputs" title="Comprehensive outputs." /><div className="mt-10"><FeatureGrid items={p.outputs} /></div></Frame>
      <Frame id="controls" label="Controls"><SectionHeading label="Controls" title="Robust controls." /><div className="mt-10"><FeatureGrid items={p.controls} /></div></Frame>
      <Frame id="pricing" label="Pricing">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <SectionHeading label="Pricing" title={`${s.name}, ${p.priceFrom.toLowerCase()}.`} sub="Start with a free trial. Paid plans are agreed with you. Nothing is charged online." />
          <div className="ring-inner flex flex-col gap-5 rounded-panel border border-fg bg-raised p-6">
            <Badge tone="info" className="w-fit">Most common entry</Badge>
            <p className="text-h3 text-fg">{p.priceFrom}</p>
            <ul className="flex flex-col gap-2">{p.trial.map((t) => <li key={t} className="flex items-center gap-2 text-small text-fg-body"><Check aria-hidden className="size-4 text-positive" />{t}</li>)}</ul>
            <div className="flex flex-wrap gap-2">
              <Button asChild><Link href={`/sign-up?service=${p.id}`}>Start free trial</Link></Button>
              <Button asChild variant="outline"><Link href={`/contact?package=single&services=${p.id}`}>Contact sales</Link></Button>
            </div>
          </div>
        </div>
      </Frame>
      <Faq items={p.faq} title="Frequently asked questions" label="FAQ" />
      <Frame id="other" label="Other services"><SectionHeading title="Other services" /><div className="mt-8"><OtherServices exclude={p.id} /></div></Frame>
      <Cta title={p.cta.title} sub={p.cta.sub} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([{ "@context": "https://schema.org", "@type": "Product", name: `Komputy ${s.name}`, description: p.sub, offers: { "@type": "Offer", priceCurrency: "USD", price: "1200", description: p.priceFrom } }, faqJsonLd(p.faq)]) }} />
    </>
  );
}

function Soon({ p }: { p: SoonServicePage }) {
  const s = service(p.id);
  return (
    <>
      <PageHero crumbs={crumbs(p.id)} eyebrow={<><span className="inline-flex size-10 items-center justify-center rounded-card bg-surface text-fg"><Icon name={p.icon} size={20} /></span><ServiceStatePill state="coming-soon" /></>} title={p.title} sub={p.sub}>
        <WaitlistForm service={p.id} serviceName={s.name} />
      </PageHero>
      <Frame id="will-do" label="What it will do"><SectionHeading title="What it will do" sub="Everything you need, built on the data you already sign off." /><div className="mt-10"><FeatureGrid items={p.willDo} /></div></Frame>
      <Frame id="design-partner" label="Design partner">
        <div className="flex flex-wrap items-center gap-6 rounded-panel border border-line bg-raised p-8">
          <Icon name="users" size={28} className="text-fg" />
          <div className="flex-1"><p className="text-h3 text-fg">Help shape it: 30-minute call, early access.</p><p className="mt-1 text-small text-fg-muted">Be a design partner for {s.name}.</p></div>
          <Button asChild><Link href={`/contact?topic=design-partner&services=${p.id}`}>Book a call</Link></Button>
        </div>
      </Frame>
      <Frame id="other" label="Other services"><SectionHeading title="Other services" /><div className="mt-8"><OtherServices exclude={p.id} /></div></Frame>
    </>
  );
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const p = SERVICE_PAGES[slug as ServiceId];
  if (!p) notFound();
  return p.kind === "live" ? <Live p={p} /> : <Soon p={p} />;
}
