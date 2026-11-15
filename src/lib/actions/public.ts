"use server";
import { and, eq, gt, sql } from "drizzle-orm";
import { audit } from "@/server/audit";
import { db, schema } from "@/server/db/client";
import { enqueueEmail } from "@/server/email/enqueue";
import { ulid } from "@/server/ids";
import { allow } from "@/server/ratelimit";
import { contactFromForm, isEmail, SERVICE_IDS, validateContact, type Errors } from "@/lib/validation";
import { service as svcInfo } from "@/lib/services";

export type ContactState = { ok: true; reference: string; name: string } | { ok: false; errors: Errors } | null;
export type SimpleState = { ok: true; email: string } | { ok: false; error: string } | null;

const TOO_MANY = "Too many requests from this network. Try again in a few minutes.";
const code = (id: string) => `REQ-${id.slice(-4)}`;
const TYPE: Record<string, string> = { quote: "Quote", trial: "Trial", demo: "Quote", support: "Quote" };

/** Same email + kind within 10 minutes → the existing request (double submits, retries). */
async function recent(email: string, kind: string) {
  const [r] = await db.select({ id: schema.accessRequests.id, code: schema.accessRequests.code }).from(schema.accessRequests)
    .where(and(eq(schema.accessRequests.kind, kind), sql`lower(${schema.accessRequests.details}->>'email') = ${email.toLowerCase()}`, gt(schema.accessRequests.createdAt, new Date(Date.now() - 10 * 6e4))));
  return r;
}

/** Contact / quote form → a new lead in the platform pipeline (PA5) + acknowledgement email. */
export async function submitContact(_: ContactState, form: FormData): Promise<ContactState> {
  if (form.get("website")) return { ok: true, reference: "REQ-0000", name: "" }; // honeypot: bots fill hidden fields
  const input = contactFromForm(form);
  const errors = validateContact(input);
  if (Object.keys(errors).length) return { ok: false, errors };
  const first = input.name.trim().split(" ")[0];
  const dupe = await recent(input.email, "lead");
  if (dupe) return { ok: true, reference: dupe.code, name: first };
  if (!(await allow("contact", 5, 3600))) return { ok: false, errors: { message: TOO_MANY } };
  const id = ulid(), names = input.services.map((s) => svcInfo(s as (typeof SERVICE_IDS)[number]).name);
  await db.transaction(async (tx) => {
    await tx.insert(schema.accessRequests).values({ id, code: code(id), kind: "lead", scope: "platform", status: "new", service: input.services[0] ?? null, source: `Website · ${input.topic || "contact"}${input.pkg ? ` · ${input.pkg}` : ""}`,
      details: { title: `${input.company} · ${TYPE[input.topic] ?? "Quote"}`, type: TYPE[input.topic] ?? "Quote", company: input.company.trim(), country: input.country, services: names, size: input.size, message: input.message.trim() || undefined, time: input.time || undefined, contact: `${input.name.trim()} · ${input.email.trim()}`, email: input.email.trim() } });
    await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: id, actorId: null, kind: "created", note: `Website form (${input.topic || "contact"})` });
    await enqueueEmail(input.email.trim(), `We got your request · ${code(id)}`, {
      preview: "Thanks, we'll be in touch within one business day", headline: `Thanks, ${first}`,
      paragraphs: ["We received your request and an account manager will reply within one business day.", "Reply to this email if you want to add anything."],
      details: [["Reference", code(id)], ["Company", input.company.trim()], ["Services", names.join(", ")], ...(input.time ? [["Best time", input.time] as [string, string]] : [])],
      footer: "You're receiving this because you contacted Komputy.",
    }, tx);
    await audit({ event: "lead.created", userId: null, tenantId: null, details: { requestId: id, topic: input.topic } }, tx);
  });
  return { ok: true, reference: code(id), name: first };
}

/** Newsletter: a consent record (scope `list`, never shown in the sales pipeline). Idempotent per email. */
export async function subscribe(_: SimpleState, form: FormData): Promise<SimpleState> {
  if (form.get("website")) return { ok: true, email: "" };
  const email = String(form.get("email") ?? "").trim().slice(0, 254);
  if (!isEmail(email)) return { ok: false, error: "Enter a valid email address." };
  const [exists] = await db.select({ id: schema.accessRequests.id }).from(schema.accessRequests).where(and(eq(schema.accessRequests.kind, "newsletter"), sql`lower(${schema.accessRequests.details}->>'email') = ${email.toLowerCase()}`));
  if (exists) return { ok: true, email };
  if (!(await allow("subscribe", 10, 3600))) return { ok: false, error: TOO_MANY };
  const id = ulid();
  await db.insert(schema.accessRequests).values({ id, code: code(id), kind: "newsletter", scope: "list", status: "subscribed", source: "Website footer", details: { email, consentAt: new Date().toISOString() } });
  return { ok: true, email };
}

/** Waitlist for a service that isn't live yet → pipeline lead typed "Waitlist" + confirmation email. */
export async function joinWaitlist(_: SimpleState, form: FormData): Promise<SimpleState> {
  if (form.get("website")) return { ok: true, email: "" };
  const email = String(form.get("email") ?? "").trim().slice(0, 254);
  const service = String(form.get("service") ?? "");
  if (!isEmail(email)) return { ok: false, error: "Enter a valid email address." };
  if (!(SERVICE_IDS as readonly string[]).includes(service)) return { ok: false, error: "Unknown service." };
  const [exists] = await db.select({ id: schema.accessRequests.id }).from(schema.accessRequests).where(and(eq(schema.accessRequests.kind, "waitlist"), eq(schema.accessRequests.service, service), sql`lower(${schema.accessRequests.details}->>'email') = ${email.toLowerCase()}`));
  if (exists) return { ok: true, email };
  if (!(await allow("waitlist", 10, 3600))) return { ok: false, error: TOO_MANY };
  const id = ulid(), name = svcInfo(service as (typeof SERVICE_IDS)[number]).name, domain = email.split("@")[1];
  await db.transaction(async (tx) => {
    await tx.insert(schema.accessRequests).values({ id, code: code(id), kind: "waitlist", scope: "platform", status: "new", service, source: "Website waitlist", details: { title: `${domain} · Waitlist`, type: "Waitlist", company: domain, services: [name], size: "", contact: email, email } });
    await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: id, actorId: null, kind: "created", note: `Joined the ${name} waitlist` });
    await enqueueEmail(email, `You're on the ${name} waitlist`, { preview: "We'll email you when it opens", headline: "You're on the list", paragraphs: [`We'll email you as soon as ${name} opens. No other emails.`], footer: "You're receiving this because you joined a Komputy waitlist." }, tx);
  });
  return { ok: true, email };
}
