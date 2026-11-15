// Results data for RUN-0142 (R1-R14). Figures tie to the run headline (12,846,210.55).
import type { Exception, LoanRow } from "@/types/domain";


export const loans: LoanRow[] = [
  { id: "LN-000184", customer: "CU-22817", segment: "Retail", stage: 1, outstanding: 25412.1, ead: 25412.1, pd: 0.0213, lgd: 0.412, ecl: 204.55 },
  { id: "LN-003311", customer: "CU-10442", segment: "SME", stage: 2, outstanding: 88120, ead: 91804.33, pd: 0.1402, lgd: 0.52, ecl: 6690.12 },
  { id: "LN-007702", customer: "CU-31008", segment: "Retail", stage: 3, outstanding: 14300, ead: 14300, pd: 1, lgd: 0.684, ecl: 9781.2, capped: true },
  { id: "LN-009221", customer: "CU-77100", segment: "Corporate", stage: 1, outstanding: 72500, ead: 72500, pd: 0.0127, lgd: 0.387, ecl: 310.9 },
  { id: "LN-010443", customer: "CU-66221", segment: "SME", stage: 2, outstanding: 61200, ead: 64800, pd: 0.0814, lgd: 0.495, ecl: 2696.32 },
  { id: "LN-012776", customer: "CU-40211", segment: "Retail", stage: 3, outstanding: 8200, ead: 8200, pd: 1, lgd: 0.71, ecl: 5822, capped: false },
  { id: "LN-015320", customer: "CU-18830", segment: "Mortgage", stage: 1, outstanding: 182400, ead: 182400, pd: 0.0062, lgd: 0.18, ecl: 196.11 },
  { id: "LN-016778", customer: "CU-51210", segment: "Retail", stage: 1, outstanding: 9880, ead: 9880, pd: 0.0213, lgd: 0.44, ecl: 87.62 },
  { id: "LN-017665", customer: "CU-60018", segment: "SME", stage: 3, outstanding: 12000, ead: 12000, pd: 1, lgd: 0.66, ecl: 7920 },
  { id: "LN-048291", customer: "CU-90011", segment: "Corporate", stage: 3, outstanding: 812000, ead: 812000, pd: 1, lgd: 0.63, ecl: 512430.12 },
  { id: "LN-048276", customer: "CU-90044", segment: "SME", stage: 3, outstanding: 640000, ead: 640000, pd: 1, lgd: 0.66, ecl: 421775.36 },
  { id: "LN-048273", customer: "CU-90102", segment: "Retail", stage: 3, outstanding: 560000, ead: 560000, pd: 1, lgd: 0.69, ecl: 387221.8 },
];

export const TOTAL_LOANS = 48312;

/** ECL distribution by loan size (USD). */
export const sizeBuckets = [{ bucket: "< 50k", ecl: 1.31e6 }, { bucket: "50k to 250k", ecl: 1.62e6 }, { bucket: "250k to 1M", ecl: 3.04e6 }, { bucket: "1M to 5M", ecl: 4.12e6 }, { bucket: "> 5M", ecl: 2.756e6 }];

export const exceptions: Exception[] = [
  { id: "x1", category: "Input validation", loan: "LN-118802", rule: "EA-11", detail: "Reporting date 31 Aug 2026 ≠ run 30 Sep 2026", impact: "Excluded", amount: 0, ack: "Eric Uwase: “Legacy loans, see ticket FIN 221”", input: [["Reporting Date", "2026-08-31"], ["Outstanding Amount", "4,210.00"], ["Stage", "1"]] },
  { id: "x2", category: "ECL cap", loan: "LN-007702", rule: "Cap", detail: "ECL before cap 15,204.18 > outstanding 14,300.00", impact: "Capped at 14,300.00", amount: -904.18 },
  { id: "x3", category: "Input validation", loan: "LN-010447", rule: "EA-14", detail: "First payment 15 Jun 2027 after run date 30 Sep 2026", impact: "Excluded", amount: 0 },
  { id: "x4", category: "ECL cap", loan: "LN-012776", rule: "Cap", detail: "ECL before cap 8,750.00 > outstanding 8,200.00", impact: "Capped at 8,200.00", amount: -550 },
  { id: "x5", category: "Input validation", loan: "LN-016778", rule: "EA-11", detail: "Reporting date 30 Sep 2026 ≠ cutoff 29 Sep 2026", impact: "Excluded", amount: 0 },
  { id: "x6", category: "ECL cap", loan: "LN-017665", rule: "Cap", detail: "ECL before cap 12,620.00 > outstanding 12,000.00", impact: "Capped at 12,000.00", amount: -620 },
  { id: "x7", category: "Input validation", loan: "LN-020114", rule: "EA-14", detail: "First payment after reporting date", impact: "Excluded", amount: 0 },
  { id: "x8", category: "ECL cap", loan: "LN-021902", rule: "Cap", detail: "ECL before cap 5,880.00 > outstanding 5,500.00", impact: "Capped at 5,500.00", amount: -380 },
];
export const exceptionCounts = { "Input validation": 18, "PD match": 0, "ECL cap": 46, Reconciliation: 0 } as const;

