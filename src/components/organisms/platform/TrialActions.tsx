"use client";
import { Button } from "@/components/atoms/Button";
import { EntitlementDrawer } from "@/components/organisms/platform/EntitlementDrawer";

export function TrialActions({ ws, tenantId, service }: { ws: string; tenantId: string; service: "ecl" | "leases" }) {
  return (
    <span className="flex gap-2">
      <EntitlementDrawer kind="extend" ws={ws} tenantId={tenantId} service={service} trigger={<Button size="sm" variant="secondary">Extend</Button>} />
      <EntitlementDrawer kind="activate" ws={ws} tenantId={tenantId} service={service} trigger={<Button size="sm">Activate</Button>} />
    </span>
  );
}
