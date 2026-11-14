import { Suspense } from "react";
import { AppShell } from "@/components/organisms/AppShell";
import { Logo } from "@/components/atoms/Logo";
import { Badge } from "@/components/atoms/Badge";
import { Banner } from "@/components/molecules/Banner";
import { PLATFORM_NAV } from "@/lib/nav";
import { requireStaff } from "@/server/session";

const ROLE = { admin: "Platform admin", sales: "Sales", support: "Support" } as const;

// Platform staff console. Staff see counts and metadata only; client results need an approved support session.
async function Console({ children }: { children: React.ReactNode }) {
  const p = await requireStaff();
  return (
    <AppShell
      notifications={false}
      banners={<Banner tone="info">Platform staff see counts and metadata only. Client results require an approved support session.</Banner>}
      sidebar={{
        nav: PLATFORM_NAV,
        user: { name: p.name, initials: p.name.split(/[\s.]+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase(), role: ROLE[p.staff] },
        header: <span className="flex flex-1 items-center gap-2"><Logo /><Badge mono tone="info">Platform</Badge></span>,
      }}
    >
      {children}
    </AppShell>
  );
}

export default function PlatformLayout({ children }: LayoutProps<"/platform">) {
  return <Suspense fallback={<div className="flex h-dvh"><div className="skeleton hidden w-[264px] md:block" /><div className="flex-1 p-8"><div className="skeleton h-96 rounded-panel" /></div></div>}><Console>{children}</Console></Suspense>;
}
