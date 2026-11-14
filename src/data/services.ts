// Service page content (blueprint §6.2). Live services get the full page; coming-soon get the waitlist page (P3).
import type { IconName } from "@/components/atoms/Icon";
import type { ServiceId } from "@/types/domain";

export interface InputFile { name: string; template: string; columns: { name: string; required: boolean; note?: string }[] }
export interface LiveServicePage {
  kind: "live";
  id: ServiceId;
  eyebrow: string;
  title: string;
  sub: string;
  audiences: { icon: IconName; title: string; body: string }[];
  workflow: { title: string; body: string }[];
  inputs: InputFile[];
  outputs: { icon: IconName; title: string; body: string }[];
  controls: { icon: IconName; title: string; body: string }[];
  trial: string[];
  priceFrom: string;
  faq: { q: string; a: string }[];
  cta: { title: string; sub: string };
}
export interface SoonServicePage {
  kind: "soon";
  id: ServiceId;
  icon: IconName;
  title: string;
  sub: string;
  willDo: { icon: IconName; title: string; body: string }[];
}

export const SERVICE_PAGES: Record<ServiceId, LiveServicePage | SoonServicePage> = {
  ecl: {
    kind: "live",
    id: "ecl",
    eyebrow: "IFRS 9",
    title: "Expected credit loss, signed off with evidence.",
    sub: "Upload PD, LGD and EAD data. Ledgerline validates every row, computes every stage and reconciles the totals seven ways.",
    audiences: [
      { icon: "leases", title: "Banks", body: "Loan books across retail, SME and corporate segments." },
      { icon: "users", title: "Microfinance institutions", body: "High-volume portfolios, monthly provisioning." },
      { icon: "ecl", title: "Lenders & leasing firms", body: "Auditable IFRS 9 without a model team." },
    ],
    workflow: [
      { title: "Set up", body: "Segments, collateral types, haircuts and thresholds." },
      { title: "Upload", body: "PD, LGD and EAD workbooks, several months per file." },
      { title: "Validate", body: "40+ checks with plain-English fixes and row samples." },
      { title: "Compute", body: "Transition matrices, term structure, LGD, EAD and ECL." },
      { title: "Sign off", body: "A second person approves. The run locks." },
      { title: "Report", body: "Six workbooks, roll-forwards and a downloadable bundle." },
    ],
    inputs: [
      { name: "PD workbook", template: "/templates/pd-template.csv", columns: [{ name: "Loan ID", required: true }, { name: "Staging", required: true, note: "1, 2 or 3" }, { name: "Loan Amount", required: true }, { name: "SEGMENT", required: true }, { name: "Reporting Month", required: true, note: "aliases: As At, Period" }] },
      { name: "LGD workbook", template: "/templates/lgd-template.csv", columns: [{ name: "Customer ID", required: true }, { name: "Loan ID", required: true }, { name: "Outstanding Amount", required: true }, { name: "One column per collateral type", required: false, note: "e.g. Property, Cash" }] },
      { name: "EAD workbook", template: "/templates/ead-template.csv", columns: [{ name: "Loan ID", required: true }, { name: "Customer ID", required: true }, { name: "SEGMENT", required: true }, { name: "Reporting Date", required: true }, { name: "First Payment Date", required: true }, { name: "Maturity Date", required: true }, { name: "Stage", required: true }, { name: "Outstanding Amount", required: true }, { name: "EIR", required: true }] },
    ],
    outputs: [
      { icon: "sheet", title: "Loan detail", body: "Every loan with EAD, PD, LGD and ECL." },
      { icon: "sheet", title: "Portfolio summary", body: "Stage and segment totals with coverage." },
      { icon: "sheet", title: "PD calculations", body: "Matrices and term structure per segment." },
      { icon: "check-circle", title: "Reconciliation", body: "Seven checks, tolerance 0.01." },
      { icon: "alert", title: "Exceptions register", body: "Every excluded or capped loan, with a reason." },
      { icon: "download", title: "Run bundle", body: "Inputs, methodology and outputs in one zip." },
    ],
    controls: [
      { icon: "users", title: "Maker-checker", body: "The submitter can't approve their own run." },
      { icon: "key", title: "Reproducible", body: "Engine version and input hashes pinned to every run." },
      { icon: "audit", title: "Full audit trail", body: "Every upload, acceptance and decision, exportable." },
    ],
    trial: ["14-day trial", "3 trial runs", "Up to 5,000 loans per run", "Sample data included"],
    priceFrom: "From USD 1,200 / month",
    faq: [
      { q: "Which file formats do you accept?", a: "Excel (.xlsx) workbooks up to 50 MB, with several months in one or more sheets. Macros are rejected. Templates are on this page." },
      { q: "How are stages determined?", a: "In engine v1.3.0 stages come from your input file. Configurable SICR rules are on the methodology roadmap." },
      { q: "Can we reproduce last year's run?", a: "Yes. Each run pins its engine version and input hashes, so a rerun gives the same answer." },
      { q: "Are trial outputs usable?", a: "Trial workbooks are watermarked TRIAL. Activate the service to remove the watermark." },
    ],
    cta: { title: "Run your next provision on Ledgerline.", sub: "Free for 14 days. Bring your own data or use ours." },
  },
  leases: {
    kind: "live",
    id: "leases",
    eyebrow: "IFRS 16",
    title: "Lease accounting that closes on time.",
    sub: "Register, calculate, approve and post — with every version kept.",
    audiences: [
      { icon: "leases", title: "Corporates", body: "Manage complex lease portfolios." },
      { icon: "workspaces", title: "Banks with branch networks", body: "Meet regulatory requirements." },
      { icon: "users", title: "Groups with many entities", body: "Get a unified view." },
    ],
    workflow: [
      { title: "Setup", body: "Entity, GL accounts, periods, policies, rates." },
      { title: "Capture", body: "Form or import, with duplicate checks." },
      { title: "Calculate", body: "Live schedule preview, ROU and liability." },
      { title: "Approve", body: "Maker-checker on every lease and event." },
      { title: "Close", body: "Journals, payments and period lock." },
      { title: "Report", body: "Roll-forwards, maturity and Note 14." },
    ],
    inputs: [
      { name: "Lease import", template: "/templates/leases-import-template.csv", columns: [{ name: "Lease reference", required: true }, { name: "Lease name", required: true }, { name: "Asset class", required: true }, { name: "Lessor", required: true }, { name: "Currency", required: true }, { name: "Commencement date", required: true }, { name: "End date", required: true }, { name: "Payment amount", required: true }, { name: "Frequency", required: true }, { name: "Timing", required: true, note: "advance or arrears" }, { name: "Discount rate %", required: false, note: "else rate curve" }, { name: "Escalation %, rent-free, IDC, incentives", required: false }] },
    ],
    outputs: [
      { icon: "calendar", title: "Schedules", body: "Annual and monthly amortisation per lease." },
      { icon: "journal", title: "Journals", body: "Balanced by entity and currency, ready to post." },
      { icon: "sheet", title: "Liability & ROU roll-forwards", body: "Opening to closing with every movement." },
      { icon: "sheet", title: "Maturity analysis", body: "Undiscounted cash flows by bucket." },
      { icon: "file", title: "Disclosures", body: "IFRS 16.53–58 note pack." },
      { icon: "sheet", title: "Register extract", body: "Saved views to Excel." },
    ],
    controls: [
      { icon: "users", title: "Maker-checker workflows", body: "Setup, leases and journals need a second person." },
      { icon: "clock", title: "Versioned modifications", body: "Every change keeps the previous version." },
      { icon: "lock", title: "Reopen requires a reason", body: "Locked periods reopen only with a logged reason." },
    ],
    trial: ["14-day trial", "10 trial leases", "1 entity", "1 close period"],
    priceFrom: "From USD 1,200 / month",
    faq: [
      { q: "Can I import leases in bulk?", a: "Yes. Upload a spreadsheet (up to 10,000 rows), map columns, fix issues and commit as drafts for approval." },
      { q: "Which standards are supported?", a: "IFRS 16 for lessees, including short-term and low-value exemptions, modifications and remeasurements." },
      { q: "Can journals post to our ERP?", a: "Today you export balanced journals and record the ERP reference. Direct posting arrives with ERP Connect." },
      { q: "Is there an API?", a: "Not yet publicly. Talk to us if you need one for your integration." },
    ],
    cta: { title: "Close your next month without the spreadsheet.", sub: "Free for 14 days with 10 leases. No card required." },
  },
  tax: {
    kind: "soon", id: "tax", icon: "tax",
    title: "Tax provision, straight from your ECL and lease balances.",
    sub: "Deferred tax schedules for IAS 12, built on the numbers you've already signed off.",
    willDo: [
      { icon: "sheet", title: "Temporary differences from ECL and leases", body: "Identify and track taxable and deductible differences across your IFRS 9 and IFRS 16 data." },
      { icon: "refresh", title: "Deferred tax roll-forward", body: "Accurate roll-forwards with full audit trails and version history." },
      { icon: "file", title: "Disclosure notes", body: "Consistent, reconciled figures for your financial statements." },
    ],
  },
  "lease-planning": {
    kind: "soon", id: "lease-planning", icon: "workflow",
    title: "Plan your lease portfolio before you sign.",
    sub: "Scenario modelling, renewals and lease-vs-buy on the same data as your IFRS 16 register.",
    willDo: [
      { icon: "workflow", title: "Scenario modelling", body: "See the P&L and balance-sheet effect of renewals and exits." },
      { icon: "ecl", title: "Portfolio analysis", body: "Cost per site, expiry walls and concentration." },
      { icon: "calendar", title: "Renewal pipeline", body: "Never miss an option date again." },
    ],
  },
  "doc-intel": {
    kind: "soon", id: "doc-intel", icon: "file",
    title: "Lease and loan terms, read from the documents.",
    sub: "Extract dates, payments and clauses from contracts, with citations you can verify.",
    willDo: [
      { icon: "file", title: "Contract analysis", body: "Key terms pulled from PDFs and scans." },
      { icon: "search", title: "Clause extraction", body: "Options, escalations and penalties, each with its source." },
      { icon: "check-circle", title: "Review before import", body: "Nothing enters the register without your approval." },
    ],
  },
  erp: {
    kind: "soon", id: "erp", icon: "external",
    title: "Post approved journals to your ERP, once.",
    sub: "Secure transfer of balanced journals with a full reconciliation log.",
    willDo: [
      { icon: "send", title: "Secure transfer", body: "Approved batches only, posted exactly once." },
      { icon: "check-circle", title: "Reconciliation logs", body: "Every posting matched to its ERP document number." },
      { icon: "settings", title: "Common ERPs", body: "SAP, Oracle, Dynamics and CSV-based systems." },
    ],
  },
};
