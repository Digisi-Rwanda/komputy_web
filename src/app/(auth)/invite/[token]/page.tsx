import Link from "next/link";
import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { AuthCard } from "@/components/organisms/auth/AuthCard";
import { InviteForm } from "@/components/organisms/auth/InviteForm";
import { getInvitePreview } from "@/server/dal/invites";

export const metadata = { title: "Join workspace" };

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// A6 invite landing: the token is the invitation id from the email link.
async function Invite({ params }: { params: PageProps<"/invite/[token]">["params"] }) {
  const inv = await getInvitePreview((await params).token);
  if (!inv?.usable) return (
    <AuthCard icon="clock" iconTone="warning" title="This invite has expired" sub={`Invites last 7 days.${inv ? ` Ask ${inv.inviter} to send a new one.` : ""}`}>
      <div className="flex flex-col items-center gap-3"><Button asChild variant="secondary" className="w-full"><Link href="/contact?topic=support">Request a new invite</Link></Button><Link href="/sign-in" className="text-small text-link hover:underline">Go to sign in</Link></div>
    </AuthCard>
  );
  return (
    <AuthCard title={<span className="flex flex-col items-center gap-3 text-center"><Avatar initials={inv.inviterInitials} size="xl" />{inv.inviter} invited you to join</span>}>
      <div className="mb-6 flex items-center gap-4 rounded-card border border-line p-4">
        <span className="inline-flex size-10 items-center justify-center rounded-md bg-surface"><Building2 className="size-5 text-fg" /></span>
        <div><p className="text-small text-fg">{inv.tenant}</p><p className="mt-1 flex flex-wrap gap-1"><Badge tone="info">Workspace: {cap(inv.workspaceRole)}</Badge>
          {Object.entries(inv.serviceRoles).filter(([, r]) => r !== "none").map(([s, r]) => <Badge key={s} tone={r === "reviewer" ? "positive" : undefined}>{s === "ecl" ? "ECL" : "Leases"}: {cap(r)}</Badge>)}</p></div>
      </div>
      <InviteForm invitationId={inv.id} email={inv.email} existing={inv.existingAccount} />
    </AuthCard>
  );
}

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return <Suspense fallback={<div className="skeleton h-96 w-[440px] rounded-panel" />}><Invite params={params} /></Suspense>;
}
