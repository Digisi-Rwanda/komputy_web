"use client";
import * as R from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface AccordionItem { value: string; title: ReactNode; content: ReactNode; meta?: ReactNode }

export function Accordion({ items, type = "multiple", defaultValue, className }: { items: AccordionItem[]; type?: "single" | "multiple"; defaultValue?: string[]; className?: string }) {
  const body = items.map((it) => (
    <R.Item key={it.value} value={it.value} className="border-b border-line last:border-0">
      <R.Header>
        <R.Trigger className="group flex w-full items-center gap-3 py-4 text-left text-small text-fg outline-none focus-visible:text-link">
          <span className="flex-1">{it.title}</span>
          {it.meta}
          <ChevronDown aria-hidden className="size-4 text-fg-muted transition-transform duration-base group-data-[state=open]:rotate-180" />
        </R.Trigger>
      </R.Header>
      <R.Content className="overflow-hidden text-small text-fg-body data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="pb-4">{it.content}</div>
      </R.Content>
    </R.Item>
  ));
  return type === "single" ? (
    <R.Root type="single" collapsible defaultValue={defaultValue?.[0]} className={cn("rounded-card border border-line px-5", className)}>{body}</R.Root>
  ) : (
    <R.Root type="multiple" defaultValue={defaultValue} className={cn("rounded-card border border-line px-5", className)}>{body}</R.Root>
  );
}
