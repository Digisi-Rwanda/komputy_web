import type { Metadata } from "next";
import { ForgotForm } from "@/components/organisms/auth/ResetForms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };
export default function ForgotPage() { return <ForgotForm />; }
