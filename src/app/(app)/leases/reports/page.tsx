import type { Metadata } from "next";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { LeaseReports } from "@/components/organisms/leases/LeaseReports";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return (
    <>
      <LeasesHeader  title="Reports" description="Roll-forward, maturity and IFRS 16 disclosures for Oct 2026." />
      <LeaseReports />
    </>
  );
}
