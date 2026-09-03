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
  const { user, session, loading: authLoading, isAdmin: authIsAdmin, refreshRole } = useAuth();
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
    console.info('get_my_access result:', { data, error });
    if (error) {
      console.error("No se pudo verificar el acceso", error);
      setState({
        hasAccess: authIsAdmin,
        isAdmin: authIsAdmin,
        expiresAt: null,
        daysLeft: null,
        code: null,
        loading: false,
      });
      return;
    }
    const row = data?.[0];
    console.info('get_my_access row:', row);
    const admin = authIsAdmin || !!row?.is_admin;
    setState({
      hasAccess: admin || !!row?.has_access,
      isAdmin: admin,
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
          // Desktop notification
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Tu acceso expira hoy", { body: "Solicita un nuevo cupón al administrador." });
            } else if (Notification.permission === "default") {
              Notification.requestPermission().then((perm) => {
                if (perm === "granted") new Notification("Tu acceso expira hoy", { body: "Solicita un nuevo cupón al administrador." });
              });
            }
          }
        } else if (row.days_left <= 3) {
          toast.warning(`Tu acceso expira en ${row.days_left} día(s)`, {
            description: "Solicita un nuevo cupón al administrador.",
          });
          // Desktop notification for near expiry
          if (typeof window !== "undefined" && "Notification" in window) {
            const title = `Acceso expira en ${row.days_left} día(s)`;
            const body = `Tu cupón (${row.code}) expira en ${row.days_left} día(s). Solicita uno nuevo al administrador.`;
            if (Notification.permission === "granted") {
              new Notification(title, { body });
            } else if (Notification.permission === "default") {
              Notification.requestPermission().then((perm) => {
                if (perm === "granted") new Notification(title, { body });
              });
            }
          }
        }
      }
    }
  }, [user, authIsAdmin]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, user, refresh]);

  const redeem = useCallback(
    async (code: string) => {
      const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
      let row: any = null;

      // La RPC bloquea y actualiza el cupón en una sola transacción.
      try {
        const { data, error } = await supabase.rpc("redeem_access_coupon", {
          _code: cleanCode,
        });
        console.info('redeem_access_coupon rpc result:', { data, error });
        if (!error) row = data?.[0];
      } catch (err) {
        console.warn('Direct redeem RPC failed, trying proxy', err);
      }

      // Respaldo para despliegues donde la RPC aún no esté publicada.
      if (!row) {
        const token = session?.access_token;
        const res = await fetch('/api/redeem-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code: cleanCode }),
        });
        const payload = await res.json().catch(() => null);
        console.info('redeem_access_coupon proxy result:', res.status, payload);
        row = res.ok ? (Array.isArray(payload) ? payload[0] : payload) : null;
        if (!row && payload?.message) return { ok: false, message: payload.message };
      }

      if (!row?.success) {
        console.warn('redeem returned not success', row);
        return { ok: false, message: row?.message || "Cupón inválido" };
      }
      // Optimistic update: aplicar inmediatamente el nuevo estado de acceso
      setState((s) => ({
        ...s,
        hasAccess: true,
        isAdmin: !!row?.is_admin,
        expiresAt: row?.expires_at ?? s.expiresAt,
        daysLeft: row?.days_left ?? s.daysLeft,
        code: row?.code ?? s.code,
        loading: false,
      }));
      // show toast with expiry info
      const expiresMsg = row?.expires_at ? ` (expira: ${new Date(row.expires_at).toLocaleString()})` : '';
      toast.success(`Cupón aceptado${expiresMsg}`);
      try {
        await refreshRole();
      } catch (err) {
        console.error('refreshRole failed after redeem', err);
      }
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
