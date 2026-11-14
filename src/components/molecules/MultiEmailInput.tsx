"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { fieldBase } from "@/components/atoms/Input";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email tokens: Enter, comma or paste to add; invalid / disallowed-domain tokens shown in red. */
export function MultiEmailInput({ value, onChange, allowedDomains, id, placeholder = "name@company.com" }: { value: string[]; onChange: (v: string[]) => void; allowedDomains?: string[]; id?: string; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const bad = (e: string) => !EMAIL.test(e) || (allowedDomains && !allowedDomains.some((d) => e.endsWith("@" + d)));
  const add = (raw: string) => {
    const next = raw.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (next.length) onChange([...new Set([...value, ...next])]);
    setDraft("");
  };
  return (
    <div className={cn(fieldBase, "flex min-h-control flex-wrap items-center gap-1.5 p-1.5 focus-within:border-focus")}>
      {value.map((e) => (
        <span key={e} className={cn("inline-flex h-7 items-center gap-1 rounded-full pl-2.5 pr-1 text-micro", bad(e) ? "bg-negative-tint text-negative" : "bg-surface-active text-fg")}>
          {e}
          <button type="button" aria-label={`Remove ${e}`} onClick={() => onChange(value.filter((x) => x !== e))} className="inline-flex size-5 items-center justify-center rounded-full hover:bg-surface"><X className="size-3" /></button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        placeholder={value.length ? "" : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (["Enter", ",", " "].includes(e.key) && draft) { e.preventDefault(); add(draft); }
          if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft && add(draft)}
        onPaste={(e) => { e.preventDefault(); add(e.clipboardData.getData("text")); }}
        className="min-w-40 flex-1 bg-transparent px-1.5 text-small text-fg outline-none placeholder:text-fg-subtle"
      />
    </div>
  );
}
