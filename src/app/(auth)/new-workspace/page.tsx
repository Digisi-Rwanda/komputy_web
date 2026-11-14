import { Suspense } from "react";
import { AuthCard } from "@/components/organisms/auth/AuthCard";
import { NewWorkspaceForm } from "@/components/organisms/auth/NewWorkspaceForm";
import { requireUser } from "@/server/session";

export const metadata = { title: "New workspace" };

async function Body() {
  const p = await requireUser();
  return <AuthCard title="Create a workspace" sub={`You'll be the owner · signed in as ${p.email}`}><NewWorkspaceForm /></AuthCard>;
}

export default function NewWorkspacePage() {
  return <Suspense fallback={<div className="skeleton h-96 w-[440px] rounded-panel" />}><Body /></Suspense>;
}
