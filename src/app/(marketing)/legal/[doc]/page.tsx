import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { SegmentedTabs } from "@/components/molecules/Tabs";
import { Banner } from "@/components/molecules/Banner";
import { Frame } from "@/components/organisms/marketing/Frame";
import { PageHero } from "@/components/organisms/marketing/PageHero";
import { SectionNav } from "@/components/organisms/marketing/SectionNav";
import { PrintButton } from "@/components/organisms/marketing/PrintButton";
import { LEGAL, legalDoc } from "@/data/legal";

export const generateStaticParams = () => LEGAL.map((d) => ({ doc: d.slug }));

export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const d = legalDoc((await params).doc);
  return d ? { title: d.title, description: d.intro, alternates: { canonical: `/legal/${d.slug}` } } : {};
}

export default async function LegalPage({ params }: PageProps<"/legal/[doc]">) {
  const d = legalDoc((await params).doc);
  if (!d) notFound();
  return (
    <>
      <PageHero eyebrow={<span className="label-mono">Legal</span>} title={d.title} sub={`Last updated ${d.updated} · Version ${d.version}`}>
        <div className="print:hidden"><SegmentedTabs label="Legal documents" active={`/legal/${d.slug}`} items={LEGAL.map((x) => ({ label: x.short, href: `/legal/${x.slug}` }))} /></div>
      </PageHero>
      <Frame label={d.title} inner="pt-12">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          <div className="print:hidden"><SectionNav numbered label="Contents" items={d.sections.map((s) => ({ id: s.id, label: s.title }))} /></div>
          <article className="flex max-w-3xl flex-col gap-10">
            <Banner tone="warning" className="print:hidden">Draft: pending legal review before launch.</Banner>
            <p className="text-body text-fg-muted">{d.intro}</p>
            {d.sections.map((s, i) => (
              <section key={s.id} className="flex flex-col gap-4">
                <h2 id={s.id} className="scroll-mt-24 text-h3">{i + 1}. {s.title}</h2>
                {s.body.map((b) => <p key={b} className="text-small leading-relaxed text-fg-body">{b}</p>)}
                {s.table && (
                  <div className="relative overflow-x-auto rounded-card border border-line"><table className="w-full min-w-[480px] text-small"><caption className="sr-only">{s.title}</caption>
                    <thead><tr className="border-b border-line text-fg-muted">{s.table.head.map((h) => <th key={h} scope="col" className="px-4 py-2 text-left font-normal">{h}</th>)}</tr></thead>
                    <tbody>{s.table.rows.map((r) => <tr key={r[0]} className="border-b border-line last:border-0">{r.map((c, j) => <td key={j} className={j ? "px-4 py-2.5 text-fg-body" : "px-4 py-2.5 text-fg"}>{c}</td>)}</tr>)}</tbody>
                  </table></div>
                )}
                {s.callout && <p className="flex items-center gap-3 rounded-card border border-accent/40 bg-info-tint px-4 py-3 text-small text-fg"><Info aria-hidden className="size-4 text-link" />{s.callout}</p>}
              </section>
            ))}
            <PrintButton />
          </article>
        </div>
      </Frame>
    </>
  );
}
