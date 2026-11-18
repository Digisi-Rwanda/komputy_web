// Appearance prefs: stored per browser, applied as data-* on <html> (read pre-paint by the script in app/layout.tsx).
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked: applies for this page only */ } };

export const readPrefs = () => ({ density: get("density") ?? "comfortable", motion: get("motion") === "reduce", negatives: get("negatives") ?? "parens" });

export function applyDensity(d: string) { put("density", d); if (d === "compact") document.documentElement.dataset.density = "compact"; else delete document.documentElement.dataset.density; }
export function applyMotion(reduce: boolean) { put("motion", reduce ? "reduce" : ""); if (reduce) document.documentElement.dataset.motion = "reduce"; else delete document.documentElement.dataset.motion; }
// shortcut: stored only; server-rendered figures keep (1,240.00) until formatting reads a user setting from the backend.
export const saveNegatives = (v: string) => put("negatives", v);
