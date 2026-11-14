import type { Service } from "@/types/domain";

export const SERVICES: Service[] = [
  { id: "ecl", name: "Expected Credit Loss", short: "ECL", standard: "IFRS 9", description: "PD, LGD and EAD to a signed-off provision.", live: true },
  { id: "leases", name: "Lease Accounting", short: "Leases", standard: "IFRS 16", description: "Schedules, journals, month-end close and disclosures.", live: true },
  { id: "lease-planning", name: "Lease Planning & Analytics", short: "Planning", standard: "IFRS 16", description: "Scenario and portfolio planning for leases.", live: false },
  { id: "tax", name: "Tax Provision", short: "Tax", standard: "IAS 12", description: "Current and deferred tax provisioning.", live: false },
  { id: "doc-intel", name: "Document Intelligence", short: "Docs", standard: "", description: "Extract lease and loan terms from documents.", live: false },
  { id: "erp", name: "ERP Connect", short: "ERP", standard: "", description: "Post journals straight to your ERP.", live: false },
];

export const service = (id: Service["id"]) => SERVICES.find((s) => s.id === id)!;
