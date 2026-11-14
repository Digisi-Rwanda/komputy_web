"use client";
import { States } from "@/components/organisms/StateView";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-4">
      <div className="w-full"><States.PageError refId={error.digest ?? "client"} onRetry={reset} /></div>
    </main>
  );
}
