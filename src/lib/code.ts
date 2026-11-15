// Komputy record and rule codes are stored and linked as `L-0012`, `JB-202611-001`, `REQ-G6HW`, `PD-01`.
// People read them without a dash: `L 0012`. Only for Komputy's own codes, never for customer data (loan IDs).
export const showCode = (code: string | null | undefined): string => (code ?? "").replace(/-(?=[A-Z0-9])/g, " ");

/** The same inside free text (audit entries, support reasons): "Signed off L-0012" -> "Signed off L 0012". */
export const codesInText = (text: string): string => text.replace(/\b[A-Z]{1,5}(?:-[A-Z0-9]+)+\b/g, showCode);
