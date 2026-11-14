// Indicative quote formula for the pricing calculator (blueprint §6.3). Display only: final pricing is agreed by contract.
// shortcut: rates are static here; upgrade to platform-admin-managed values (§15.6) when the backend exists.
export const RATES = {
  single: 1200, // one live service / month
  dual: 2000, // ECL + Leases / month
  perExtra10kLoans: 50, // above 10k loans per run
  perExtra100Leases: 50, // above 100 active leases
  perExtraEntity: 100, // above 1 entity
  perExtraUser: 10, // above 10 users
  low: 0.9,
  high: 1.15,
  annualMonths: 10, // annual billing = 10 months for 12
} as const;

export interface QuoteInput { ecl: boolean; leases: boolean; loansPerRun: number; activeLeases: number; entities: number; users: number; annual?: boolean }

const round100 = (n: number) => Math.round(n / 100) * 100;

/** Returns the indicative monthly range in USD, or null when no service is selected. */
export function quote(q: QuoteInput): { low: number; high: number; mid: number } | null {
  if (!q.ecl && !q.leases) return null;
  let mid = q.ecl && q.leases ? RATES.dual : RATES.single;
  if (q.ecl) mid += Math.max(0, Math.ceil((q.loansPerRun - 10_000) / 10_000)) * RATES.perExtra10kLoans;
  if (q.leases) mid += Math.max(0, Math.ceil((q.activeLeases - 100) / 100)) * RATES.perExtra100Leases;
  mid += Math.max(0, q.entities - 1) * RATES.perExtraEntity;
  mid += Math.max(0, q.users - 10) * RATES.perExtraUser;
  if (q.annual) mid = (mid * RATES.annualMonths) / 12;
  // low rounds to nearest 100, high rounds up so the range never understates.
  return { low: round100(mid * RATES.low), high: Math.ceil((mid * RATES.high) / 100) * 100, mid: Math.round(mid) };
}
