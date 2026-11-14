import { MarketingHeader } from "@/components/organisms/MarketingHeader";
import { MarketingFooter } from "@/components/organisms/MarketingFooter";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <MarketingHeader />
      <main id="main" className="overflow-x-clip">{children}</main>
      <MarketingFooter />
    </>
  );
}
