import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/atoms/Button";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; also shown as native tooltip */
  label: string;
  children: ReactNode;
  variant?: "ghost" | "secondary" | "outline";
  size?: "sm" | "md";
}

export function IconButton({ label, children, variant = "ghost", size = "md", className, ...rest }: Props) {
  return (
    <button type="button" aria-label={label} title={label} className={cn(buttonVariants({ variant, size: size === "sm" ? "icon-sm" : "icon" }), "px-0", className)} {...rest}>
      {children}
    </button>
  );
}
