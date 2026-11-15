import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { PdMatrix } from "@/components/organisms/PdMatrix";
import { FadeIn } from "@/components/atoms/FadeIn";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";
import { pdMatrix } from "@/data/mock/data";
import { ecl, leases } from "@/data/content";
import { Frame, Ticks } from "@/components/organisms/marketing/Frame";

function Copy({ label, title, body, points, link }: { label: string; title: string; body: string; points: string[]; link: { label: string; href: string } }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="label-mono">{label}</p>
      <h2 className="text-[32px] leading-[1.15] tracking-[-0.03em] md:text-h1">{title}</h2>
      <p className="max-w-xl text-body text-fg-muted">{body}</p>
      <Ticks items={points} />
      <Link href={link.href} className="inline-flex w-fit items-center gap-1 text-small text-link hover:underline">{link.label}<ArrowRight aria-hidden className="size-4" /></Link>
    </div>
  );
}

const card = "ring-inner rounded-panel border border-line bg-raised";

/** L5: ECL copy beside the Retail transition matrix with an overlapping ECL build-up card. */
export function EclDeepDive() {
  const max = 25412.1;
  return (
    <Frame id="ecl" label="Expected Credit Loss">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
        <Copy {...ecl} />
        <FadeIn className="relative pb-40 sm:pb-36">
          <div aria-hidden className="absolute -inset-10 -z-0 rounded-full bg-accent/10 blur-3xl" />
          <div className={cn(card, "relative p-5")}>
            <p className="mb-3 text-small text-fg">Retail transition matrix <span className="text-fg-muted">· pooled Jan-Sep 2026</span></p>
            <PdMatrix {...pdMatrix} caption="Retail transition matrix, pooled January to September 2026" />
          </div>
          <div className={cn(card, "absolute bottom-0 right-0 w-[min(100%,380px)] p-5 shadow-[0_-24px_48px_-12px_var(--canvas)] sm:-right-4")}>
            <p className="mb-4 text-small text-fg">ECL build-up <span className="text-fg-muted">· LN-000184</span></p>
            <div aria-hidden className="flex h-20 items-end gap-2">
              {[0.34, 0.44, 0.58, 0.4, 1].map((h, i) => (
                <span key={i} className={cn("flex-1 rounded-t-sm", i === 4 ? "bg-accent" : i === 3 ? "bg-positive/70" : "bg-positive/40")} style={{ height: `${Math.min(100, h * 100)}%` }} />
              ))}
            </div>
            <dl className="mt-3 grid grid-cols-5 gap-2 text-center">
              {ecl.buildUp.map((b) => (
                <div key={b.label}>
                  <dt className="text-[11px] text-fg-muted">{b.label}</dt>
                  <dd className={cn("font-mono text-[11px] tabular-nums", b.label === "ECL" ? "text-fg" : "text-fg-body")}>{b.value}</dd>
                </div>
              ))}
            </dl>
            <span className="sr-only">EAD {money(max)} times PD 0.0213 times LGD 41.2 percent, less discount 18.40, equals ECL 204.55</span>
          </div>
        </FadeIn>
      </div>
    </Frame>
  );
}

/** L6: close checklist + liability roll-forward beside the Leases copy (mirrored layout). */
export function LeasesDeepDive() {
  return (
    <Frame id="leases" label="Lease Accounting">
      <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
        <FadeIn className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
          <div className={cn(card, "p-5")}>
            <p className="mb-4 text-small text-fg">October 2026 close</p>
            <ol className="flex flex-col gap-3">
              {leases.close.map((s, i) => {
                const current = !s.done && leases.close[i - 1]?.done;
                return (
                  <li key={s.label} className="flex items-center gap-3 text-small">
                    {s.done ? <CheckCircle2 aria-label="Done" className="size-4 text-positive" /> : current ? <Loader2 aria-label="In progress" className="size-4 text-link motion-safe:animate-spin" /> : <Circle aria-label="Waiting" className="size-4 text-fg-subtle" />}
                    <span className={cn("flex-1", s.done || current ? "text-fg" : "text-fg-muted")}>{s.label}</span>
                    {s.meta && <span className="text-micro text-fg-muted tabular-nums">{s.meta}</span>}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className={cn(card, "p-5")}>
            <p className="mb-4 text-small text-fg">Lease liability roll-forward <span className="text-fg-muted">· USD</span></p>
            <table className="w-full text-small tabular-nums">
              <caption className="sr-only">Lease liability roll-forward, October 2026, USD millions</caption>
              <tbody>
                {leases.rollForward.map(([k, v], i) => (
                  <tr key={k} className={cn(i === leases.rollForward.length - 1 && "border-t border-line")}>
                    <th scope="row" className={cn("py-1.5 text-left font-normal", i === 0 || i === leases.rollForward.length - 1 ? "text-fg" : "text-fg-muted")}>{k}</th>
                    <td className={cn("py-1.5 text-right", v < 0 ? "text-fg-body" : "text-fg")}>{v < 0 ? `(${Math.abs(v).toFixed(2)}M)` : `${v.toFixed(2)}M`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
        <div className="order-1 lg:order-2"><Copy {...leases} /></div>
      </div>
    </Frame>
  );
}
