import { Accordion } from "@/components/molecules/Accordion";
import { faq as landingFaq } from "@/data/content";
import { Frame, SectionHeading } from "@/components/organisms/marketing/Frame";

type QA = { q: string; a: string };

/** FAQ: title left, accordion right (first item open). Defaults to the landing FAQ. */
export function Faq({ items = landingFaq.items, title = <>Questions,<br />answered.</>, label = landingFaq.label }: { items?: QA[]; title?: React.ReactNode; label?: string }) {
  return (
    <Frame id="faq" label="FAQ">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading label={label} title={title} />
        <Accordion type="single" defaultValue={["0"]} className="border-x-0 border-b-0 rounded-none px-0" items={items.map((f, i) => ({ value: String(i), title: <span className="text-body">{f.q}</span>, content: <p className="max-w-2xl text-fg-muted">{f.a}</p> }))} />
      </div>
    </Frame>
  );
}

/** FAQ structured data for search engines. */
export const faqJsonLd = (items: QA[] = landingFaq.items) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});
