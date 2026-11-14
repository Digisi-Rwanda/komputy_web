import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { StateView } from "@/components/organisms/StateView";

// Rendered by unauthorized(): the session expired or was revoked mid-visit.
export default function Unauthorized() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-4">
      <StateView icon="lock" title="Your session ended" description="Sign in again to continue. Unsaved changes on this page were not kept." action={<Button asChild><Link href="/sign-in">Sign in</Link></Button>} />
    </main>
  );
}
