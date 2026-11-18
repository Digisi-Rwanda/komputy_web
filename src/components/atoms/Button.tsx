import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Kbd } from "@/components/atoms/Kbd";
import { Spinner } from "@/components/atoms/Spinner";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,color,box-shadow,opacity] duration-fast outline-none disabled:pointer-events-none disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary-hover hover:ring-4 hover:ring-ring-light",
        secondary: "bg-secondary text-secondary-fg hover:bg-secondary-hover data-[state=open]:bg-secondary-hover",
        outline: "border border-line-strong text-fg hover:bg-surface data-[state=open]:bg-surface",
        ghost: "text-fg-muted hover:bg-surface hover:text-fg data-[state=open]:bg-surface data-[state=open]:text-fg",
        danger: "bg-negative text-fg-inverse hover:opacity-90 hover:ring-4 hover:ring-negative-tint",
        "danger-outline": "border border-negative/40 text-negative hover:bg-negative-tint",
        link: "h-auto! px-0! text-link underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-micro",
        md: "h-control px-4 text-small",
        lg: "h-12 px-6 text-body",
        icon: "size-control",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child (e.g. a Next <Link>) with button styles */
  asChild?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  right?: ReactNode;
  /** Keyboard hint shown inside the button, e.g. "⌘S" */
  shortcut?: string;
  /** Why the action is unavailable: button stays focusable and announces the reason */
  disabledReason?: string;
}

export function Button({ variant, size, asChild, loading, icon, right, shortcut, disabledReason, className, children, disabled, onClick, ...rest }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) return <Slot className={classes} {...rest}>{children}</Slot>;
  // A reason blocks the button unless the caller explicitly enables it (disabled={false}).
  const blocked = Boolean(disabledReason) && disabled !== false;
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={blocked || undefined}
      title={blocked ? disabledReason : undefined}
      onClick={blocked && !disabled ? (e) => e.preventDefault() : onClick}
      {...rest}
    >
      {loading ? <Spinner className="size-4 border-current border-t-transparent" label="Loading" /> : icon}
      {children}
      {shortcut && <Kbd className="ml-1 border-current/30 text-current/70">{shortcut}</Kbd>}
      {right}
      {blocked && <span className="sr-only">. {disabledReason}</span>}
    </button>
  );
}
