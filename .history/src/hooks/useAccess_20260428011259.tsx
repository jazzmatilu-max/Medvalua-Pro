import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AccessContext,
  type AccessState,
} from "@/hooks/accessContext";

export { useAccess } from "@/hooks/accessContext";

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, refreshRole } = useAuth();
  const [state, setState] = useState<AccessState>({
    hasAccess: false,
    isAdmin: false,
    expiresAt: null,
    daysLeft: null,
    code: null,
    loading: true,
  });
  const notifiedRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    if (!user) {
      setState({
        hasAccess: false,
        isAdmin: false,
        expiresAt: null,
        daysLeft: null,
        code: null,
        loading: false,
      });
      return;
    }
    const { data, error } = await supabase.rpc("get_my_access");
    if (error) {
      console.error("No se pudo verificar el acceso", error);
      setState({
        hasAccess: false,
        isAdmin: false,
        expiresAt: null,
        daysLeft: null,
        code: null,
        loading: false,
      });
      return;
    }
    const row = data?.[0];
    setState({
      hasAccess: !!row?.has_access,
      isAdmin: !!row?.is_admin,
      expiresAt: row?.expires_at ?? null,
      daysLeft: row?.days_left ?? null,
      code: row?.code ?? null,
      loading: false,
    });

    if (row?.has_access && !row?.is_admin && row?.days_left !== null) {
      const key = `${row.code}-${row.days_left}`;
      if (notifiedRef.current !== key) {
        notifiedRef.current = key;
        if (row.days_left === 0) {
          toast.warning("Tu acceso expira hoy", {
            description: "Solicita un nuevo cupón al administrador.",
          });
        } else if (row.days_left <= 3) {
          toast.warning(`Tu acceso expira en ${row.days_left} día(s)`, {
            description: "Solicita un nuevo cupón al administrador.",
          });
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, user, refresh]);

  const redeem = useCallback(
    async (code: string) => {
      const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
      const { data, error } = await supabase.rpc("redeem_access_coupon", {
        _code: cleanCode,
      });
      if (error) return { ok: false, message: error.message };
      const row = data?.[0];
      if (!row?.success) return { ok: false, message: row?.message || "Cupón inválido" };
      await refreshRole();
      // Actualiza el estado de acceso inmediatamente para reflejar el cupón redimido
      // sin requerir que el usuario cierre sesión.
      await refresh();
      return { ok: true, message: row?.message || "Acceso activado" };
    },
    [refreshRole],
  );

  return (
    <AccessContext.Provider value={{ ...state, refresh, redeem }}>
      {children}
    </AccessContext.Provider>
  );
}
