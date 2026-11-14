// Shared form validation for public-site forms (runs in the browser and again in the server action).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FREE = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com"]);

export const isEmail = (v: string) => EMAIL.test(v.trim());
export const isWorkEmail = (v: string) => isEmail(v) && !FREE.has(v.trim().toLowerCase().split("@")[1]);

export const SERVICE_IDS = ["ecl", "leases", "lease-planning", "tax", "doc-intel", "erp"] as const;
export const TOPICS = ["sales", "quote", "waitlist", "design-partner", "support"] as const;

export interface ContactInput {
  name: string; email: string; company: string; country: string; services: string[]; size: string;
  message: string; time: string; consent: boolean; topic: string; pkg: string;
}
export type Errors = Partial<Record<keyof ContactInput, string>>;

export function validateContact(v: ContactInput): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (!isEmail(v.email)) e.email = "Enter a valid email address.";
  else if (!isWorkEmail(v.email)) e.email = "Use your work email address.";
  if (v.company.trim().length < 2) e.company = "Enter your company.";
  if (!v.country) e.country = "Choose your country.";
  if (!v.services.length) e.services = "Pick at least one service.";
  else if (v.services.some((s) => !(SERVICE_IDS as readonly string[]).includes(s))) e.services = "Unknown service selected.";
  if (v.message.length > 2000) e.message = "Keep the message under 2,000 characters.";
  if (!v.consent) e.consent = "Please agree to be contacted.";
  return e;
}

export function contactFromForm(f: FormData): ContactInput {
  const s = (k: string) => String(f.get(k) ?? "").slice(0, 2000);
  return {
    name: s("name"), email: s("email"), company: s("company"), country: s("country"), services: f.getAll("services").map(String),
    size: s("size"), message: s("message"), time: s("time"), consent: f.get("consent") === "on", topic: s("topic"), pkg: s("package"),
  };
}
