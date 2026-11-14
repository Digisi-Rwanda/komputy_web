import { UPDATES } from "@/data/updates";

const BASE = "https://ledgerline.app";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const items = UPDATES.map((u) => `<item><title>${esc(`${u.version} — ${u.title}`)}</title><link>${BASE}/updates#${u.id}</link><guid>${BASE}/updates#${u.id}</guid><pubDate>${new Date(u.date).toUTCString()}</pubDate><description>${esc([u.summary, ...u.new].join(" "))}</description></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Ledgerline updates</title><link>${BASE}/updates</link><description>Product and methodology updates</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
