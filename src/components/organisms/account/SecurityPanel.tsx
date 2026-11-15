"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, Download, Monitor, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { CopyButton } from "@/components/atoms/CopyButton";
import { Input } from "@/components/atoms/Input";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Banner } from "@/components/molecules/Banner";
import { OtpInput } from "@/components/molecules/OtpInput";
import { PasswordField } from "@/components/molecules/PasswordField";
import { Stepper } from "@/components/molecules/Stepper";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { changePassword, disableMfa, revokeMySession, revokeOtherSessions, startMfaSetup, verifyMfaSetup } from "@/lib/actions/account";
import { download } from "@/lib/csv";
import { passwordOk } from "@/lib/password";

export interface SecurityProps {
  mfa: boolean;
  passwordChanged: string;
  mfaRequired: boolean;
  sessions: { id: string; name: string; mobile: boolean; current: boolean; lastSeen: string }[];
}

function Qr({ uri }: { uri: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => { QRCode.toString(uri, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then(setSvg).catch(() => setSvg("")); }, [uri]);
  return <div role="img" aria-label="QR code for your authenticator app" className="size-40 rounded-card bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** NA4 password, MFA enrol (password → scan → verify → save codes), sessions. Rules live in Better Auth + server actions. */
export function SecurityPanel({ mfa, passwordChanged, mfaRequired, sessions }: SecurityProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // 0 password · 1 scan · 2 verify · 3 save codes
  const [password, setPassword] = useState("");
  const [setup, setSetup] = useState<{ uri: string; secret: string; backupCodes: string[] } | null>(null);
  const [bad, setBad] = useState<string | null>(null);
  const [stored, setStored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ cur: "", next: "" });
  const [offOpen, setOffOpen] = useState(false);

  const reset = () => { setStep(0); setPassword(""); setSetup(null); setBad(null); setStored(false); };
  const begin = async () => {
    setBusy(true); const r = await startMfaSetup(password); setBusy(false);
    if (!r.ok) { setBad(r.error); return; }
    setSetup(r.data); setBad(null); setStep(1);
  };
  const verify = async (code: string) => {
    if (code.length < 6) { setBad("Enter all 6 digits."); return; }
    setBusy(true); const r = await verifyMfaSetup(code); setBusy(false);
    if (!r.ok) { setBad(r.error); return; }
    setBad(null); setStep(3);
  };
  const done = (msg: string) => { toast.success(msg); router.refresh(); };
  const steps = ["Password", "Scan", "Verify", "Save codes"].map((label) => ({ label }));

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {mfaRequired && !mfa && <Banner tone="warning">Your workspace requires two-factor authentication. Set it up to continue using Komputy.</Banner>}
      <section className="flex flex-wrap items-center gap-4 rounded-panel border border-line p-5"><div className="flex-1"><h2 className="text-h4">Password</h2><p className="text-small text-fg-muted">Last changed {passwordChanged}</p></div>
        <Modal open={pwOpen} onOpenChange={setPwOpen} title="Change password" size="sm" trigger={<Button variant="secondary">Change password</Button>}
          footer={<Button loading={busy} disabled={!pw.cur || !passwordOk(pw.next)} disabledReason={!passwordOk(pw.next) ? "Choose a stronger password" : undefined} onClick={async () => {
            setBusy(true); const r = await changePassword(pw.cur, pw.next); setBusy(false);
            if (!r.ok) { toast.error(r.error); return; }
            setPwOpen(false); setPw({ cur: "", next: "" }); done("Password changed · other sessions signed out");
          }}>Change password</Button>}>
          <div className="flex flex-col gap-4"><label className="flex flex-col gap-1.5 text-small text-fg-body">Current password<PasswordField id="pw-cur" name="cur" onValueChange={(v) => setPw((x) => ({ ...x, cur: v }))} /></label>
            <label className="flex flex-col gap-1.5 text-small text-fg-body">New password<PasswordField id="pw-new" name="next" meter autoComplete="new-password" onValueChange={(v) => setPw((x) => ({ ...x, next: v }))} /></label></div>
        </Modal></section>

      <section className="flex flex-wrap items-center gap-4 rounded-panel border border-line p-5"><div className="flex-1"><h2 className="flex items-center gap-2 text-h4">Two-factor authentication <StatusPill tone={mfa ? "positive" : "warning"}>{mfa ? "On" : "Off"}</StatusPill></h2><p className="text-small text-fg-muted">{mfa ? "Authenticator app · backup codes saved" : mfaRequired ? "Required by your workspace" : "Recommended for every account"}</p></div>
        {/* Keep the setup modal mounted while open: verifying refreshes props (mfa → true) before the codes step. */}
        {mfa && !open ? (
          <Modal open={offOpen} onOpenChange={(v) => { setOffOpen(v); if (!v) setPassword(""); }} title="Turn off two-factor authentication?" size="sm" description={mfaRequired ? "Your workspace requires MFA, so you'll be asked to set it up again straight away." : "Your account will be protected by your password only."}
            trigger={<Button variant="secondary">Turn off</Button>}
            footer={<Button variant="danger" loading={busy} disabled={!password} onClick={async () => { setBusy(true); const r = await disableMfa(password); setBusy(false); if (!r.ok) { toast.error(r.error); return; } setOffOpen(false); setPassword(""); done("Two-factor authentication is off"); }}>Turn off</Button>}>
            <label className="flex flex-col gap-1.5 text-small text-fg-body">Confirm your password<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          </Modal>
        ) : (
          <Modal open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }} title="Set up authenticator app" size="md" trigger={<Button>Set up authenticator app</Button>}
            footer={step === 0 ? <Button loading={busy} disabled={!password} onClick={begin}>Continue</Button>
              : step === 1 ? <Button onClick={() => setStep(2)}>Next</Button>
              : step === 2 ? <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              : <Button disabled={!stored} disabledReason={!stored ? "Confirm you've stored the codes" : undefined} onClick={() => { setOpen(false); reset(); done("Two-factor authentication is on"); }}>Finish</Button>}>
            <div className="flex flex-col gap-5">
              <Stepper current={step} steps={steps} />
              {step === 0 && <label className="flex flex-col gap-1.5 text-small text-fg-body">Confirm your password<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && password && begin()} autoComplete="current-password" autoFocus />{bad && <span role="alert" className="text-micro text-negative">{bad}</span>}</label>}
              {step === 1 && setup && <div className="flex flex-wrap items-center gap-5"><Qr uri={setup.uri} /><div className="flex flex-col gap-2 text-small text-fg-body"><p>Scan with Google Authenticator, 1Password or Authy.</p><p className="text-micro text-fg-muted">Can&apos;t scan? Enter this key:</p><p className="flex items-center gap-2 break-all font-mono text-fg">{setup.secret.replace(/(.{4})/g, "$1 ").trim()}<CopyButton value={setup.secret} label="Copy secret" /></p></div></div>}
              {step === 2 && <div className="flex flex-col items-center gap-3"><p className="text-small text-fg-body">Enter the 6-digit code from your app.</p><OtpInput invalid={Boolean(bad)} onComplete={verify} />{busy && <p className="text-micro text-fg-muted">Checking…</p>}{bad && <p role="alert" className="text-micro text-negative">{bad}</p>}</div>}
              {step === 3 && setup && <div className="flex flex-col gap-4"><p className="text-small text-fg-body">Each code works once. Store them somewhere safe, like your password manager.</p>
                <ol className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-card bg-raised p-4 font-mono text-small text-fg">{setup.backupCodes.map((c) => <li key={c}>{c}</li>)}</ol>
                <div className="flex gap-2"><Button size="sm" variant="secondary" icon={<Download />} onClick={() => download("komputy-backup-codes.txt", setup.backupCodes.join("\n"), "text/plain")}>Download</Button><Button size="sm" variant="secondary" icon={<Copy />} onClick={() => { navigator.clipboard?.writeText(setup.backupCodes.join("\n")).catch(() => {}); toast.success("Codes copied"); }}>Copy</Button></div>
                <Checkbox checked={stored} onCheckedChange={(v) => setStored(v === true)} label="I've stored these codes safely" /></div>}
            </div>
          </Modal>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-panel border border-line p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-h4">Active sessions</h2>
        <Button size="sm" variant="secondary" disabled={sessions.length < 2} onClick={async () => { const r = await revokeOtherSessions(); if (!r.ok) toast.error(r.error); else done("Signed out of all other sessions"); }}>Sign out all other sessions</Button></div>
        <ul className="divide-y divide-line">{sessions.map((s) => <li key={s.id} className="flex flex-wrap items-center gap-3 py-3 text-small">{s.mobile ? <Smartphone className="size-4 text-fg-muted" /> : <Monitor className="size-4 text-fg-muted" />}<span className="flex-1 text-fg">{s.name}</span>
          {s.current ? <StatusPill tone="positive">This device</StatusPill> : <><span className="text-micro text-fg-muted">{s.lastSeen}</span><Button size="sm" variant="ghost" onClick={async () => { const r = await revokeMySession(s.id); if (!r.ok) toast.error(r.error); else done(`Signed out ${s.name}`); }}>Sign out</Button></>}</li>)}</ul>
      </section>
    </div>
  );
}
