// IFRS 16 lessee calculator (client-side preview, mirrors the engine leases engine "leases-1.0.0").
// shortcut: annual/quarterly/monthly fixed payments only; irregular schedules and escalations come from the backend engine when wired.
export type Frequency = "annual" | "quarterly" | "monthly";
export interface LeaseTerms { commencement: string; end: string; payment: number; frequency: Frequency; timing: "arrears" | "advance"; rate: number; idc?: number; incentives?: number; restoration?: number }
export interface YearRow { year: number; opening: number; interest: number; payment: number; closing: number; depreciation: number; rou: number }

const PPY: Record<Frequency, number> = { annual: 1, quarterly: 4, monthly: 12 };
const c2 = (n: number) => Math.round(n * 100) / 100;

/** Whole months from commencement to end inclusive (1 Jan 2027 → 31 Dec 2029 = 36). */
export function termMonths(commencement: string, end: string) {
  const a = new Date(commencement + "T00:00:00Z"), b = new Date(end + "T00:00:00Z");
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()) + 1;
}

export function presentValue(t: Pick<LeaseTerms, "payment" | "frequency" | "timing" | "rate">, periods: number) {
  const r = t.rate / PPY[t.frequency];
  const arrears = r === 0 ? t.payment * periods : (t.payment * (1 - (1 + r) ** -periods)) / r;
  return c2(t.timing === "advance" ? arrears * (1 + r) : arrears);
}

/** Liability, ROU and an annual schedule; last period absorbs rounding so closing ends at exactly 0. */
export function calculate(t: LeaseTerms) {
  const months = termMonths(t.commencement, t.end);
  const ppy = PPY[t.frequency], step = 12 / ppy, n = Math.max(0, Math.floor(months / step));
  const r = t.rate / ppy;
  const liability = presentValue(t, n);
  const rou = c2(liability + (t.idc ?? 0) - (t.incentives ?? 0) + (t.restoration ?? 0));
  const startYear = Number(t.commencement.slice(0, 4)), startMonth = Number(t.commencement.slice(5, 7)) - 1;
  const deprPerMonth = months ? rou / months : 0;
  const years = new Map<number, YearRow>();
  let bal = liability, deprTotal = 0;
  for (let p = 0; p < n; p++) {
    const monthIndex = startMonth + (p + 1) * step - 1; // month in which the period ends
    const year = startYear + Math.floor(monthIndex / 12);
    const row = years.get(year) ?? { year, opening: bal, interest: 0, payment: 0, closing: 0, depreciation: 0, rou: 0 };
    let interest: number;
    if (t.timing === "advance") { bal = c2(bal - t.payment); interest = c2(bal * r); bal = c2(bal + interest); }
    else { interest = c2(bal * r); bal = c2(bal + interest - t.payment); }
    if (p === n - 1 && bal !== 0) { interest = c2(interest - bal); bal = 0; } // last period absorbs rounding
    row.interest = c2(row.interest + interest); row.payment = c2(row.payment + t.payment); row.closing = bal;
    years.set(year, row);
  }
  const rows = [...years.values()];
  rows.forEach((row, i) => {
    const firstM = i === 0 ? startMonth : 0;
    const lastM = i === rows.length - 1 ? (startMonth + months - 1) % 12 : 11;
    const d = i === rows.length - 1 ? c2(rou - deprTotal) : c2(deprPerMonth * (lastM - firstM + 1));
    deprTotal = c2(deprTotal + d);
    row.depreciation = d; row.rou = c2(rou - deprTotal);
  });
  return { liability, rou, months, periods: n, annualDepreciation: c2(deprPerMonth * 12), totalInterest: c2(rows.reduce((a, x) => a + x.interest, 0)), rows };
}

/** Remeasurement for an event (extension / payment / rate change): new PV of remaining payments at the revised rate. */
export function remeasure(before: number, remaining: Pick<LeaseTerms, "payment" | "frequency" | "timing" | "rate">, periods: number) {
  const after = presentValue(remaining, periods);
  return { before, after, delta: c2(after - before) };
}
