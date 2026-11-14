// Password strength (blueprint §7.1). Breach check here is a local common-password list;
// shortcut: local list only, upgrade to the backend's check_password_pwned (HIBP k-anonymity) when wired.
const COMMON = new Set(["password", "password1", "password123", "123456789012", "qwertyuiop12", "letmein12345", "welcome12345", "ledgerline", "ledgerline2026", "iloveyou1234", "admin1234567", "passw0rd1234"]);

export interface Strength { score: 0 | 1 | 2 | 3 | 4; label: "Too weak" | "Weak" | "Fair" | "Strong" | "Very strong"; checks: { long: boolean; mixed: boolean; notBreached: boolean } }

export function strength(pw: string): Strength {
  const long = pw.length >= 12;
  const mixed = /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);
  const notBreached = pw.length > 0 && !COMMON.has(pw.toLowerCase());
  let score = 0;
  if (pw.length >= 8) score++;
  if (long) score++;
  if (mixed) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 16) score++;
  if (!notBreached) score = 0;
  const s = Math.min(4, score) as Strength["score"];
  return { score: s, label: (["Too weak", "Weak", "Fair", "Strong", "Very strong"] as const)[s], checks: { long, mixed, notBreached } };
}

/** Accepted when long enough, not breached and at least "Fair". */
export const passwordOk = (pw: string) => { const s = strength(pw); return s.checks.long && s.checks.notBreached && s.score >= 2; };
