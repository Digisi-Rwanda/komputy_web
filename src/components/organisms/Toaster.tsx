"use client";
import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

/** Glass toasts bottom-right, themed by tokens. Mount once in the root layout. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "glass ring-inner flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-card border border-line px-4 py-3 text-small text-fg",
          title: "text-fg",
          description: "text-micro text-fg-muted",
          actionButton: "ml-auto shrink-0 rounded-full bg-primary px-3 py-1 text-micro text-primary-fg",
          cancelButton: "shrink-0 rounded-full bg-surface px-3 py-1 text-micro text-fg",
          closeButton: "text-fg-muted",
          success: "[&_[data-icon]]:text-positive",
          error: "[&_[data-icon]]:text-negative",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-link",
        },
      }}
    />
  );
}
