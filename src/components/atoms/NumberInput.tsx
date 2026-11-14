"use client";
import { useState } from "react";
import { money } from "@/lib/format";
import { Input, type InputProps } from "@/components/atoms/Input";

interface Props extends Omit<InputProps, "value" | "defaultValue" | "onChange" | "type"> {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (v: number | null) => void;
  /** money: thousands separators on blur; percent: value stored as ratio (0.5 = 50 %) */
  kind?: "money" | "percent" | "plain";
  decimals?: number;
}

const show = (v: number | null | undefined, kind: Props["kind"], d: number) =>
  v == null ? "" : kind === "percent" ? String(+(v * 100).toFixed(d)) : kind === "money" ? money(v, d).replace(/[()]/g, "") : String(v);

/** Finance number input: types freely, formats on blur, emits a number (percent as ratio). */
export function NumberInput({ value, defaultValue, onValueChange, kind = "plain", decimals = 2, trailing, ...rest }: Props) {
  const [text, setText] = useState(show(value ?? defaultValue, kind, decimals));
  const parse = (t: string) => {
    const n = Number(t.replace(/[,\s%]/g, ""));
    return t.trim() === "" || Number.isNaN(n) ? null : kind === "percent" ? n / 100 : n;
  };
  return (
    <Input
      {...rest}
      numeric
      inputMode="decimal"
      value={text}
      trailing={trailing ?? (kind === "percent" ? "%" : undefined)}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { const n = parse(text); setText(show(n, kind, decimals)); onValueChange?.(n); }}
    />
  );
}
