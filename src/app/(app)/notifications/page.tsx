import type { Metadata } from "next";
import { PageHeader } from "@/components/organisms/PageHeader";
import { NotificationsPage } from "@/components/organisms/account/NotificationsPage";

export const metadata: Metadata = { title: "Notifications" };

// NA1.2.
export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Notifications" }]} title="Notifications" />
      <NotificationsPage />
    </>
  );
}
