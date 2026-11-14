// Wizard step slugs (shared by server routes and client components; no "use client" so servers get the real array).
export const STEPS = ["setup", "pd", "lgd", "ead", "review", "compute", "sign-off"] as const;
export type Step = (typeof STEPS)[number];
