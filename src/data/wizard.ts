// Validation criteria and previews per dataset (W4-W8). IDs follow the engine's criteria (PD-, EC-, LG-, EA-).
import type { Dataset, Outcome } from "@/hooks/useRunDraft";

export interface Criterion { id: string; title: string; detail: string; status: "passed" | "warning" | "error"; affected?: string; explain?: string; sample?: string[][] }

const passed = (id: string, title: string, detail = ""): Criterion => ({ id, title, detail, status: "passed" });

export const CRITERIA: Record<Dataset, Record<Outcome, Criterion[]>> = {
  pd: {
    warnings: [
      { id: "PD-03", title: "Loans missing next month staging", detail: "Treated as Offbooks in the matrix", status: "warning", affected: "312 loans", explain: "A loan that disappears from the next month's snapshot is counted as leaving the book (Offbooks). If these loans were sold or written off, that's correct. If they're missing by mistake, upload a corrected file.", sample: [["Loan ID", "Last month", "Segment"], ["LN-004102", "2026-08", "Retail"], ["LN-007719", "2026-08", "SME"], ["LN-010355", "2026-07", "Retail"]] },
      { id: "EC-16", title: "Thin segment months", detail: "Mortgage Feb 2026 has 412 transitions (min 500)", status: "warning", affected: "1 segment-month", explain: "Months with few transitions make the pooled matrix noisier. Pooling across Jan to Sep keeps the result stable." },
      passed("PD-01", "Required columns present", "All 5 found"), passed("PD-02", "Staging values are 1, 2 or 3", "No invalid values"), passed("PD-04", "Loan amounts positive"),
      passed("PD-05", "Minimum transitions per segment", "Lowest: Mortgage 4,980 (min 500)"), passed("PD-06", "Consecutive months", "No gaps"), passed("PD-07", "Single reporting month per row"),
      passed("EC-12", "Duplicate Loan IDs per month", "None"), ...Array.from({ length: 12 }, (_, i) => passed(`PD-${String(i + 8).padStart(2, "0")}`, ["Header row detected", "Sheet names recognised", "Reporting month parsed", "Segment values match setup", "No blank Loan IDs", "Amounts numeric", "No merged cells", "No hidden rows", "Encoding valid", "File not password protected", "No macros", "Size within limit"][i])),
    ],
    failed: [
      { id: "EC-12", title: "Duplicate Loan IDs within a month", detail: "Each Loan ID must appear once per reporting month", status: "error", affected: "7 rows", explain: "The same loan appears more than once in a month, so its transition can't be determined.", sample: [["Loan ID", "Month", "Sheet", "Row"], ["LN-004418", "2026-08", "Aug", "1,204"], ["LN-004418", "2026-08", "Aug", "1,377"], ["LN-004418", "2026-08", "Aug", "1,552"]] },
      { id: "PD-02", title: "Staging values are 1, 2 or 3", detail: "Found values: 4, “S2”", status: "error", affected: "18 rows", explain: "Stage must be the number 1, 2 or 3. Replace text like “S2” with 2 and check the rows marked 4.", sample: [["Loan ID", "Month", "Staging"], ["LN-002201", "2026-05", "4"], ["LN-003310", "2026-06", "S2"]] },
      { id: "PD-03", title: "Loans missing next month staging", detail: "Treated as Offbooks in the matrix", status: "warning", affected: "312 loans" },
      { id: "EC-16", title: "Thin segment months", detail: "Mortgage Feb 2026 has 412 transitions (min 500)", status: "warning", affected: "1 segment-month" },
      ...Array.from({ length: 17 }, (_, i) => passed(`PD-${String(i + 4).padStart(2, "0")}`, "Check passed")),
    ],
    passed: [],
  },
  lgd: {
    warnings: [
      { id: "LG-07", title: "Unknown collateral column ignored", detail: "Column “Livestock” is not a collateral type", status: "warning", affected: "1 column", explain: "Only columns that match a collateral type in Setup are used. Add “Livestock” in Setup if it should count." },
      passed("LG-01", "Customer IDs present"), passed("LG-02", "Collateral values non negative"), passed("LG-03", "Every loan has a customer"), passed("LG-04", "Outstanding amounts positive"),
      ...Array.from({ length: 9 }, (_, i) => passed(`LG-${String(i + 5).padStart(2, "0")}`, "Check passed")),
    ],
    failed: [{ id: "LG-01", title: "Customer IDs present", detail: "214 rows have no Customer ID", status: "error", affected: "214 rows" }, ...Array.from({ length: 12 }, (_, i) => passed(`LG-${String(i + 2).padStart(2, "0")}`, "Check passed"))],
    passed: [],
  },
  ead: {
    warnings: [
      { id: "EA-11", title: "Reporting date matches the run (30 Nov 2026)", detail: "Rows dated 31 Oct 2026 are excluded", status: "warning", affected: "12 loans excluded", explain: "These rows carry the previous reporting date. They're excluded and listed in the exceptions register." },
      { id: "EA-14", title: "First payment after reporting date", detail: "Loans not yet amortising are excluded", status: "warning", affected: "6 loans excluded" },
      passed("EA-01", "Required fields"), passed("EA-02", "Duplicate Loan IDs"), passed("EA-03", "Stage values valid"), passed("EA-12", "EIR between 0 and 1"), passed("EA-15", "Maturity after first payment"), passed("EA-18", "PD curve available for every segment and stage"),
      ...Array.from({ length: 20 }, (_, i) => passed(`EA-${String(i + 20).padStart(2, "0")}`, "Check passed")),
    ],
    failed: [{ id: "EA-15", title: "Maturity after first payment", detail: "14 loans have Maturity Date before First Payment Date", status: "error", affected: "14 rows" }, ...Array.from({ length: 27 }, (_, i) => passed(`EA-${String(i + 1).padStart(2, "0")}`, "Check passed"))],
    passed: [],
  },
};

