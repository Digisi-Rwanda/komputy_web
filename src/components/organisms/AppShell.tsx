import { Suspense, type ReactNode } from "react";
import { Sidebar, type SidebarProps } from "@/components/organisms/Sidebar";
import { MobileNav } from "@/components/organisms/MobileNav";
import { TopBar } from "@/components/organisms/TopBar";

const Fallback = ({ w }: { w: string }) => <div aria-hidden className={`h-full shrink-0 border-r border-line bg-sidebar ${w}`} />;

/** Signed-in frame (SH1/SH6): desktop sidebar (≥lg), tablet 72px rail (md-lg), phone drawer (<md); glass top bar; content max 1120px.
 *  URL-reading parts sit in Suspense (cacheComponents requirement). */
export function AppShell({ children, sidebar, notifications, banners }: { children: ReactNode; sidebar: SidebarProps; notifications: boolean; banners?: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <div className="hidden lg:flex"><Suspense fallback={<Fallback w="w-sidebar" />}><Sidebar {...sidebar} /></Suspense></div>
      <div className="hidden md:flex lg:hidden"><Suspense fallback={<Fallback w="w-sidebar-collapsed" />}><Sidebar {...sidebar} mode="rail" /></Suspense></div>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Suspense fallback={<div className="h-topbar shrink-0 border-b border-line" />}>
          <TopBar initials={sidebar.user.initials} image={sidebar.user.image} notifications={notifications} menu={<MobileNav sidebar={sidebar} />} />
        </Suspense>
        <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-content flex-1 flex-col gap-8 px-4 py-6 outline-none md:py-8 lg:px-8">
          {banners}
          {children}
        </main>
      </div>
    </div>
  );
}
