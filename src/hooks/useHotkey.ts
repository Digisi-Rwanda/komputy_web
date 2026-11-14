"use client";
import { useEffect } from "react";

/** useHotkey("k", fn) fires on ⌘K / Ctrl+K */
export function useHotkey(key: string, handler: () => void, meta = true) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key && (!meta || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handler();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, handler, meta]);
}
