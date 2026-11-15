import Link from "next/link";
import { Linkedin, Youtube } from "lucide-react";
import { NewsletterForm } from "@/components/molecules/NewsletterForm";
import { Logo } from "@/components/atoms/Logo";
import { LiveDot } from "@/components/atoms/LiveDot";

const COLS = [
  ["Product", [["Expected Credit Loss", "/services/ecl"], ["Lease Accounting", "/services/leases"], ["Pricing", "/pricing"], ["Updates", "/updates"], ["Status", "/updates"]]],
  ["Company", [["Security", "/security"], ["Contact", "/contact"]]],
  ["Legal", [["Terms", "/legal/terms"], ["Privacy", "/legal/privacy"], ["Data processing", "/legal/dpa"], ["Cookies", "/legal/cookies"]]],
] as const;

const XIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2Z" /></svg>
);
const SOCIAL = [
  ["Komputy on LinkedIn", "https://www.linkedin.com", Linkedin],
  ["Komputy on X", "https://x.com", XIcon],
  ["Komputy on YouTube", "https://www.youtube.com", Youtube],
] as const;

/** Marketing footer: newsletter band on the blueprint grid, 4 columns, status line. */
export function MarketingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="bg-blueprint border-b border-line">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-6 px-4 py-12 lg:px-6">
          <p className="max-w-lg text-h3 text-fg">Stay in the loop. <span className="text-fg-muted">Product and methodology updates, monthly.</span></p>
          <NewsletterForm id="footer-email" />
        </div>
      </div>
      <div className="mx-auto grid max-w-site gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-60 text-small text-fg-muted">IFRS 9 and IFRS 16 reporting, from upload to sign-off.</p>
          <ul className="flex gap-2">
            {SOCIAL.map(([label, href, Icon]) => (
              <li key={label}><a href={href} aria-label={label} target="_blank" rel="noopener noreferrer" className="inline-flex size-9 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:text-fg"><Icon className="size-4" /></a></li>
            ))}
          </ul>
        </div>
        {COLS.map(([title, links]) => (
          <nav key={title} aria-label={title} className="flex flex-col gap-3">
            <p className="text-small text-fg">{title}</p>
            {links.map(([label, href]) => <Link key={label} href={href} className="text-small text-fg-muted transition-colors hover:text-fg">{label}</Link>)}
          </nav>
        ))}
      </div>
      <div className="mx-auto flex max-w-site flex-wrap justify-between gap-4 border-t border-line px-4 py-6 text-micro text-fg-muted lg:px-6">
        <span>© 2026 Komputy. All rights reserved.</span>
        <span className="flex items-center gap-2 font-mono">v1.3.0 · All systems normal <LiveDot /></span>
      </div>
    </footer>
  );
}
