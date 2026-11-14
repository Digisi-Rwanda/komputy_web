"use client";
import { useRouter } from "next/navigation";
import { requestEmailChange, setPhoto as savePhoto, updateProfile } from "@/lib/actions/account";
import { toSquareWebp } from "@/lib/image";
import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { SaveBar } from "@/components/molecules/SaveBar";

export interface ProfileData { name: string; title: string; phone: string; locale: string; timeZone: string; numberFormat: string; email: string; emailVerified: boolean; photo?: string | null }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** NA3 profile: photo, identity, locale; email change goes through verification. */
export function ProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const INIT = { name: profile.name, title: profile.title, phone: profile.phone, lang: profile.locale, tz: profile.timeZone, num: profile.numberFormat };
  const [saved, setSaved] = useState(INIT);
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState(INIT);
  const [photo, setPhoto] = useState<string | null>(profile.photo ?? null);
  const [newEmail, setNewEmail] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const changes = (Object.keys(v) as (keyof typeof v)[]).filter((k) => v[k] !== saved[k]).length;
  const f = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value })) });
  const nameErr = v.name.trim().length < 2 ? "Enter your full name" : undefined;
  const phoneErr = v.phone && !/^\+?[0-9 ()-]{7,20}$/.test(v.phone) ? "Use digits, spaces and an optional +" : undefined;
  return (
    <div className="flex max-w-2xl flex-col gap-6 pb-24">
      <div className="flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the DB */}
        {photo ? <img src={photo} alt="Your photo" className="size-24 rounded-full object-cover" /> : <Avatar initials={profile.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()} size="xl" />}
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload photo" onChange={async (e) => {
          const x = e.target.files?.[0]; e.target.value = "";
          if (!x) return; if (x.size > 10_000_000) { toast.error("Photo must be under 10 MB"); return; }
          try { const url = await toSquareWebp(x); const r = await savePhoto(url); if (!r.ok) { toast.error(r.error); return; } setPhoto(url); toast.success("Photo updated"); router.refresh(); } catch (err) { toast.error(err instanceof Error ? err.message : "Couldn't read that image."); }
        }} />
        <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => file.current?.click()}>Upload photo</Button><Button size="sm" variant="ghost" disabled={!photo} onClick={async () => { const r = await savePhoto(null); if (!r.ok) { toast.error(r.error); return; } setPhoto(null); toast.success("Photo removed"); router.refresh(); }}>Remove</Button></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Full name<Input {...f("name")} invalid={Boolean(nameErr)} maxLength={80} autoComplete="name" />{nameErr && <span className="text-micro text-negative">{nameErr}</span>}</label>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Job title<Input {...f("title")} maxLength={80} autoComplete="organization-title" /></label>
        <div className="flex flex-col gap-1.5 text-small text-fg-body sm:col-span-2"><span>Email</span>
          <span className="flex flex-wrap items-center gap-3"><span className="text-fg">{profile.email}</span>{profile.emailVerified && <span className="inline-flex items-center gap-1 text-micro text-positive"><CheckCircle2 className="size-3.5" />Verified</span>}
            <Modal title="Change email" description="We'll send a link to the new address. Your email changes once you click it." size="sm" trigger={<button type="button" className="text-link hover:underline">Change email</button>}
              footer={<Button loading={busy} disabled={!EMAIL.test(newEmail)} disabledReason={!EMAIL.test(newEmail) ? "Enter a valid email address" : undefined} onClick={async () => {
                setBusy(true); const r = await requestEmailChange(newEmail); setBusy(false);
                if (!r.ok) { toast.error(r.error); return; }
                setPending(newEmail); setNewEmail(""); toast.success(`Confirm the change from ${profile.email}`, { description: `Then verify ${newEmail}.` });
              }}>Send verification</Button>}>
              <label className="flex flex-col gap-1.5 text-small text-fg-body">New email<Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" /></label>
            </Modal></span>
          {pending && <span className="text-micro text-warning">Waiting for verification of {pending}</span>}</div>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Phone <span className="text-micro text-fg-muted">Optional</span><Input {...f("phone")} type="tel" invalid={Boolean(phoneErr)} autoComplete="tel" placeholder="+250 7…" />{phoneErr && <span className="text-micro text-negative">{phoneErr}</span>}</label>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Language<Select {...f("lang")}><option value="en">English</option><option value="fr">Français</option></Select></label>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Time zone<Select {...f("tz")}><option value="Africa/Kigali">Africa/Kigali (UTC+2)</option><option value="Africa/Nairobi">Africa/Nairobi (UTC+3)</option><option value="Africa/Lagos">Africa/Lagos (UTC+1)</option><option value="UTC">UTC</option></Select></label>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Number format<Select {...f("num")}><option value="1,234.56">1,234,567.89</option><option value="1 234,56">1 234 567,89</option><option value="1.234,56">1.234.567,89</option></Select></label>
      </div>
      <SaveBar changes={changes} onDiscard={() => setV(saved)} onSave={async () => {
        if (nameErr || phoneErr) { toast.error(nameErr ?? phoneErr!); return; }
        const r = await updateProfile({ name: v.name, title: v.title, phone: v.phone, locale: v.lang as "en" | "fr", timeZone: v.tz, numberFormat: v.num });
        if (!r.ok) { toast.error(r.error); return; }
        setSaved(v); toast.success("Profile saved"); router.refresh();
      }} />
    </div>
  );
}
