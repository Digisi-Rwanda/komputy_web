import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { ServiceStatePill } from "@/components/atoms/StatusPill";
import { FadeIn } from "@/components/atoms/FadeIn";
import { SERVICES } from "@/lib/services";
import { cn } from "@/lib/cn";
import { serviceCards, servicesSection } from "@/data/content";
import { Frame, SectionHeading, Ticks } from "@/components/organisms/marketing/Frame";

/** L3: six service cards on a ruled grid; live = Explore, coming soon = dimmed + Join waitlist. */
export function Services() {
  return (
    <Frame id="services" label="Services">
      <SectionHeading align="center" label={servicesSection.label} title={servicesSection.title} sub={servicesSection.sub} className="mx-auto" />
      <ul className="mt-14 grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s, i) => {
          const c = serviceCards[s.id];
          return (
            <li key={s.id} className="bg-canvas">
              <FadeIn delay={i * 60} className="h-full">
                <Link href={s.live ? `/services/${s.id}` : `/contact?waitlist=${s.id}`} className={cn("group flex h-full flex-col gap-4 p-6 transition-colors hover:bg-raised sm:p-7", !s.live && "opacity-70 hover:opacity-100")}>
                  <span className="flex items-start justify-between">
                    <span className="ring-inner inline-flex size-10 items-center justify-center rounded-card bg-surface text-fg"><Icon name={c.icon} size={20} /></span>
                    <ServiceStatePill state={s.live ? "active" : "coming-soon"} />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-h4 text-fg">{s.name}{s.standard && <span className="text-fg-muted"> · {s.standard}</span>}</span>
                    <span className="text-small text-fg-muted">{s.description}</span>
                  </span>
                  <Ticks items={c.ticks} />
                  <span className={cn("mt-auto inline-flex items-center gap-1 text-small", s.live ? "text-link" : "text-fg-body")}>
                    {c.cta}<ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </FadeIn>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}
