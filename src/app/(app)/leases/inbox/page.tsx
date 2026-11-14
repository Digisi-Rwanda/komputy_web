import type { Metadata } from "next";
import { Inbox } from "@/components/organisms/leases/Inbox";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { leaseData } from "@/data/mock/index";

export const metadata: Metadata = { title: "Approvals inbox" };

// LC-01.
export default function InboxPage() {
  return (
    <>
      <LeasesHeader active="/leases/inbox" title="Inbox" description="Items waiting for your approval. You can't approve what you prepared." />
      <Inbox waiting={leaseData.inbox} mine={leaseData.mySubmissions} />
    </>
  );
}
