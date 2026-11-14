// Setup checklist (blueprint §8). Groups appear only for services the workspace can use.
import type { ServiceId } from "@/types/domain";

export interface Task { id: string; label: string; hint?: string; action: { label: string; href: string; primary?: boolean; download?: boolean } }
export interface Group { id: string; title: string; service?: ServiceId; tasks: Task[] }

export const GROUPS: Group[] = [
  { id: "workspace", title: "Workspace", tasks: [
    { id: "verify-email", label: "Verify your email", action: { label: "Resend", href: "/verify-email-pending" } },
    { id: "profile", label: "Confirm company profile", hint: "currency RWF, year end 31 Dec", action: { label: "Review", href: "/admin/profile" } },
    { id: "invite", label: "Invite your team", hint: "reviewers sign off, analysts upload", action: { label: "Invite", href: "/admin/members" } },
    { id: "mfa", label: "Turn on two-step verification", hint: "recommended", action: { label: "Set up", href: "/account/security" } },
  ] },
  { id: "ecl", title: "Expected Credit Loss", service: "ecl", tasks: [
    { id: "ecl-segments", label: "Define segments", hint: "or detect them from your first PD file", action: { label: "Define", href: "/ecl/setup/segments" } },
    { id: "ecl-collateral", label: "Add collateral types", action: { label: "Add", href: "/ecl/setup/collateral" } },
    { id: "ecl-templates", label: "Download the three templates", action: { label: "Download", href: "/ecl/setup/templates" } },
    { id: "ecl-first-run", label: "Run your first calculation", action: { label: "Try with sample data", href: "/ecl/sample?run=1", primary: true } },
  ] },
  { id: "leases", title: "Lease Accounting", service: "leases", tasks: [
    { id: "ls-entity", label: "Add legal entity", action: { label: "Add", href: "/leases/setup" } },
    { id: "ls-gl", label: "Map GL accounts", action: { label: "Map", href: "/leases/setup" } },
    { id: "ls-policies", label: "Set policies & discount rate curves", action: { label: "Set", href: "/leases/setup" } },
    { id: "ls-period", label: "Open first period", action: { label: "Open", href: "/leases/setup" } },
    { id: "ls-first", label: "Add or import your first lease", action: { label: "Add lease", href: "/leases/new" } },
  ] },
];
