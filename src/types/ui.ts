import type { ComponentType, SVGProps } from "react";

export type Tone = "neutral" | "positive" | "warning" | "negative" | "info";
export type Size = "sm" | "md" | "lg";
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavItem[];
}
