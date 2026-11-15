import "server-only";
import { db, schema, type Tx } from "@/server/db/client";
import { ulid } from "@/server/ids";
import { renderMessage, type MessageProps } from "./message";

/**
 * Durable email: rendered here, stored in `email_outbox` (in the caller's transaction when `tx` is given),
 * delivered by the engine's outbox dispatcher (Celery task `send_rendered_email`, retried on failure).
 */
export async function enqueueEmail(to: string, subject: string, message: MessageProps, tx?: Tx) {
  const { html, text } = renderMessage(message);
  await (tx ?? db).insert(schema.emailOutbox).values({ id: ulid(), taskName: "send_rendered_email", payload: { to, subject, html, text }, status: "pending", dispatchAttempts: 0 });
}
