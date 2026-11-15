import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/atoms/Logo";
import { LiveDot } from "@/components/atoms/LiveDot";
import { StatusBanner } from "@/components/organisms/auth/StatusBanner";
import { Suspense } from "react";

// Auth layout (A1-A8): grid canvas, logo + "Back to site", centred content, faint bloom, legal/status footer. No marketing chrome.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bg-blueprint relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(0_114_245/0.14),transparent)] blur-3xl" />
      <Suspense><StatusBanner /></Suspense>
      <header className="relative flex items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Komputy home"><Logo /></Link>
        <Link href="/" className="inline-flex items-center gap-1 text-small text-fg-muted hover:text-fg">Back to site<ArrowRight aria-hidden className="size-4" /></Link>
      </header>
      <main id="main" className="relative flex flex-1 items-center justify-center px-4 py-10">{children}</main>
      <footer className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 pb-6 text-micro text-fg-muted">
        <span>© 2026 Komputy</span>·<Link href="/legal/terms" className="hover:text-fg">Terms</Link>·<Link href="/legal/privacy" className="hover:text-fg">Privacy</Link>·
        <Link href="/updates" className="inline-flex items-center gap-1.5 hover:text-fg">Status <LiveDot /> All systems normal</Link>
      </footer>
    </div>
  );
}
