// Packages, add-ons, comparison and FAQ (blueprint §3.1, §3.3, §6.3). Prices are display text, editable here.
export interface Plan { id: string; name: string; tagline: string; price: string; unit: string; features: string[]; cta: { label: string; href: string }; featured?: boolean; annualNote?: string }

export const PLANS: Plan[] = [
  { id: "trial", name: "Trial", tagline: "Try one live service", price: "Free", unit: "14 days", features: ["Any 1 live service", "ECL: 3 runs, 5,000 loans/run", "Leases: 10 leases, 1 entity", "Sample data included"], cta: { label: "Start free trial", href: "/sign-up" } },
  { id: "single", name: "Single service", tagline: "ECL or Leases", price: "From USD 1,200", unit: "/ month", features: ["1 live service", "Up to 10 users", "Email support", "Standard onboarding"], cta: { label: "Contact sales", href: "/contact?package=single" }, annualNote: "USD 1,000 / month billed annually" },
  { id: "dual", name: "Dual", tagline: "ECL + Leases", price: "From USD 2,000", unit: "/ month", features: ["Both live services", "Up to 25 users", "Priority support", "Onboarding & methodology review"], cta: { label: "Contact sales", href: "/contact?package=dual&services=ecl,leases" }, featured: true, annualNote: "USD 1,670 / month billed annually" },
  { id: "enterprise", name: "Enterprise", tagline: "All services, your terms", price: "Let's talk", unit: "", features: ["All live services + early access", "SSO & custom roles", "SLA & dedicated manager", "Regional data hosting"], cta: { label: "Talk to us", href: "/contact?package=enterprise" } },
];

export const ADDONS = [
  { name: "Document Intelligence", note: "Coming soon", price: "Per add on" },
  { name: "ERP Connect", note: "Coming soon", price: "Per add on" },
  { name: "Extra quota", note: "Runs, loans, leases or entities", price: "Per add on" },
];

/** Comparison matrix: true = included, false = not, string = detail. Columns follow PLANS order. */
export const COMPARISON: { group: string; rows: [string, ...(boolean | string)[]][] }[] = [
  { group: "Services", rows: [["Expected Credit Loss (IFRS 9)", "1 of", "1 of", true, true], ["Lease Accounting (IFRS 16)", "1 of", "1 of", true, true], ["Coming soon services", false, false, false, "Early access"]] },
  { group: "Limits", rows: [["Users", "Invited team", "10", "25", "Custom"], ["ECL loans per run", "5,000", "Contracted", "Contracted", "Custom"], ["Active leases", "10", "Contracted", "Contracted", "Custom"], ["Legal entities", "1", "Contracted", "Contracted", "Custom"]] },
  { group: "Controls", rows: [["Maker and checker sign off", true, true, true, true], ["Audit log export", true, true, true, true], ["No watermark outputs", false, true, true, true], ["SSO", false, false, false, true]] },
  { group: "Support", rows: [["Support", "Email", "Email", "Priority", "Dedicated manager"], ["Onboarding", "Self service", "Standard", "Included + methodology review", "Tailored"], ["SLA", false, false, false, true]] },
];

export const PRICING_FAQ = [
  { q: "Why no online checkout?", a: "Every engagement includes onboarding and a methodology review, so we tailor the package to your portfolio and agree it with you. Nothing is charged online." },
  { q: "Can I upgrade my plan later?", a: "Yes. Add a service or more quota at any time, same login, same workspace, history kept." },
  { q: "Is there a setup fee?", a: "Standard onboarding is included in Dual and above. Single service onboarding is quoted with your package." },
  { q: "Do you offer discounts for multi entity groups?", a: "Yes, entities are priced in tiers. Use the calculator for a range and we'll refine it." },
  { q: "What happens when the trial ends?", a: "Your data becomes view only and stays available. Request a quote to continue." },
];
