import { connection } from "next/server";

/** A1.4 backend-down banner. Probes BACKEND_URL/ready when configured (blueprint §7.2); silent when up or unset. */
export async function StatusBanner() {
  const url = process.env.BACKEND_URL;
  if (!url) return null;
  await connection();
  let up = false;
  try { up = (await fetch(`${url}/ready`, { cache: "no-store", signal: AbortSignal.timeout(2000) })).ok; } catch { up = false; }
  if (up) return null;
  return <div role="status" className="relative border-b border-warning/40 bg-warning-tint px-4 py-2.5 text-center text-small text-fg">Komputy is updating. Sign-in is back in about 10 minutes. <a href="/updates" className="text-link hover:underline">Status page</a></div>;
}
