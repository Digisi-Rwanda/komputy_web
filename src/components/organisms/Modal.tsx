"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Drawer as Vaul } from "vaul";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";

interface Props {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const widths = { sm: "w-[420px]", md: "w-[520px]", lg: "w-[720px]" };

/** Centred dialog on desktop; becomes a swipe-to-close bottom sheet (vaul) below 640px. */
export function Modal({ open, onOpenChange, trigger, title, description, icon, children, footer, size = "md", className }: Props) {
  const mobile = useMediaQuery("(max-width: 639px)");
  const head = (T: typeof Dialog.Title, D: typeof Dialog.Description) => (
    <div className="flex items-start gap-3">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        <T className="text-h4 text-fg">{title}</T>
        {description ? <D className="mt-1 text-small text-fg-muted">{description}</D> : <D className="sr-only">{title}</D>}
      </div>
    </div>
  );

  if (mobile) {
    return (
      <Vaul.Root open={open} onOpenChange={onOpenChange}>
        {trigger && <Vaul.Trigger asChild>{trigger}</Vaul.Trigger>}
        <Vaul.Portal>
          <Vaul.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-scrim" />
          <Vaul.Content className="glass fixed inset-x-0 bottom-0 z-[var(--z-modal)] flex max-h-[90dvh] flex-col rounded-t-panel border-t border-line outline-none">
            <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-line-strong" />
            <div className="p-5 pb-0">{head(Vaul.Title as typeof Dialog.Title, Vaul.Description as typeof Dialog.Description)}</div>
            <div className="overflow-y-auto p-5">{children}</div>
            {footer && <div className="flex flex-col-reverse gap-2 border-t border-line p-4 [&>*]:w-full">{footer}</div>}
          </Vaul.Content>
        </Vaul.Portal>
      </Vaul.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-scrim data-[state=open]:animate-fade-in" />
        <Dialog.Content className={cn("glass ring-inner fixed left-1/2 top-1/2 z-[var(--z-modal)] flex max-h-[85dvh] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-panel border border-line outline-none data-[state=open]:animate-scale-in", widths[size], className)}>
          <div className="flex items-start gap-4 p-6 pb-0">
            <div className="flex-1">{head(Dialog.Title, Dialog.Description)}</div>
            <Dialog.Close aria-label="Close" className="rounded-full p-1 text-fg-muted transition-colors hover:bg-surface hover:text-fg"><X className="size-4" /></Dialog.Close>
          </div>
          <div className="overflow-y-auto p-6">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Right-side panel for details (exception, request, member). Full width on phones. */
export function Sheet({ open, onOpenChange, trigger, title, description, children, footer, width = "w-[480px]" }: Omit<Props, "size" | "icon"> & { width?: string }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-drawer)] bg-scrim data-[state=open]:animate-fade-in" />
        <Dialog.Content className={cn("glass fixed inset-y-0 right-0 z-[var(--z-drawer)] flex max-w-full flex-col border-l border-line outline-none data-[state=open]:animate-slide-in-right", width)}>
          <div className="flex items-start gap-4 border-b border-line p-5">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-h4 text-fg">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-small text-fg-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close aria-label="Close" className="rounded-full p-1 text-fg-muted hover:bg-surface hover:text-fg"><X className="size-4" /></Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line p-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Destructive confirm. With `confirmText`, the user must type it exactly (close workspace, transfer ownership). */
export function ConfirmDialog({ open, onOpenChange, trigger, title, description, confirmLabel, onConfirm, danger = true, confirmText }: {
  open?: boolean; onOpenChange?: (v: boolean) => void; trigger?: ReactNode; title: string; description?: ReactNode; confirmLabel: string; onConfirm: () => void; danger?: boolean; confirmText?: string;
}) {
  const [typed, setTyped] = useState("");
  const ok = !confirmText || typed === confirmText;
  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) setTyped(""); onOpenChange?.(v); }}
      trigger={trigger}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Dialog.Close asChild><Button variant="secondary">Cancel</Button></Dialog.Close>
          <Button variant={danger ? "danger" : "primary"} disabled={!ok} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      {confirmText && (
        <label className="flex flex-col gap-1.5 text-small text-fg-body">
          <span>Type <span className="font-mono text-fg">{confirmText}</span> to confirm</span>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} invalid={typed.length > 0 && !confirmText.startsWith(typed)} autoComplete="off" />
          {typed.length > 0 && !ok && <span className="text-micro text-negative">Text doesn&apos;t match yet</span>}
        </label>
      )}
    </Modal>
  );
}
