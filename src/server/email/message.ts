// NA6 email layout as an escaped HTML string: email clients need inline styles and tables, and React's
// server renderer isn't available in the RSC layer where Server Actions run.
export interface MessageProps { preview: string; headline: string; paragraphs: string[]; cta?: { label: string; href: string }; details?: [string, string][]; note?: string; footer?: string }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const font = "'Google Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const p = (text: string, style: string) => `<p style="margin:0;${style}">${esc(text)}</p>`;

export function renderMessage(m: MessageProps): { html: string; text: string } {
  const footer = m.footer ?? "You're receiving this because you have a Komputy account.";
  const rows = (m.details ?? []).map(([k, v]) => `<tr><td style="padding:8px 0;border-top:1px solid #1F1F1F;color:#8A8A8A;font-size:14px;width:120px">${esc(k)}</td><td style="padding:8px 0;border-top:1px solid #1F1F1F;color:#F0F0F0;font-size:14px">${esc(v)}</td></tr>`).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(m.headline)}</title></head>
<body style="margin:0;padding:32px 0;background:#0B0B0B;font-family:${font}">
<div style="display:none;max-height:0;overflow:hidden">${esc(m.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111111;border-radius:14px"><tr><td style="padding:32px">
${p("Komputy", "color:#FFFFFF;font-size:16px;font-weight:500;margin-bottom:24px")}
${p(m.headline, "color:#FFFFFF;font-size:28px;line-height:34px;font-weight:500;letter-spacing:-0.02em;margin-bottom:16px")}
${m.paragraphs.map((t) => p(t, "color:#F0F0F0;font-size:16px;line-height:24px;margin-bottom:12px")).join("\n")}
${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px">${rows}</table>` : ""}
${m.cta ? `<a href="${esc(m.cta.href)}" style="display:inline-block;background:#FFFFFF;color:#000000;border-radius:999px;padding:12px 24px;font-size:14px;font-weight:500;text-decoration:none;margin:8px 0 16px">${esc(m.cta.label)}</a>` : ""}
${m.note ? p(m.note, "color:#8A8A8A;font-size:14px;margin-bottom:8px") : ""}
<hr style="border:0;border-top:1px solid #1F1F1F;margin:24px 0 16px">
${p(`Komputy · ${footer}`, "color:#8A8A8A;font-size:12px")}
</td></tr></table></td></tr></table></body></html>`;
  const text = [m.headline, "", ...m.paragraphs, ...(m.details ?? []).map(([k, v]) => `${k}: ${v}`), ...(m.cta ? ["", `${m.cta.label}: ${m.cta.href}`] : []), ...(m.note ? ["", m.note] : []), "", `Komputy · ${footer}`].join("\n");
  return { html, text };
}
