import type { Metadata } from "next";
import { Imports } from "@/components/organisms/leases/Imports";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";

export const metadata: Metadata = { title: "Imports" };

// LC-02.
export default function ImportsPage() {
  return (
    <>
      <LeasesHeader title="Imports" description="Bulk create leases from Excel or CSV. Rows land as drafts." />
      <Imports />
    </>
  );
}
