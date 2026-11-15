// All landing-page copy and figures in one place (source: image-prompts/phase-01-landing + REDESIGN_UX_BLUEPRINT §6.1).
import type { IconName } from "@/components/atoms/Icon";
import type { ServiceId } from "@/types/domain";

export const hero = {
  announcement: { tag: "NEW", text: "ECL engine v1.3: seven reconciliation checks on every run", href: "/updates#v1-3" },
  title: "IFRS reporting, from upload to sign-off.",
  sub: "Expected credit loss and lease accounting for finance and risk teams. Validated inputs, reproducible runs, an audit trail on every number.",
  primary: { label: "Start free trial", href: "/sign-up" },
  secondary: { label: "Talk to sales", href: "/contact" },
  checks: ["14-day trial", "No card required", "Sample data included"],
};

export const trust: { icon: IconName; label: string }[] = [
  { icon: "file", label: "IFRS 9" },
  { icon: "file", label: "IFRS 16" },
  { icon: "security", label: "MFA & SSO-ready" },
  { icon: "layers", label: "Data isolated per workspace" },
  { icon: "refresh", label: "Reproducible runs" },
  { icon: "audit", label: "Audit trail" },
];

export const manifesto = {
  label: "Why Komputy",
  lead: "Provisioning used to take weeks of spreadsheets, emails and late-night reconciliations. Now it takes three uploads.",
  rest: "Komputy validates every row, computes every stage and keeps the evidence your auditors will ask for.",
  stats: [
    { value: 48.3, suffix: "M", decimals: 1, label: "Loans processed" },
    { value: 12400, suffix: "+", decimals: 0, label: "Runs signed off" },
    { value: 7, suffix: "", decimals: 0, label: "Reconciliation checks per run" },
    { value: -83, suffix: " %", decimals: 0, label: "Time to month-end provision" },
  ],
};

export const servicesSection = {
  label: "Services",
  title: "One platform. Every IFRS workflow you run.",
  sub: "Start with one service, add the next when you're ready, same login, same workspace.",
};

export const serviceCards: Record<ServiceId, { icon: IconName; ticks: [string, string]; cta: string }> = {
  ecl: { icon: "ecl", ticks: ["PD transition matrices", "Collateral-aware LGD"], cta: "Explore ECL" },
  leases: { icon: "calendar", ticks: ["Lease register & approvals", "Modifications with history"], cta: "Explore Leases" },
  "lease-planning": { icon: "workflow", ticks: ["Scenario modelling", "Portfolio analysis"], cta: "Join waitlist" },
  tax: { icon: "tax", ticks: ["Tax rate scenarios", "Deferred tax roll-forward"], cta: "Join waitlist" },
  "doc-intel": { icon: "file", ticks: ["Contract analysis", "Clause extraction"], cta: "Join waitlist" },
  erp: { icon: "external", ticks: ["Secure transfer", "Reconciliation logs"], cta: "Join waitlist" },
};

export const howItWorks = {
  label: "How it works",
  title: "Same six steps, every service.",
  steps: [
    { n: 1, title: "Set up", ecl: "Segments, collateral types, thresholds.", leases: "Entity, GL accounts, periods, rate curves." },
    { n: 2, title: "Upload", ecl: "PD, LGD and EAD workbooks.", leases: "Leases one by one or a spreadsheet." },
    { n: 3, title: "Validate", ecl: "40+ checks with plain-English fixes.", leases: "Dates, payments and duplicates checked." },
    { n: 4, title: "Compute", ecl: "Stages, PD curves, LGD, EAD, ECL.", leases: "Schedules, ROU and liability." },
    { n: 5, title: "Sign off", ecl: "A second person approves. Runs lock.", leases: "Maker-checker on every lease and journal." },
    { n: 6, title: "Report", ecl: "Workbooks, disclosures, exports.", leases: "Roll-forwards, maturity, Note 14." },
  ],
  reports: {
    ecl: {
      title: "Validation report",
      counts: { passed: 18, warning: 2, error: 1 },
      rows: [
        { code: "PD-01", text: "Required columns present", status: "passed" as const, note: "Passed" },
        { code: "PD-03", text: "Loans missing next-month staging", status: "warning" as const, note: "Warning · 312 rows" },
        { code: "EC-12", text: "Duplicate Loan IDs within a month", status: "error" as const, note: "Error · 7 rows" },
        { code: "PD-05", text: "Minimum transitions", status: "passed" as const, note: "Passed" },
      ],
      action: "Fix 1 error to continue",
    },
    leases: {
      title: "Import validation",
      counts: { passed: 41, warning: 4, error: 3 },
      rows: [
        { code: "LS-01", text: "Required lease fields present", status: "passed" as const, note: "Passed" },
        { code: "LS-07", text: "End date before commencement", status: "error" as const, note: "Error · 1 row" },
        { code: "LS-11", text: "Unknown counterparty: create or map", status: "warning" as const, note: "Warning · 2 rows" },
        { code: "LS-14", text: "Duplicate of LSE-0076", status: "error" as const, note: "Error · 1 row" },
      ],
      action: "Fix 3 errors to commit",
    },
  },
};

