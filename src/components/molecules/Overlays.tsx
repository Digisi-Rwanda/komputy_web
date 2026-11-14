"use client";
// Styled Radix wrappers: keyboard, focus trapping and screen-reader behaviour come from Radix.
import * as RTooltip from "@radix-ui/react-tooltip";
import * as RPopover from "@radix-ui/react-popover";
import * as RMenu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Kbd } from "@/components/atoms/Kbd";

export const floatingPanel =
  "glass ring-inner z-[var(--z-dropdown)] rounded-card border border-line text-small text-fg-body outline-none data-[side=bottom]:animate-slide-up-fade data-[side=top]:animate-slide-down-fade data-[side=left]:animate-fade-in data-[side=right]:animate-fade-in";

export function Tooltip({ content, children, side = "top", shortcut }: { content: ReactNode; children: ReactNode; side?: "top" | "right" | "bottom" | "left"; shortcut?: string }) {
  if (!content) return <>{children}</>;
  return (
    <RTooltip.Provider delayDuration={250}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content side={side} sideOffset={6} collisionPadding={8} className="glass z-[var(--z-tooltip)] flex max-w-xs items-center gap-2 rounded-md border border-line px-2 py-1 text-micro text-fg animate-fade-in">
            {content}
            {shortcut && <Kbd>{shortcut}</Kbd>}
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}

export function Popover({ trigger, children, align = "start", side = "bottom", open, onOpenChange, className }: {
  trigger: ReactNode; children: ReactNode; align?: "start" | "center" | "end"; side?: "top" | "bottom" | "left" | "right"; open?: boolean; onOpenChange?: (v: boolean) => void; className?: string;
}) {
  return (
    <RPopover.Root open={open} onOpenChange={onOpenChange}>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content align={align} side={side} sideOffset={8} collisionPadding={8} className={cn(floatingPanel, "p-2", className)}>{children}</RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}

export interface MenuItem {
  label: string;
  onSelect?: () => void;
  href?: string;
  icon?: ReactNode;
  danger?: boolean;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  /** group heading shown above this item */
  group?: string;
}

export function DropdownMenu({ trigger, items, align = "end", className }: { trigger: ReactNode; items: MenuItem[]; align?: "start" | "end"; className?: string }) {
  return (
    <RMenu.Root>
      <RMenu.Trigger asChild>{trigger}</RMenu.Trigger>
      <RMenu.Portal>
        <RMenu.Content align={align} sideOffset={6} collisionPadding={8} className={cn(floatingPanel, "min-w-48 p-1", className)}>
          {items.map((it, i) => (
            <div key={`${it.label}-${i}`}>
              {it.separatorBefore && <RMenu.Separator className="my-1 h-px bg-line" />}
              {it.group && <RMenu.Label className="label-mono px-2 pb-1 pt-2">{it.group}</RMenu.Label>}
              <RMenu.Item
                disabled={it.disabled}
                onSelect={it.onSelect}
                asChild={Boolean(it.href)}
                className={cn(
                  "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-surface data-[highlighted]:text-fg [&_svg]:size-4",
                  it.danger && "text-negative data-[highlighted]:bg-negative-tint data-[highlighted]:text-negative",
                )}
              >
                {it.href ? (
                  <a href={it.href}>{it.icon}<span className="flex-1">{it.label}</span></a>
                ) : (
                  <>
                    {it.icon}
                    <span className="flex-1">{it.label}</span>
                    {it.checked && <Check className="text-fg" />}
                    {it.shortcut && <Kbd>{it.shortcut}</Kbd>}
                  </>
                )}
              </RMenu.Item>
            </div>
          ))}
        </RMenu.Content>
      </RMenu.Portal>
    </RMenu.Root>
  );
}
