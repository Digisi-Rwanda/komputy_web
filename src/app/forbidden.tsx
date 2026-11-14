import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { StateView } from "@/components/organisms/StateView";

// Rendered by forbidden() from the DAL: signed in, but this role can't open the page.
export default function Forbidden() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-4">
      <StateView icon="lock" title="You don't have access to this page" description="Ask a workspace administrator for the role you need." action={<Button asChild variant="secondary"><Link href="/home">Back to home</Link></Button>} />
    </main>
  );
}
