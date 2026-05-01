import { createContext, useContext } from "react";

export interface AccessState {
  hasAccess: boolean;
  isAdmin: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
  code: string | null;
  loading: boolean;
}

export interface AccessCtxValue extends AccessState {
  refresh: () => Promise<void>;
  redeem: (code: string) => Promise<{ ok: boolean; message: string }>;
}

export const AccessContext = createContext<AccessCtxValue | undefined>(undefined);

export function useAccess() {
  const c = useContext(AccessContext);
  if (!c) throw new Error("useAccess must be used within AccessProvider");
  return c;
}
