"use client";
import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { fieldBase } from "@/components/atoms/Input";
import { Popover } from "@/components/molecules/Overlays";

export interface ComboOption { value: string; label: string; meta?: string; icon?: ReactNode }

interface Props {
  options: ComboOption[];
  value: string[];
  onChange: (v: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** custom trigger; defaults to an input-styled button */
  trigger?: ReactNode;
  id?: string;
  invalid?: boolean;
}

/** Searchable select (cmdk in a popover). Single or multiple. */
export function Combobox({ options, value, onChange, multiple, placeholder = "Select…", searchPlaceholder = "Search…", emptyText = "No results", trigger, id, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.includes(o.value));
  const toggle = (v: string) => {
    if (multiple) onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    else { onChange([v]); setOpen(false); }
  };
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0"
      trigger={
        trigger ?? (
          <button id={id} type="button" className={cn(fieldBase, "flex h-control items-center gap-2 px-3 text-left", invalid && "border-negative")}>
            <span className={cn("flex-1 truncate", !selected.length && "text-fg-subtle")}>
              {selected.length ? (multiple && selected.length > 1 ? `${selected.length} selected` : selected[0].label) : placeholder}
            </span>
            <ChevronsUpDown aria-hidden className="size-4 text-fg-muted" />
          </button>
        )
      }
    >
      <Command loop className="flex flex-col">
        <Command.Input placeholder={searchPlaceholder} className="h-10 border-b border-line bg-transparent px-3 text-small text-fg outline-none placeholder:text-fg-subtle" />
        <Command.List className="max-h-64 overflow-y-auto p-1">
          <Command.Empty className="p-4 text-center text-small text-fg-muted">{emptyText}</Command.Empty>
          {options.map((o) => (
            <Command.Item
              key={o.value}
              value={`${o.label} ${o.meta ?? ""}`}
              onSelect={() => toggle(o.value)}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-small text-fg-body data-[selected=true]:bg-surface data-[selected=true]:text-fg [&_svg]:size-4"
            >
              {o.icon}
              <span className="flex-1 truncate">{o.label}</span>
              {o.meta && <span className="text-micro text-fg-muted">{o.meta}</span>}
              <Check className={cn("text-fg", !value.includes(o.value) && "invisible")} />
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Popover>
  );
}
