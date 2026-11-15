"use client";
import { DayPicker, type DateRange } from "react-day-picker";
import { endOfMonth, endOfQuarter, startOfQuarter, startOfYear, subMonths, format } from "date-fns";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { fieldBase } from "@/components/atoms/Input";
import { Popover } from "@/components/molecules/Overlays";

const dayClasses = {
  root: "text-small text-fg-body",
  months: "flex gap-6",
  month_caption: "flex h-8 items-center justify-center text-small text-fg",
  nav: "absolute inset-x-2 top-2 flex justify-between",
  button_previous: "inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg",
  button_next: "inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg",
  chevron: "size-4 fill-current",
  weekday: "size-9 text-micro font-normal text-fg-muted",
  day: "size-9 p-0 text-center",
  day_button: "size-9 rounded-full tabular-nums outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus",
  today: "text-link",
  selected: "[&>button]:bg-fg [&>button]:text-fg-inverse",
  range_middle: "bg-surface [&>button]:bg-transparent! [&>button]:text-fg!",
  range_start: "rounded-l-full bg-surface",
  range_end: "rounded-r-full bg-surface",
  outside: "text-fg-subtle",
  disabled: "opacity-30",
};

const fmt = (d?: Date) => (d ? format(d, "d MMM yyyy") : "");

const trigger = (text: string, placeholder: string, id?: string) => (
  <button id={id} type="button" className={cn(fieldBase, "flex h-control items-center gap-2 px-3 text-left")}>
    <Calendar aria-hidden className="size-4 text-fg-muted" />
    <span className={cn("flex-1 truncate tabular-nums", !text && "text-fg-subtle")}>{text || placeholder}</span>
  </button>
);

/** Single date (e.g. reporting date). `monthEndOnly` restricts to month-ends. */
export function DatePicker({ value, onChange, placeholder = "Pick a date", monthEndOnly, id }: { value?: Date; onChange: (d?: Date) => void; placeholder?: string; monthEndOnly?: boolean; id?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen} className="relative p-3" trigger={trigger(fmt(value), placeholder, id)}>
      <DayPicker
        mode="single"
        selected={value}
        onSelect={(d) => { onChange(d); setOpen(false); }}
        disabled={monthEndOnly ? (d) => endOfMonth(d).getDate() !== d.getDate() : undefined}
        defaultMonth={value}
        weekStartsOn={1}
        classNames={dayClasses}
      />
    </Popover>
  );
}

const PRESETS = (today: Date) => [
  { label: "Last month", range: { from: subMonths(today, 1), to: today } },
  { label: "Quarter to date", range: { from: startOfQuarter(today), to: today } },
  { label: "Last quarter", range: { from: startOfQuarter(subMonths(today, 3)), to: endOfQuarter(subMonths(today, 3)) } },
  { label: "Year to date", range: { from: startOfYear(today), to: today } },
  { label: "Last 12 months", range: { from: subMonths(today, 12), to: today } },
];

/** Range with presets (MTD/QTD/YTD) for reports and audit logs. */
export function DateRangePicker({ value, onChange, placeholder = "Date range", today = new Date(), id }: { value?: DateRange; onChange: (r?: DateRange) => void; placeholder?: string; today?: Date; id?: string }) {
  const text = value?.from ? `${fmt(value.from)} to ${fmt(value.to)}` : "";
  return (
    <Popover className="relative flex gap-4 p-3" align="start" trigger={trigger(text, placeholder, id)}>
      <ul className="hidden flex-col gap-1 border-r border-line pr-3 sm:flex">
        {PRESETS(today).map((p) => (
          <li key={p.label}>
            <button type="button" onClick={() => onChange(p.range)} className="h-8 w-full rounded-md px-2 text-left text-small text-fg-muted hover:bg-surface hover:text-fg">{p.label}</button>
          </li>
        ))}
      </ul>
      <DayPicker mode="range" selected={value} onSelect={onChange} numberOfMonths={2} weekStartsOn={1} defaultMonth={value?.from ?? subMonths(today, 1)} classNames={{ ...dayClasses, months: "flex flex-col gap-6 sm:flex-row" }} />
    </Popover>
  );
}
