"use client";
import { Command } from "cmdk";
import { Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { FilterChip } from "@/components/molecules/FilterChip";
import { Popover } from "@/components/molecules/Overlays";
import { Button } from "@/components/atoms/Button";

export interface FilterDef { key: string; label: string; options: { value: string; label: string; count?: number }[] }
export type FilterValues = Record<string, string[]>;

/** Filter chips row: dashed "+ Status" opens a searchable list; applied chips show values with ×; "Clear all". */
export function FilterBar({ filters, value, onChange, className }: { filters: FilterDef[]; value: FilterValues; onChange: (v: FilterValues) => void; className?: string }) {
  const active = Object.values(value).some((v) => v.length);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.map((f) => <FilterPicker key={f.key} def={f} selected={value[f.key] ?? []} onChange={(v) => onChange({ ...value, [f.key]: v })} />)}
      {active && <Button variant="link" size="sm" onClick={() => onChange({})}>Clear all</Button>}
    </div>
  );
}

function FilterPicker({ def, selected, onChange }: { def: FilterDef; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const labels = def.options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  const shown = labels.length > 2 ? `${labels.length} selected` : labels.join(", ");
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="w-60 p-0"
      trigger={<FilterChip label={def.label} value={shown || undefined} onClear={selected.length ? () => onChange([]) : undefined} />}
    >
      <Command loop>
        <Command.Input placeholder={`Filter by ${def.label.toLowerCase()}…`} className="h-10 w-full border-b border-line bg-transparent px-3 text-small text-fg outline-none placeholder:text-fg-subtle" />
        <Command.List className="max-h-64 overflow-y-auto p-1">
          <Command.Empty className="p-4 text-center text-small text-fg-muted">No matches</Command.Empty>
          {def.options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <Command.Item key={o.value} value={o.label} onSelect={() => onChange(on ? selected.filter((x) => x !== o.value) : [...selected, o.value])} className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-small text-fg-body data-[selected=true]:bg-surface data-[selected=true]:text-fg">
                <span className={cn("inline-flex size-4 items-center justify-center rounded-[4px] border", on ? "border-accent bg-accent text-fg-inverse" : "border-line-strong")}>{on && <Check className="size-3" strokeWidth={3} />}</span>
                <span className="flex-1">{o.label}</span>
                {o.count != null && <span className="font-mono text-micro text-fg-muted">{o.count}</span>}
              </Command.Item>
            );
          })}
        </Command.List>
      </Command>
    </Popover>
  );
}
