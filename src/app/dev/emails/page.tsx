import type { Metadata } from "next";
import { EmailTemplates } from "@/components/organisms/account/Emails";

export const metadata: Metadata = { title: "Email templates" };

// NA6 previews (dev gallery).
export default function EmailsPage() {
  return <main id="main" className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12"><h1 className="text-h2">Transactional emails</h1><EmailTemplates /></main>;
}
