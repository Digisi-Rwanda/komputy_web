import { Icon } from "@/components/atoms/Icon";
import { trust } from "@/data/content";

/** Standards and controls strip in ruled cells (Monitor's logo strip, tailored to compliance signals). */
export function TrustStrip() {
  return (
    <section aria-label="Standards and controls" className="border-t border-line">
      <ul className="mx-auto grid max-w-site grid-cols-2 border-x border-line sm:grid-cols-3 lg:grid-cols-6">
        {trust.map((t) => (
          <li key={t.label} className="flex items-center justify-center gap-2 border-b border-r border-line px-4 py-6 text-center text-small text-fg-body last:border-r-0 sm:border-b-0 lg:[&:nth-child(n)]:border-b-0">
            <Icon name={t.icon} className="shrink-0 text-fg-muted" />
            {t.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