export const REQUIREMENTS: Record<Dataset, { title: string; intro: string; columns: string[]; aliases?: string; template: string; example: string[][]; tip: string; defaultFile: string; sizeMb: number; rows: string; sha: string }> = {
  pd: { title: "PD data: what we need", intro: "Monthly loan level staging snapshots. We build a money weighted transition matrix per segment from consecutive months.", columns: ["Loan ID", "Staging (1, 2 or 3)", "Loan Amount", "SEGMENT", "Reporting Month"], aliases: "Reporting Month aliases: As At, Month, Period", template: "/templates/pd-template.csv", example: [["Loan ID", "Staging", "Loan Amount", "SEGMENT", "Reporting Month"], ["LN-000184", "1", "25,000.00", "Retail", "2026-01"]], tip: "Include at least 6 months for a stable matrix.", defaultFile: "PD_Jan-Nov_2026.xlsx", sizeMb: 38.4, rows: "3 sheets · 434,808 rows", sha: "9f2c…a71" },
  lgd: { title: "LGD data: what we need", intro: "Customer collateral by type. Collateral is shared across a customer's loans by exposure, then discounted.", columns: ["Customer ID", "Loan ID", "Outstanding Amount", "One column per collateral type"], template: "/templates/lgd-template.csv", example: [["Customer ID", "Loan ID", "Outstanding Amount", "Property"], ["CU-22817", "LN-000184", "25,412.10", "54,240.00"]], tip: "Column names must match collateral types in Setup.", defaultFile: "LGD_Collateral_Nov2026.xlsx", sizeMb: 6.1, rows: "2 sheets · 29,800 rows", sha: "41ad…07c" },
  ead: { title: "EAD data: what we need", intro: "Loan exposures at the reporting date. We project month by month balances to maturity.", columns: ["Loan ID", "Customer ID", "SEGMENT", "Reporting Date", "First Payment Date", "Maturity Date", "Stage", "Outstanding Amount", "EIR"], aliases: "Ignored columns: Repayment Frequency (monthly is assumed)", template: "/templates/ead-template.csv", example: [["Loan ID", "Stage", "Outstanding Amount", "EIR"], ["LN-000184", "1", "25,412.10", "0.125"]], tip: "One row per loan at the reporting date.", defaultFile: "EAD_Loans_Nov2026.xlsx", sizeMb: 21.9, rows: "48,330 rows", sha: "c7e0…5b2" },
};

