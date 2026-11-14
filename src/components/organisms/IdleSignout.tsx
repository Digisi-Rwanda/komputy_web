"use client";
import { useEffect } from "react";
import { toast } from "@/components/organisms/Toaster";
import { signOut } from "@/lib/actions/auth";

const IDLE_MS = 30 * 60e3, WARN_MS = 60e3, KEY = "ll_last_active";
const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/** CA7 idle sign-out: 30 minutes without input in any tab → signed out, with a one-minute warning. Shared across tabs. */
export function IdleSignout() {
  useEffect(() => {
    let last = Date.now(), warned = false, saved = 0;
    const read = () => { try { return Math.max(last, Number(localStorage.getItem(KEY)) || 0); } catch { return last; } };
    const touch = () => {
      last = Date.now();
      if (warned) { warned = false; toast.dismiss("idle"); }
      if (last - saved > 5e3) { saved = last; try { localStorage.setItem(KEY, String(last)); } catch { /* storage blocked: this tab only */ } }
    };
    touch();
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const t = setInterval(() => {
      const idle = Date.now() - read();
      if (idle >= IDLE_MS) { clearInterval(t); void signOut("idle"); }
      else if (idle >= IDLE_MS - WARN_MS && !warned) { warned = true; toast.warning("You'll be signed out in a minute", { id: "idle", description: "Your workspace signs out idle sessions. Move the mouse or press a key to stay signed in.", duration: WARN_MS }); }
    }, 10e3);
    return () => { clearInterval(t); EVENTS.forEach((e) => window.removeEventListener(e, touch)); };
  }, []);
  return null;
}
