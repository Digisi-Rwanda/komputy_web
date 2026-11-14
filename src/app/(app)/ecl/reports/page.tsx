import type { Metadata } from "next";
import { PageHeader } from "@/components/organisms/PageHeader";
import { Reports } from "@/components/organisms/ecl/Reports";
import { getRuns, results } from "@/data/mock/index";

export const metadata: Metadata = { title: "Reports" };

// Reports & exports (blueprint §11.7, R13/R14).
export default function ReportsPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Reports" }]} title="Reports" description="Disclosure-ready packs per signed-off run." />
      <Reports runs={getRuns()} initial={results.recentExports} />
    </>
  );
}
