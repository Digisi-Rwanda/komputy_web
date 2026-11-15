// Legal documents (P8). PLACEHOLDER TEXT: must be reviewed by counsel before launch.
export interface LegalSection { id: string; title: string; body: string[]; table?: { head: string[]; rows: string[][] }; callout?: string }
export interface LegalDoc { slug: "terms" | "privacy" | "dpa" | "cookies"; title: string; short: string; version: string; updated: string; intro: string; sections: LegalSection[] }

const contact = (email: string): LegalSection => ({ id: "contact", title: "Contact", body: [`Questions about this document: ${email}.`, "Komputy, Kigali, Rwanda."] });

export const LEGAL: LegalDoc[] = [
  {
    slug: "terms", title: "Terms of Service", short: "Terms", version: "3", updated: "1 November 2026",
    intro: "These terms govern your organisation's use of Komputy.",
    sections: [
      { id: "agreement", title: "Agreement", body: ["By creating a workspace you accept these terms on behalf of your organisation. Signed order forms take precedence over these terms."] },
      { id: "accounts", title: "Accounts and workspaces", body: ["One account per person. Workspace administrators manage members and roles and are responsible for who has access."] },
      { id: "trials", title: "Trials", body: ["Trials last 14 days with usage limits. Trial outputs are watermarked and must not be relied on for published financial statements."] },
      { id: "fees", title: "Fees", body: ["Paid services are agreed in an order form. Nothing is charged online. Invoices are payable within 30 days."] },
      { id: "your-data", title: "Your data", body: ["You own your data. We process it only to provide the service, as described in the Privacy Policy and DPA."] },
      { id: "acceptable-use", title: "Acceptable use", body: ["Do not attempt to access other workspaces, probe the service without authorisation, or upload malware."] },
      { id: "liability", title: "Liability", body: ["Komputy computes figures from your inputs and methodology settings. Your organisation remains responsible for its financial statements."] },
      { id: "termination", title: "Termination", body: ["On termination, your workspace becomes read-only for 90 days so you can export everything, then it is archived and deleted."] },
      contact("legal@komputy.com"),
    ],
  },
  {
    slug: "privacy", title: "Privacy Policy", short: "Privacy", version: "3", updated: "1 November 2026",
    intro: "How Komputy collects, uses and protects personal data.",
    sections: [
      { id: "who-we-are", title: "Who we are", body: ["Komputy is a multi-tenant platform for IFRS reporting. We take the privacy and security of your data seriously."] },
      { id: "data-we-collect", title: "Data we collect", body: ["We collect information you provide, information about your use of our services, and technical information about your device."], table: { head: ["Data", "Purpose", "Retention"], rows: [["Contact details", "To respond to your enquiries", "Up to 2 years"], ["Account information", "To provide and improve our services", "Up to 7 years"], ["Usage data", "To analyse product usage", "Up to 2 years"], ["Technical data", "To ensure security and performance", "Up to 1 year"]] }, callout: "We never use customer financial data to train models." },
      { id: "how-we-use-it", title: "How we use it", body: ["We use your information to provide our services, improve our platform, ensure security and comply with legal obligations."] },
      { id: "where-stored", title: "Where it's stored", body: ["Your data is stored in secure data centres in the EU (Frankfurt), with regional hosting available on request."] },
      { id: "sharing", title: "Sharing", body: ["We only share your data with trusted service providers listed as subprocessors, and when required by law or a regulatory authority."] },
      { id: "retention", title: "Retention", body: ["We retain personal data for as long as necessary to fulfil the purposes in this policy, or as required by law."] },
      { id: "your-rights", title: "Your rights", body: ["You have the right to access, correct, delete or restrict the processing of your personal data. Contact us to exercise these rights."] },
      contact("privacy@komputy.com"),
    ],
  },
  {
    slug: "dpa", title: "Data Processing Agreement", short: "DPA", version: "2", updated: "1 November 2026",
    intro: "Terms under which Komputy processes personal data on your behalf.",
    sections: [
      { id: "roles", title: "Roles", body: ["Your organisation is the controller; Komputy is the processor of personal data contained in uploaded files."] },
      { id: "instructions", title: "Processing instructions", body: ["We process data only to provide the service and on your documented instructions."] },
      { id: "security-measures", title: "Security measures", body: ["Isolation per workspace, encryption in transit and at rest, MFA, access logging and approval-gated support access."] },
      { id: "subprocessors", title: "Subprocessors", body: ["Current subprocessors are listed on the Security page. We give 30 days' notice of changes."], table: { head: ["Provider", "Purpose", "Region"], rows: [["Cloud hosting provider", "Infrastructure and storage", "EU"], ["Email delivery provider", "Transactional emails", "EU"], ["Error monitoring", "Observability and alerts", "EU"]] } },
      { id: "breach", title: "Breach notification", body: ["We notify you without undue delay, and within 48 hours, of a personal-data breach affecting your workspace."] },
      { id: "deletion", title: "Return and deletion", body: ["At the end of the contract you can export everything; data is deleted after the 90-day read-only period."] },
      contact("privacy@komputy.com"),
    ],
  },
  {
    slug: "cookies", title: "Cookie Policy", short: "Cookies", version: "1", updated: "1 November 2026",
    intro: "Which cookies Komputy uses and why.",
    sections: [
      { id: "what", title: "What we use", body: ["Only cookies needed to run the service. No advertising cookies."], table: { head: ["Cookie", "Purpose", "Duration"], rows: [["Session", "Keeps you signed in", "Session"], ["Refresh token", "Renews your session securely", "Up to 30 days"], ["Theme", "Remembers light or dark mode (local storage)", "Until cleared"]] } },
      { id: "choices", title: "Your choices", body: ["Essential cookies can't be switched off without breaking sign-in. You can clear them in your browser at any time."] },
      contact("privacy@komputy.com"),
    ],
  },
];

export const legalDoc = (slug: string) => LEGAL.find((d) => d.slug === slug);
