import type { Metadata } from "next";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { Journals } from "@/components/organisms/leases/Journals";

export const metadata: Metadata = { title: "Journals" };

export default function Page() {
  return (
    <>
      <LeasesHeader  title="Journals" description="Monthly batches generated at close. Export to your ERP and record the posting." />
      <Journals />
    </>
  );
}
