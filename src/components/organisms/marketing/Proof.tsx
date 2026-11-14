import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { MetaChip } from "@/components/atoms/Chip";
import { FadeIn } from "@/components/atoms/FadeIn";
import { proof } from "@/data/content";
import { Frame } from "@/components/organisms/marketing/Frame";

/** L5 bottom: audit & control proof cards + security line (blueprint §6.1 items 7 and 9). */
export function Proof() {
  return (
    <Frame id="audit" label="Audit and control">
      <h2 className="max-w-3xl text-[32px] leading-[1.15] tracking-[-0.03em] md:text-h1">{proof.title}</h2>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {proof.cards.map((c, i) => (
          <li key={c.title}>
            <FadeIn delay={i * 80} className="ring-inner flex h-full flex-col gap-3 rounded-panel border border-line bg-raised p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-card bg-info-tint text-link"><Icon name={c.icon} size={20} /></span>
              <h3 className="text-h4">{c.title}</h3>
              <p className="text-small text-fg-muted">{c.body}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {"chips" in c && c.chips?.map((ch) => <MetaChip key={ch}>{ch}</MetaChip>)}
                {"link" in c && c.link && <Link href={c.link.href} className="inline-flex items-center gap-1 text-small text-link hover:underline">{c.link.label}<ArrowRight aria-hidden className="size-4" /></Link>}
              </div>
            </FadeIn>
          </li>
        ))}
      </ul>
      <p className="mt-8 flex items-start gap-3 rounded-card border border-line px-5 py-4 text-small text-fg-body">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-positive" />
        <span>{proof.security} <Link href="/security" className="text-link hover:underline">Read about security →</Link></span>
      </p>
    </Frame>
  );
}
