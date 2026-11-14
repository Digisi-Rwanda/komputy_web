"use client";
import { useState, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { fieldBase } from "@/components/atoms/Input";

/** Textarea with optional live character count (shown when maxLength is set). */
export function Textarea({ invalid, className, maxLength, onChange, defaultValue, value, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  const [len, setLen] = useState(String(value ?? defaultValue ?? "").length);
  return (
    <div className="relative">
      <textarea
        aria-invalid={invalid || undefined}
        maxLength={maxLength}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => { setLen(e.target.value.length); onChange?.(e); }}
        className={cn(fieldBase, "min-h-24 resize-y p-3", maxLength && "pb-7", className)}
        {...rest}
      />
      {maxLength && <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] text-fg-subtle">{len} / {maxLength}</span>}
    </div>
  );
}