/** File names containing "fail" produce a failed report (demo hook for W5). */
export const outcomeFor = (name: string): Outcome => (/fail|error|bad/i.test(name) ? "failed" : "warnings");

export const PD_SEGMENTS: Record<string, number[][]> = {
  Retail: [[0.9412, 0.0391, 0.0042, 0.0155], [0.2105, 0.642, 0.1203, 0.0272], [0.031, 0.0498, 0.8901, 0.0291]],
  SME: [[0.9108, 0.0611, 0.0089, 0.0192], [0.1654, 0.6012, 0.1988, 0.0346], [0.0211, 0.0402, 0.9105, 0.0282]],
  Corporate: [[0.9601, 0.0254, 0.0021, 0.0124], [0.2588, 0.6411, 0.0702, 0.0299], [0.0402, 0.0611, 0.8711, 0.0276]],
  Mortgage: [[0.9702, 0.0188, 0.0014, 0.0096], [0.2811, 0.6589, 0.0398, 0.0202], [0.0503, 0.0702, 0.8592, 0.0203]],
};
/** Cumulative PD (%) by month for the term-structure chart. */
export const TERM = Array.from({ length: 13 }, (_, i) => {
  const m = i * 5, f = (end: number) => +(end * (1 - Math.exp(-m / 22))).toFixed(2);
  return { month: `${m}`, Retail: f(18.7 / (1 - Math.exp(-60 / 22))), SME: f(32.1 / (1 - Math.exp(-60 / 22))), Corporate: f(9.4 / (1 - Math.exp(-60 / 22))), Mortgage: f(6.2 / (1 - Math.exp(-60 / 22))) };
});
export const LOAN_LOOKUP = { id: "LN-000184", segment: "Retail", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"], stages: [1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1], amounts: [25000, 24800.5, 24600.1, 24399, 24197, 23994.6, 23791.9, 23588.6, 23384.9, 23180.7, 22976.1], note: "Cured from Stage 2 in Jul 2026" };
export const ALLOCATION = [
  ["LN-000184", 0.452, 24510, 0.35, 1.5, 15296.8],
  ["LN-000185", 0.381, 20660, 0.35, 1.5, 12893.41],
  ["LN-000901", 0.167, 9070, 0.4, 2.0, 4350.66],
] as const;
export const TREATMENT = [
  { stage: 1 as const, rule: "up to 12 monthly rows", loans: 34512 },
  { stage: 2 as const, rule: "rows to maturity", loans: 10148 },
  { stage: 3 as const, rule: "single row (PD = 1)", loans: 3634 },
];

/** Computed headline for the draft (W13). */
export const RESULT = {
  total: 13104882.4, delta: 0.02, vs: "RUN 0142", exposure: 561_204_330, coverage: 0.02335,
  stages: [{ stage: 1 as const, ecl: 2131020.44, share: 0.713 }, { stage: 2 as const, ecl: 3988211.6, share: 0.211 }, { stage: 3 as const, ecl: 6985650.36, share: 0.076 }],
  checks: ["Loan count", "Outstanding balance", "Row coverage", "Collateral allocation", "ECL buildup", "Summary totals", "ECL limits (tolerance 0.01)"],
  exceptions: [["Input validation", 18], ["PD match", 0], ["ECL cap", 46], ["Reconciliation", 0]] as [string, number][],
  movement: [{ label: "Q3 ECL", value: 12846210.55, kind: "total" as const }, { label: "New loans", value: 310000 }, { label: "Repayments", value: -150000 }, { label: "Stage 1→2", value: 120000 }, { label: "Stage 2→3", value: 90000 }, { label: "Cures", value: -60000 }, { label: "LGD change", value: -51328.15 }, { label: "Nov ECL", value: 13104882.4, kind: "total" as const }],
};
