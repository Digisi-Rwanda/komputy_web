import type { ReactNode } from "react";
import { Logo } from "@/components/atoms/Logo";

/** NA6 transactional email templates, previewed at real width (600px) inside a mail-client frame. */
function Email({ subject, children, cta, note }: { subject: string; children: ReactNode; cta: string; note?: ReactNode }) {
  return (
    <figure className="flex w-full max-w-[600px] flex-col overflow-hidden rounded-panel border border-line">
      <figcaption className="border-b border-line bg-raised px-4 py-2.5 text-micro text-fg-muted"><span className="text-fg">Komputy</span> &lt;no-reply@komputy.com&gt;<span className="mt-0.5 block text-small text-fg">{subject}</span></figcaption>
      <div className="bg-[#F3F4F6] p-6 sm:p-8"><div className="flex flex-col gap-5 rounded-card bg-[#FFFFFF] border border-[#DFE2E7] p-6 sm:p-8 text-[#2B2F37]">
        <Logo />{children}
        <span className="inline-flex h-11 w-fit items-center rounded-full bg-[#15171C] px-6 text-small font-medium text-[#FFFFFF]">{cta}</span>
        {note && <p className="text-small text-[#5D636E]">{note}</p>}
        <hr className="border-[#E1E4E9]" />
        <p className="text-micro text-[#5D636E]">Komputy · You&apos;re receiving this because you&apos;re a member of Kivu Commercial Bank · <span className="underline">Notification settings</span></p>
      </div></div>
    </figure>
  );
}
const H = ({ children }: { children: ReactNode }) => <h2 className="text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#15171C]">{children}</h2>;

export function EmailTemplates() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3"><p className="font-mono text-micro uppercase tracking-wider text-fg-muted">NA6.1 Welcome</p>
        <Email subject="Welcome to Komputy, Aline" cta="Open Komputy" note="Your Expected Credit Loss trial includes 3 runs for 14 days.">
          <H>Your workspace is ready</H>
          <ol className="flex flex-col gap-2 text-base">{["Add your segments", "Upload PD, LGD and EAD data", "Compute and sign off"].map((s, i) => <li key={s} className="flex gap-3"><span className="font-mono text-[#5D636E]">{i + 1}</span>{s}</li>)}</ol>
        </Email></section>
      <section className="flex flex-col gap-3"><p className="font-mono text-micro uppercase tracking-wider text-fg-muted">NA6.2 Trial ending</p>
        <Email subject="Your Lease Accounting trial ends in 4 days" cta="Request full access" note={<>Questions? <span className="text-[#0059C2] underline">Talk to M. Achieng</span></>}>
          <H>4 days left in your trial</H>
          <div className="rounded-card border border-[#E1E4E9] p-4 font-mono text-small">8 of 10 leases · 1 close period used</div>
          <p className="text-base">Your data stays available view only after the trial.</p>
        </Email></section>
      <section className="flex flex-col gap-3"><p className="font-mono text-micro uppercase tracking-wider text-fg-muted">NA6.3 Service activated</p>
        <Email subject="Lease Accounting is now active" cta="Go to Lease Accounting">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#D9F5E8] text-[#007A4D]">✓</span>
          <H>Lease Accounting is now active</H>
          <table className="text-small"><tbody>{[["Leases", "250"], ["Entities", "3"], ["Until", "15 Nov 2027"], ["Ref", "KCB-2026-LEASE"]].map(([k, v]) => <tr key={k} className="border-t border-[#E1E4E9]"><td className="py-2 pr-8 text-[#5D636E]">{k}</td><td className="font-mono">{v}</td></tr>)}</tbody></table>
        </Email></section>
    </div>
  );
}
