import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileSpreadsheet, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/organisms/PageHeader";
import { SECURITY_EMAIL } from "@/data/security";

export const metadata: Metadata = { title: "Help" };

const SUPPORT_EMAIL = "support@komputy.com";

const LINKS = [
  { icon: FileSpreadsheet, title: "Data templates", body: "The columns each upload needs, with CSV templates for PD, LGD, EAD and lease imports.", href: "/services/ecl#inputs" },
  { icon: BookOpen, title: "How a run works", body: "Upload, validate, compute, review and sign off: what happens at each step.", href: "/services/ecl" },
  { icon: Sparkles, title: "What's new", body: "Every release, with the changes to the engine and the screens.", href: "/updates" },
  { icon: ShieldCheck, title: "Security and your data", body: "Isolation, encryption, support access and where your data is stored.", href: "/security" },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Help" description="Guides for your team, and a person to talk to when you need one." />
      <section className="flex flex-col gap-4 rounded-panel border border-line bg-raised p-6 sm:flex-row sm:items-center">
        <LifeBuoy className="size-8 shrink-0 text-fg-muted" aria-hidden />
        <div className="flex-1">
          <h2 className="text-h4 text-fg">Contact support</h2>
          <p className="text-small text-fg-muted">Email us with your workspace name and, if it&apos;s about a run or a lease, its code. We reply within one business day.</p>
        </div>
        <p className="select-all font-mono text-small text-fg">{SUPPORT_EMAIL}</p>
      </section>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {LINKS.map(({ icon: Icon, title, body, href }) => (
          <li key={title}>
            <Link href={href} className="flex h-full gap-4 rounded-panel border border-line p-5 transition-colors hover:bg-surface-hover">
              <Icon className="size-5 shrink-0 text-fg-muted" aria-hidden />
              <span className="flex flex-col gap-1"><span className="text-small text-fg">{title}</span><span className="text-small text-fg-muted">{body}</span></span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-micro text-fg-muted">Found a security issue? Write to <span className="select-all font-mono">{SECURITY_EMAIL}</span>.</p>
    </>
  );
}
