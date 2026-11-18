import { Logo } from "@/components/atoms/Logo";

export const metadata = { title: "Tokens" };

// DS1 board rendered from the live tokens (app/globals.css). Toggle theme to check light.
const GROUPS: [string, string[]][] = [
  ["Surfaces", ["canvas-deep", "canvas", "raised", "sidebar", "surface", "surface-hover", "surface-active"]],
  ["Text", ["fg", "fg-body", "fg-muted", "fg-subtle"]],
  ["Lines & focus", ["line", "line-strong", "focus"]],
  ["Actions", ["primary", "secondary", "accent", "link"]],
  ["Signals", ["positive", "warning", "negative", "info", "positive-tint", "warning-tint", "negative-tint", "info-tint"]],
  ["IFRS 9 stages", ["stage-1", "stage-2", "stage-3"]],
  ["Services", ["svc-ecl", "svc-leases", "svc-soon"]],
  ["Charts", ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-grid"]],
];
const TYPE = ["display", "h1", "h2", "h3", "h4", "body-lg", "body", "small", "micro", "label"];
const RADII = ["input", "card", "panel", "pill"];

export default function TokensPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-site flex-col gap-12 px-4 py-10 lg:px-6">
      <header className="flex items-center gap-4"><Logo /><span className="label-mono">DS1 · foundations</span><span className="ml-auto"></span></header>

      {GROUPS.map(([title, names]) => (
        <section key={title} className="flex flex-col gap-4">
          <h2 className="label-mono">{title}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {names.map((n) => (
              <div key={n} className="flex flex-col gap-2">
                <div className="h-16 rounded-card border border-line" style={{ background: `var(--${n})` }} />
                <span className="font-mono text-micro text-fg-body">{n}</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-4">
        <h2 className="label-mono">Type · Google Sans 400/500, −0.02em</h2>
        {TYPE.map((t) => (
          <div key={t} className="flex items-baseline gap-6 border-b border-line pb-3">
            <span className="w-20 shrink-0 font-mono text-micro text-fg-muted">{t}</span>
            <span className={`truncate text-fg ${t === "label" ? "label-mono" : `text-${t}`}`}>Expected credit loss 12,846,210.55</span>
          </div>
        ))}
        <p className="font-mono text-body text-fg">Mono · RUN 0142 · v1.3.0 · 9f2c…a71</p>
        <p className="font-serif text-h1 text-fg">Coustard 404</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="label-mono">Radii · depth</h2>
        <div className="flex flex-wrap gap-4">
          {RADII.map((r) => <div key={r} className={`flex h-20 w-32 items-end border border-line-strong bg-surface p-2 font-mono text-micro text-fg-muted rounded-${r}`}>{r}</div>)}
          <div className="ring-inner flex h-20 w-32 items-end rounded-card bg-raised p-2 font-mono text-micro text-fg-muted">inner ring</div>
          <div className="bg-overlay flex h-20 w-32 items-end rounded-card border border-line p-2 font-mono text-micro text-fg-muted">overlay</div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="label-mono">Devices</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-blueprint h-40 rounded-panel border border-line" />
          <div className="bg-blueprint fade-y h-40 rounded-panel border border-line" />
          <div className="skeleton h-40 rounded-panel" />
        </div>
      </section>
    </main>
  );
}
