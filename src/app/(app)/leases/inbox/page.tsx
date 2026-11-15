import type { Metadata } from "next";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { InboxLive } from "@/components/organisms/leases/Inbox";

export const metadata: Metadata = { title: "Approvals inbox" };

// LC-01.
export default function InboxPage() {
  return (
    <>
      <LeasesHeader active="/leases/inbox" title="Inbox" description="Items waiting for your approval. You can't approve what you prepared." />
      <InboxLive />
    </>
  );
}
