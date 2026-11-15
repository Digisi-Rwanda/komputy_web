import { Suspense } from "react";
import { Banner } from "@/components/molecules/Banner";
import { LeaseDataProvider } from "@/components/organisms/leases/LeaseData";
import { getLeaseBook } from "@/server/dal/leases";
import { requireMember } from "@/server/session";

// Every lease screen reads the same book (engine state + portfolio), fetched once per request.
async function Load({ children }: { children: React.ReactNode }) {
  const p = await requireMember("leases.view");
  const book = await getLeaseBook(p);
  if (!book.ok) return <Banner tone="negative">{book.error}</Banner>;
  return <LeaseDataProvider value={book.data}>{children}</LeaseDataProvider>;
}

export default function LeasesLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Load>{children}</Load></Suspense>;
}
