import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const ensureProfileAndRole = async (u: User) => {
    const nombre = String(
      u.user_metadata?.nombre
      ?? u.user_metadata?.full_name
      ?? u.user_metadata?.name
      ?? "",
    ).trim();
    await (supabase as any).rpc("ensure_current_user_profile", {
      _nombre: nombre,
    });
    if (nombre) {
      await (supabase.from("profiles" as any) as any)
        .update({ nombre, full_name: nombre })
        .eq("user_id", u.id);
    }
    await checkAdmin(u.id);
  };

  useEffect(() => {
    // 1. Listener primero (regla Supabase)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // chequeo de rol diferido para evitar deadlocks
        setTimeout(() => ensureProfileAndRole(s.user), 0);
        // Solicitar permiso de notificaciones una sola vez al iniciar sesión
        try {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            const asked = localStorage.getItem('mv_notifications_asked');
            if (!asked && Notification.permission === 'default') {
              Notification.requestPermission().then(() => {
                localStorage.setItem('mv_notifications_asked', '1');
              });
            } else if (!asked) {
              // Ya concedido o denegado: marcaremos como preguntado para no insistir
              localStorage.setItem('mv_notifications_asked', '1');
            }
          }
        } catch (e) {
          /* noop */
        }
      } else {
        setIsAdmin(false);
      }
    });

    // 2. Sesión existente
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) ensureProfileAndRole(s.user);
      // Solicitar permiso de notificaciones al cargar sesión inicial
      try {
        if (s?.user && typeof window !== 'undefined' && 'Notification' in window) {
          const asked = localStorage.getItem('mv_notifications_asked');
          if (!asked && Notification.permission === 'default') {
            Notification.requestPermission().then(() => {
              localStorage.setItem('mv_notifications_asked', '1');
            });
          } else if (!asked) {
            localStorage.setItem('mv_notifications_asked', '1');
          }
        }
      } catch (e) {
        /* noop */
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const checkAdmin = async (uid: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const refreshRole = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    await ensureProfileAndRole(user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, session, loading, isAdmin, refreshRole, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
