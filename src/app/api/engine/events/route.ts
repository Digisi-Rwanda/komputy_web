import { connection } from "next/server";
import { sql } from "@/server/db/client";
import { getPrincipal } from "@/server/session";

// Live engine progress for the signed-in workspace (Server-Sent Events). The engine NOTIFYs `engine_events`;
// we LISTEN once per stream and forward only this tenant's events. EventSource reconnects on its own.
export async function GET(req: Request) {
  await connection();
  const p = await getPrincipal();
  if (!p?.tenantId) return new Response("Unauthorized", { status: 401 });
  const tenantId = p.tenantId, enc = new TextEncoder();
  let stop = () => {};
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (s: string) => { try { ctrl.enqueue(enc.encode(s)); } catch { stop(); } };
      send(`retry: 3000\n: connected\n\n`);
      const sub = await sql.listen("engine_events", (payload) => {
        try {
          const e = JSON.parse(payload) as { tenantId?: string };
          if (e.tenantId === tenantId) send(`data: ${payload}\n\n`);
        } catch { /* ignore malformed */ }
      });
      const ping = setInterval(() => send(`: ping\n\n`), 25_000); // keep proxies from closing idle streams
      stop = () => { clearInterval(ping); void sub.unlisten(); try { ctrl.close(); } catch {} };
      req.signal.addEventListener("abort", stop);
    },
    cancel() { stop(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}