export interface Check { title: string; formula: string; detail?: [string, string][] }
export const reconciliation: Check[] = [
  { title: "Loan count", formula: "Input 48,330 = included 48,312 + excluded 18", detail: [["Input rows", "48,330"], ["Included", "48,312"], ["Excluded", "18"]] },
  { title: "Outstanding balance", formula: "USD 556,104,882.40 = 556,104,882.40" },
  { title: "Row coverage", formula: "1,148,920 projection rows, every included loan has ≥ 1", detail: [["Total projection rows", "1,148,920"], ["Included loans", "48,312"], ["Loans with ≥ 1 row", "48,312"], ["Coverage", "100.00 %"]] },
  { title: "Collateral allocation", formula: "Allocated 313,302,118.10 = customer collateral 313,302,118.10" },
  { title: "ECL buildup", formula: "Σ row losses 12,861,414.73 − cap adjustments 15,204.18 = 12,846,210.55", detail: [["Σ row losses", "12,861,414.73"], ["Cap adjustments", "(15,204.18)"], ["Total ECL", "12,846,210.55"]] },
  { title: "Summary totals", formula: "Stage + segment summaries equal loan total" },
  { title: "ECL limits", formula: "No loan ECL above outstanding after cap (tolerance 0.01)" },
];

export const outputs = [
  ["Loan detail.xlsx", "Every loan with EAD, PD, LGD, ECL", 7.4],
  ["Portfolio summary.xlsx", "Stage and segment summaries", 3.1],
  ["PD calculations.xlsx", "Matrices and term structure", 2.8],
  ["LGD.xlsx", "Collateral and LGD inputs", 2.1],
  ["Rundown.xlsx", "Monthly projections", 1.9],
  ["ECL summary.xlsx", "Final ECL results", 1.7],
] as const;

export const runAudit = [
  { at: "2026-09-30T09:12:00Z", actor: "Eric Uwase", initials: "EU", action: "Created the run", object: "RUN-0142", service: "ECL" },
  { at: "2026-09-30T09:40:00Z", actor: "Eric Uwase", initials: "EU", action: "Uploaded PD_Jan-Sep_2026.xlsx", object: "SHA 9f2c…a71", service: "ECL" },
  { at: "2026-09-30T10:42:00Z", actor: "Eric Uwase", initials: "EU", action: "Accepted PD with 2 warnings: “Missing months are loans sold to Lakeshore MFI in July.”", object: "PD", service: "ECL" },
  { at: "2026-09-30T10:51:00Z", actor: "Eric Uwase", initials: "EU", action: "Accepted LGD", object: "LGD", service: "ECL" },
  { at: "2026-09-30T11:03:00Z", actor: "Eric Uwase", initials: "EU", action: "Accepted EAD", object: "EAD", service: "ECL" },
  { at: "2026-09-30T11:05:00Z", actor: "Eric Uwase", initials: "EU", action: "Started compute", object: "job_01HF7K", service: "ECL" },
  { at: "2026-09-30T11:10:00Z", actor: "System", initials: "SY", action: "Compute finished · 7/7 reconciliation", object: "RUN-0142", service: "ECL" },
  { at: "2026-10-02T14:05:00Z", actor: "Eric Uwase", initials: "EU", action: "Submitted to Jean Habimana", object: "RUN-0142", service: "ECL" },
  { at: "2026-10-02T17:02:00Z", actor: "Jean Habimana", initials: "JH", action: "Signed off", object: "RUN-0142", service: "ECL" },
];

/** Loan stage migration Aug → Sep (counts). */
export const migration = [[33690, 1204, 96], [488, 9120, 312], [120, 201, 3210]];

/** LN-000184 monthly schedule (R12): level-payment balance, marginal PD, LGD, discount factor; losses scaled so Σ = 204.55. */
export const loanSchedule = (() => {
  const r = 0.125 / 12, n = 29, bal0 = 25412.1, pmt = (bal0 * r) / (1 - (1 + r) ** -n), lgd = 0.412;
  const raw = Array.from({ length: 12 }, (_, i) => {
    const bal = bal0 * (1 + r) ** i - pmt * (((1 + r) ** i - 1) / r);
    const mpd = 0.0016 + i * 0.00005, df = (1 + r) ** -(i + 1);
    return { month: i + 1, sinceOrigination: 31 + i, balance: bal, ead: bal, pd: mpd, lgd, df, loss: bal * mpd * lgd * df };
  });
  const k = 204.55 / raw.reduce((a, x) => a + x.loss, 0);
  const rows = raw.map((x) => ({ ...x, pd: x.pd * k, loss: Math.round(x.loss * k * 100) / 100 }));
  const drift = Math.round((204.55 - rows.reduce((a, x) => a + x.loss, 0)) * 100) / 100;
  rows[11].loss = Math.round((rows[11].loss + drift) * 100) / 100;
  return rows;
})();

export const recentExports = [
  { name: "ECL roll forward Aug→Sep.xlsx", by: "Aline Mugisha", at: "2026-10-03T09:30:00Z", status: "ready" as const, size: "2.4 MB" },
  { name: "Stage movement Sep.xlsx", by: "Aline Mugisha", at: "2026-10-02T17:20:00Z", status: "ready" as const, size: "1.1 MB" },
];

export type { Exception, LoanRow };
