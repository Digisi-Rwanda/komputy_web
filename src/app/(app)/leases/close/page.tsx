import type { Metadata } from "next";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { MonthEndClose } from "@/components/organisms/leases/Close";

export const metadata: Metadata = { title: "Month-end close" };

export default function Page() {
  return (
    <>
      <LeasesHeader active="/leases/close" title="Month-end close" description="Guided close with owners for each step." />
      <MonthEndClose />
    </>
  );
}
