import { Avatar } from "@/components/atoms/Avatar";
import { FadeIn } from "@/components/atoms/FadeIn";
import { testimonials } from "@/data/content";
import { Frame, SectionHeading } from "@/components/organisms/marketing/Frame";

/** L7: one featured quote + three small ones. Initials avatars (no stock photos). */
export function Testimonials() {
  const f = testimonials.featured;
  return (
    <Frame id="customers" label="Testimonials">
      <SectionHeading label={testimonials.label} title={testimonials.title} />
      <FadeIn>
        <figure className="mt-12 grid gap-8 rounded-panel border border-line p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-center">
          <div aria-hidden className="bg-blueprint ring-inner flex size-40 items-center justify-center rounded-panel bg-raised font-serif text-[64px] text-fg">{f.initials}</div>
          <div className="flex flex-col gap-5">
            <blockquote className="text-[22px] leading-snug tracking-[-0.02em] text-fg sm:text-h3">“{f.quote}”</blockquote>
            <figcaption className="text-small text-fg-muted"><span className="text-fg-body">{f.name}</span> · {f.role}</figcaption>
          </div>
        </figure>
      </FadeIn>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {testimonials.others.map((t, i) => (
          <li key={t.name}>
            <FadeIn delay={i * 80}>
              <figure className="flex h-full gap-4 rounded-panel border border-line p-5">
                <Avatar initials={t.initials} size="lg" />
                <div className="flex flex-col gap-3">
                  <blockquote className="text-small text-fg">“{t.quote}”</blockquote>
                  <figcaption className="text-micro text-fg-muted">{t.name} · {t.role}</figcaption>
                </div>
              </figure>
            </FadeIn>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