export const ecl = {
  label: "Expected Credit Loss · IFRS 9",
  title: "Every provision, traceable to the row.",
  body: "Upload loan-level snapshots. Komputy builds money-weighted transition matrices, term structures, collateral-aware LGD and month-by-month EAD, then reconciles the totals seven ways.",
  points: ["Transition matrices per segment", "Cure-rate aware LGD", "Capped at outstanding, with exceptions logged", "Compare runs and explain the movement"],
  link: { label: "See the ECL workflow", href: "/services/ecl" },
  buildUp: [
    { label: "EAD", value: "25,412.10" },
    { label: "× PD", value: "0.0213" },
    { label: "× LGD", value: "41.2 %" },
    { label: "Discount", value: "(18.40)" },
    { label: "ECL", value: "204.55" },
  ],
};

export const leases = {
  label: "Lease Accounting · IFRS 16",
  title: "Month-end close without the spreadsheet.",
  body: "Capture leases, calculate schedules, approve with maker-checker and post balanced journals, every change versioned.",
  points: ["Register with saved views", "Modifications with impact preview", "Close checklist with period lock", "Roll-forwards and maturity analysis"],
  link: { label: "See the Leases workflow", href: "/services/leases" },
  close: [
    { label: "Start", meta: "", done: true },
    { label: "Review issues", meta: "0 open", done: true },
    { label: "Generate journals", meta: "42 lines balanced", done: true },
    { label: "Confirm payments", meta: "18 / 21", done: false },
    { label: "Review & lock", meta: "", done: false },
  ],
  rollForward: [
    ["Opening", 8.42],
    ["Additions", 1.1],
    ["Interest", 0.39],
    ["Payments", -1.62],
    ["Modifications", 0.07],
    ["Closing", 8.36],
  ] as [string, number][],
};

export const proof = {
  title: "Built for the audit, not just the deadline.",
  cards: [
    { icon: "security" as IconName, title: "Reproducible", body: "Every run pins its engine version and input hashes. Rerun it next year, get the same answer.", chips: ["v1.3.0", "SHA 9f2c…a71"] },
    { icon: "users" as IconName, title: "Maker-checker", body: "The person who submits can't approve. Sign-off locks the run.", chips: ["Signed off · J. Habimana · 2 Oct 2026"] },
    { icon: "file" as IconName, title: "Evidence on tap", body: "Inputs, validation reports, methodology and outputs in one bundle.", link: { label: "View run bundle", href: "/security" } },
  ],
  security: "MFA, encryption in transit and at rest, data isolated per workspace, and our staff can't see your results without your consent.",
};

export const pricing = {
  label: "Pricing",
  title: ["Start with one service.", "Add the rest when you need them."],
  plans: [
    { name: "Single service", price: "From USD 1,200", unit: "/ month", detail: "ECL or Leases · up to 10 users · email support", cta: "Contact sales", featured: false },
    { name: "Dual", price: "From USD 2,000", unit: "/ month", detail: "ECL + Leases · up to 25 users · onboarding included", cta: "Contact sales", featured: true },
    { name: "Enterprise", price: "Let's talk", unit: "", detail: "All services · SSO · SLA · dedicated manager", cta: "Talk to us", featured: false },
  ],
  note: "Every plan starts with a free 14-day trial. No card required.",
  link: { label: "See full pricing", href: "/pricing" },
};

export const testimonials = {
  label: "Testimonials",
  title: "Finance teams that stopped dreading month-end.",
  featured: { quote: "We closed Q3 provisioning in two days instead of three weeks, and the auditors had nothing to chase.", name: "Grace Mukamana", role: "Head of Credit Risk, Kivu Commercial Bank", initials: "GM" },
  others: [
    { quote: "The validation report caught duplicates we'd carried for a year.", name: "Eric Uwase", role: "Risk Analyst", initials: "EU" },
    { quote: "Lease journals finally match the GL on the first try.", name: "Samuel Okello", role: "Financial Controller, Northgate Leasing", initials: "SO" },
    { quote: "Sign-off is a click, and the evidence is already there.", name: "Jean Habimana", role: "Internal Audit", initials: "JH" },
  ],
};

export const faq = {
  label: "FAQ",
  title: "Questions, answered.",
  items: [
    { q: "How does the free trial work?", a: "Pick a service when you sign up. You get 14 days and 3 ECL runs or 10 leases, with sample data. No card needed. Existing work stays available after the trial." },
    { q: "Can I add a service later without a new account?", a: "Yes. Services are switched on per workspace, so your team, settings and audit history carry over. Ask from Admin → Services and we'll set it up." },
    { q: "Where is our data stored and who can see it?", a: "Each workspace is isolated. Data is encrypted in transit and at rest. Komputy staff see counts and metadata only (never your results) unless an administrator approves a time-limited support session, which is logged." },
    { q: "Do you support SICR rules and macro scenarios?", a: "Stages come from your input file in engine v1.3.0. Configurable SICR rules and forward-looking macro scenarios are on the methodology roadmap." },
    { q: "How do you price?", a: "Per service, by contract. There's no card payment in the app. We agree a package with you and switch it on. See the pricing page for starting points." },
    { q: "Can we export everything?", a: "Yes. Every run has a bundle with inputs, validation reports, methodology and output workbooks, and the full audit log exports to CSV." },
  ],
};

export const cta = {
  title: "Run your next provision on Komputy.",
  sub: "Free for 14 days. Bring your own data or use ours.",
  checks: ["Validated inputs before you compute", "Sign-off with a full audit trail", "Add Leases to the same workspace anytime"],
};
