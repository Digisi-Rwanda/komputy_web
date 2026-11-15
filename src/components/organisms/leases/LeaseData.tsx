"use client";
import { createContext, useContext } from "react";
import type { LeaseBook } from "@/server/dal/leases";

const Ctx = createContext<LeaseBook | null>(null);

/** The workspace's lease book (loaded once per request by the leases layout) for every lease screen. */
export function LeaseDataProvider({ value, children }: { value: LeaseBook; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLeaseData(): LeaseBook {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLeaseData outside the leases layout");
  return v;
}
