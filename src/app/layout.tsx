import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/organisms/Toaster";
import "./globals.css";

// Fonts from inspiration/landing2.html, committed as Latin woff2 (variable 400-500) so builds never hit the network.
const googleSans = localFont({ src: "./fonts/google-sans.woff2", variable: "--font-google-sans", weight: "400 500", display: "swap" });
const googleSansCode = localFont({ src: "./fonts/google-sans-code.woff2", variable: "--font-google-sans-code", weight: "400 500", display: "swap" });
const coustard = localFont({ src: "./fonts/coustard.woff2", variable: "--font-coustard", weight: "400", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://komputy.com"),
  applicationName: "Komputy",
  title: { default: "Komputy", template: "%s · Komputy" },
  description: "IFRS 9 expected credit loss and IFRS 16 lease accounting for banks and finance teams, from upload to sign off.",
  openGraph: { siteName: "Komputy", type: "website", locale: "en" },
  twitter: { card: "summary_large_image" },
};

// Applies saved appearance before first paint (no flash). Dark is the default; "system" follows the OS.
const themeScript = `try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="light"||(t==="system"&&matchMedia("(prefers-color-scheme: light)").matches))d.dataset.theme="light";if(localStorage.getItem("density")==="compact")d.dataset.density="compact";if(localStorage.getItem("motion")==="reduce")d.dataset.motion="reduce"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [googleSans, googleSansCode, coustard].map((f) => f.variable).join(" ");
  return (
    <html lang="en" className={`${fonts} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">Skip to content</a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
