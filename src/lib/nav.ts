import type { NavItem } from "@/types/ui";

// Single source of truth for app + platform navigation (sidebar, breadcrumbs, command palette).
export const APP_NAV: NavItem[] = [
  { label: "Home", href: "/home", icon: "home" },
  {
    label: "Expected Credit Loss", href: "/ecl", icon: "ecl",
    children: [
      { label: "Overview", href: "/ecl" },
      { label: "Runs", href: "/ecl/runs" },
      { label: "New run", href: "/ecl/runs/new" },
      { label: "Results", href: "/ecl/results" },
      { label: "Reports", href: "/ecl/reports" },
      { label: "Setup", href: "/ecl/setup/segments" },
    ],
  },
  {
    label: "Lease Accounting", href: "/leases", icon: "leases",
    children: [
      { label: "Overview", href: "/leases" },
      { label: "Register", href: "/leases/register" },
      { label: "Inbox", href: "/leases/inbox" },
      { label: "New lease", href: "/leases/new" },
      { label: "Imports", href: "/leases/imports" },
      { label: "Month-end close", href: "/leases/close" },
      { label: "Journals", href: "/leases/journals" },
      { label: "Reports", href: "/leases/reports" },
      { label: "Setup", href: "/leases/setup" },
    ],
  },
  { label: "Tax Provision", href: "/locked/tax", icon: "tax", badge: "Soon" },
];

export const APP_NAV_FOOTER: NavItem[] = [
  { label: "Activity", href: "/activity", icon: "activity" },
  { label: "Admin", href: "/admin", icon: "admin" },
  { label: "Help", href: "/help", icon: "help" },
];

export const PLATFORM_NAV: NavItem[] = [
  { label: "Overview", href: "/platform", icon: "home" },
  { label: "Workspaces", href: "/platform/workspaces", icon: "workspaces" },
  { label: "Requests", href: "/platform/requests", icon: "requests", badge: "6" },
  { label: "Services & plans", href: "/platform/services", icon: "services" },
  { label: "Users", href: "/platform/users", icon: "users" },
  { label: "Engines", href: "/platform/engines", icon: "engines" },
  { label: "Health", href: "/platform/health", icon: "health" },
  { label: "Audit", href: "/platform/audit", icon: "audit" },
];

export const MARKETING_NAV: NavItem[] = [
  { label: "Services", href: "/services/ecl" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Updates", href: "/updates" },
];

export const TABS = {
  run: ["summary", "results", "exceptions", "reconciliation", "inputs", "methodology", "outputs", "audit"],
  eclSetup: ["segments", "collateral", "thresholds", "templates"],
  lease: ["summary", "schedule", "journals", "events", "documents", "audit"],
  admin: ["overview", "members", "services", "requests", "profile", "security", "audit-log", "danger-zone"],
  account: ["profile", "security", "notifications", "appearance", "workspaces"],
  platformWorkspace: ["summary", "services", "members", "usage", "requests", "support-access", "audit"],
} as const;

export const RUN_WIZARD_STEPS = ["setup", "pd", "lgd", "ead", "review", "compute", "sign-off"] as const;
export const LEASE_WIZARD_STEPS = ["contract", "terms", "payments", "rate", "judgements", "preview", "submit"] as const;

/** "danger-zone" -> "Danger zone" */
export const titleCase = (slug: string) => (slug.charAt(0).toUpperCase() + slug.slice(1)).replace(/-/g, " ");

export function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/ecl" && href !== "/leases" && pathname.startsWith(href + "/"));
}

const SECTION: Record<string, string> = { home: "Home", ecl: "Expected Credit Loss", leases: "Lease Accounting", admin: "Admin", account: "Account", notifications: "Notifications", activity: "Activity", help: "Help", locked: "Services", platform: "Platform" };

/** Breadcrumb trail for the top bar from the path, using nav labels where known. */
export function crumbsFor(path: string): { label: string; href?: string }[] {
  const all = [...APP_NAV, ...APP_NAV_FOOTER, ...PLATFORM_NAV].flatMap((n) => [n, ...(n.children ?? [])]);
  const parts = path.split("/").filter(Boolean);
  return parts.map((p, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label = i === 0 ? SECTION[p] ?? titleCase(p) : all.find((n) => n.href === href)?.label ?? (/^[A-Z]{2,}-\d+/.test(p) ? p : titleCase(decodeURIComponent(p)));
    return { label, href: i < parts.length - 1 ? href : undefined };
  });
}
