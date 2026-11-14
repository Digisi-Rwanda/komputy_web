"use client";
import { Moon, Sun } from "lucide-react";

/** Flip data-theme on <html> and remember it (applied pre-paint by the script in app/layout.tsx). */
export function toggleTheme() {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch { /* storage blocked: theme just won't persist */ }
}

export function ThemeToggle() {
  return (
    <button type="button" aria-label="Toggle light and dark theme" title="Toggle theme" onClick={toggleTheme} className="inline-flex size-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface hover:text-fg">
      <Sun className="hidden size-4 [[data-theme=light]_&]:block" />
      <Moon className="size-4 [[data-theme=light]_&]:hidden" />
    </button>
  );
}
