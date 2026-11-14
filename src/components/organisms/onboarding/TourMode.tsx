"use client";
import { useEffect } from "react";
import { Banner } from "@/components/molecules/Banner";
import { Button } from "@/components/atoms/Button";
import Link from "next/link";
import { update } from "@/hooks/useOnboarding";

/** O3: unverified users explore read-only; starts the tour once. */
export function TourMode() {
  useEffect(() => { update((s) => (s.tourStep == null ? { tourStep: 0 } : {})); }, []);
  return <Banner tone="info" action={<Button asChild variant="link" size="sm"><Link href="/verify-email-pending">Resend email</Link></Button>}>Verify your email to upload files. You can explore everything else.</Banner>;
}
