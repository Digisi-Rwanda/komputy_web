import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Frame } from "@/components/organisms/marketing/Frame";
import { PageHero } from "@/components/organisms/marketing/PageHero";
import { SectionNav } from "@/components/organisms/marketing/SectionNav";
import { COMPLIANCE, DATA, PRINCIPLES, SECURITY_EMAIL, SUBPROCESSORS, SUPPORT_FLOW } from "@/data/security";

export const metadata: Metadata = { title: "Security", description: "Isolation, encryption and access you control. Our staff can't see your results without your consent.", alternates: { canonical: "/security" } };

const NAV = [
  { id: "principles", label: "Our principles" }, { id: "support-access", label: "Support access flow" }, { id: "compliance", label: "Compliance roadmap" },
  { id: "data", label: "Data" }, { id: "subprocessors", label: "Subprocessors" }, { id: "vulnerability", label: "Report a vulnerability" },
];

const H = ({ id, children }: { id: string; children: React.ReactNode }) => <h2 id={id} className="scroll-mt-24 text-h3 tracking-[-0.02em]">{children}</h2>;

export default function SecurityPage() {
  return (
    <>
      <PageHero eyebrow={<span className="label-mono">Security</span>} title="Your numbers stay yours." sub="Isolation, encryption and access you control." />
      <Frame label="Security details" inner="pt-12">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          <SectionNav items={NAV} />
          <div className="flex min-w-0 flex-col gap-16">
            <section className="flex flex-col gap-6"><H id="principles">Our principles</H>
              <ul className="divide-y divide-line rounded-panel border border-line">
                {PRINCIPLES.map((p) => <li key={p.title} className="flex gap-4 p-5"><Icon name={p.icon} className="mt-0.5 shrink-0 text-fg-muted" /><p className="text-small text-fg-body"><span className="text-fg">{p.title}</span> — {p.body}</p></li>)}
              </ul>
            </section>
            <section className="flex flex-col gap-6"><H id="support-access">Support access flow</H>
              <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {SUPPORT_FLOW.map((s, i) => <li key={s.title} className="flex flex-col gap-2 rounded-panel border border-line p-5"><span className="font-mono text-micro text-fg-muted">{i + 1}</span><span className="text-small text-fg">{s.title}</span><span className="text-micro text-fg-muted">{s.body}</span></li>)}
              </ol>
            </section>
            <section className="flex flex-col gap-6"><H id="compliance">Compliance roadmap</H>
              <table className="w-full text-small"><caption className="sr-only">Compliance roadmap</caption>
                <thead><tr className="border-b border-line text-fg-muted"><th scope="col" className="py-2 text-left font-normal">Item</th><th scope="col" className="py-2 text-right font-normal">Status</th></tr></thead>
                <tbody>{COMPLIANCE.map((c) => <tr key={c.item} className="border-b border-line"><th scope="row" className="py-3 text-left font-normal text-fg">{c.item}</th><td className="py-3 text-right"><StatusPill tone={c.tone}>{c.status}</StatusPill></td></tr>)}</tbody>
              </table>
            </section>
            <section className="flex flex-col gap-6"><H id="data">Data</H>
              <dl className="grid gap-4 sm:grid-cols-2">{DATA.map(([k, v]) => <div key={k} className="rounded-panel border border-line p-5"><dt className="text-small text-fg">{k}</dt><dd className="mt-1 text-small text-fg-muted">{v}</dd></div>)}</dl>
            </section>
            <section className="flex flex-col gap-6"><H id="subprocessors">Subprocessors</H>
              <table className="w-full text-small"><caption className="sr-only">Subprocessors</caption>
                <thead><tr className="border-b border-line text-fg-muted">{["Provider", "Purpose", "Region"].map((h) => <th key={h} scope="col" className="py-2 text-left font-normal">{h}</th>)}</tr></thead>
                <tbody>{SUBPROCESSORS.map((s) => <tr key={s.provider} className="border-b border-line"><th scope="row" className="py-3 text-left font-normal text-fg">{s.provider}</th><td className="py-3 text-fg-body">{s.purpose}</td><td className="py-3 text-fg-body">{s.region}</td></tr>)}</tbody>
              </table>
              <Link href="/legal/dpa" className="inline-flex w-fit items-center gap-1 text-small text-link hover:underline">Data processing agreement<ArrowRight aria-hidden className="size-4" /></Link>
            </section>
            <section className="bg-blueprint flex flex-col gap-3 rounded-panel border border-line bg-raised p-8"><H id="vulnerability">Report a vulnerability</H>
              <p className="text-small text-fg-muted">Help us keep Ledgerline secure. Report vulnerabilities responsibly to <span className="select-all font-mono text-fg">{SECURITY_EMAIL}</span>. We reply within 2 business days.</p>
            </section>
          </div>
        </div>
      </Frame>
    </>
  );
}
