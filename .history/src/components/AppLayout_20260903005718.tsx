import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import {
  Stethoscope, User, ClipboardList, Briefcase, Award, RotateCcw,
  BookOpen, History, Shield, LogOut, Menu, X, Lock, Ticket,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PatientSection from "@/components/sections/PatientSection";
import TituloISection from "@/components/sections/TituloISection";
import TituloIISection from "@/components/sections/TituloIISection";
import ResultSection from "@/components/sections/ResultSection";
import BibliotecaSection from "@/components/sections/BibliotecaSection";
import ValoracionesSection from "@/components/sections/ValoracionesSection";
import AdminSection from "@/components/sections/AdminSection";
import UserManual from "@/components/UserManual";
import LockGate from "@/components/LockGate";
import AccessBanner from "@/components/AccessBanner";

type SectionKey =
  | "paciente" | "titulo1" | "titulo2" | "resultado"
  | "valoraciones" | "biblioteca" | "admin";

const WORKFLOW_SECTIONS: SectionKey[] = [
  "paciente", "titulo1", "titulo2", "resultado", "valoraciones",
];

export default function AppLayout() {
  const [active, setActive] = useState<SectionKey>("paciente");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pcl, deficiencias, reset } = useApp();
  const { user, isAdmin, signOut } = useAuth();
  const { hasAccess, isAdmin: accessAdmin, loading: accessLoading, daysLeft, code } = useAccess();
  const [couponDuration, setCouponDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!hasAccess || !code) { setCouponDuration(null); return; }
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('duration_days')
          .eq('code', code)
          .limit(1);
        if (!mounted) return;
        if (error || !data || data.length === 0) return;
        setCouponDuration(data[0].duration_days ?? null);
      } catch (err) {
        console.warn('Could not fetch coupon duration', err);
      }
    })();
    return () => { mounted = false; };
  }, [hasAccess, code]);
  const calificados = Object.keys(deficiencias).length;
  const userName = user?.user_metadata?.nombre
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split("@")[0]
    || "usuario";
  const restricted = new Set<SectionKey>(["paciente", "titulo1", "titulo2", "resultado", "valoraciones"]);
  const showLock = (key: SectionKey) => restricted.has(key) && !hasAccess && !accessAdmin && !accessLoading;
  const workflowIndex = WORKFLOW_SECTIONS.indexOf(active);
  const goToWorkflowSection = (offset: -1 | 1) => {
    const nextIndex = workflowIndex + offset;
    const nextSection = WORKFLOW_SECTIONS[nextIndex];
    if (nextSection) setActive(nextSection);
  };

  const NAV: { key: SectionKey; label: string; icon: typeof User; index: string; admin?: boolean }[] = [
    { key: "paciente", label: "Datos Paciente", icon: User, index: "1" },
    { key: "titulo1", label: "Título I — Deficiencias", icon: ClipboardList, index: "2" },
    { key: "titulo2", label: "Título II — Roles", icon: Briefcase, index: "3" },
    { key: "resultado", label: "Resultado Final", icon: Award, index: "4" },
    { key: "valoraciones", label: "Mis Valoraciones", icon: History, index: "5" },
    { key: "biblioteca", label: "Biblioteca 1507", icon: BookOpen, index: "★" },
    ...(isAdmin
      ? [{ key: "admin" as SectionKey, label: "Administrador", icon: Shield, index: "★", admin: true }]
      : []),
  ];

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-background lg:flex-row">
      {/* Sidebar */}
      <aside className="gradient-sidebar text-sidebar-foreground flex w-full shrink-0 flex-col border-b border-sidebar-border lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:sticky lg:top-0">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
                MedValua
              </h1>
              <p className="text-[11px] text-sidebar-foreground/60 leading-none mt-0.5">
                Decreto 1507 · Colombia
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {user && (
            <>
              <p className="text-[11px] text-sidebar-foreground/50 mt-3 truncate">
                Hola, {userName} {isAdmin && <span className="text-primary-glow font-semibold">· Admin</span>}
              </p>
              {!isAdmin && hasAccess && daysLeft !== null && (
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="relative"
                    title={
                      couponDuration !== null
                        ? `Válido por ${couponDuration} día(s) · ${daysLeft === 0 ? 'Expira hoy' : `expira en ${daysLeft ?? '-'} día(s)`}`
                        : (daysLeft === 0 ? 'Expira hoy' : `Expira en ${daysLeft ?? '-'} día(s)`)
                    }
                  >
                    {(() => {
                      const cls = daysLeft === null
                        ? 'text-sidebar-foreground/80'
                        : daysLeft <= 1
                          ? 'text-destructive'
                          : daysLeft <= 3
                            ? 'text-warning-foreground'
                            : 'text-sidebar-foreground/80';
                      return <Ticket className={`h-5 w-5 ${cls}`} />;
                    })()}
                  </div>
                  <span className="text-[11px] text-sidebar-foreground/60">
                    {daysLeft === 0 ? 'Expira hoy' : `Te quedan ${daysLeft} día(s)`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <nav className={cn("flex-1 p-4 space-y-1 overflow-y-auto lg:block", mobileOpen ? "block max-h-[62vh]" : "hidden")}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActive(item.key); setMobileOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-base text-left",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-7 w-7 rounded-md flex items-center justify-center text-[11px] font-mono shrink-0",
                    isActive
                      ? "bg-sidebar-primary-foreground/15"
                      : "bg-sidebar-accent text-sidebar-foreground/60",
                  )}
                >
                  {item.index}
                </span>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {showLock(item.key) && <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-sidebar-foreground/45" />}
              </button>
            );
          })}
        </nav>

        <div className={cn("p-4 border-t border-sidebar-border space-y-2 lg:block", mobileOpen ? "block" : "hidden")}>
          <div className="rounded-xl bg-sidebar-accent/60 p-4">
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
              PCL en tiempo real
            </p>
            <p className="text-3xl font-mono font-bold text-sidebar-primary mt-1">
              {pcl.total}%
            </p>
            <p className="text-[11px] text-sidebar-foreground/60 mt-0.5">
              {calificados}/15 capítulos · T-II {pcl.avd + pcl.rolLaboral}/50
            </p>
          </div>
          <UserManual />
          <Button
            variant="ghost" size="sm" onClick={reset}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Reiniciar valoración
          </Button>
          <Button
            variant="ghost" size="sm" onClick={signOut}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        <AccessBanner />
        <div className="p-4 sm:p-6 lg:p-10">
          {active === "paciente" && (
            <LockGate sectionLabel="Datos del Paciente"><PatientSection /></LockGate>
          )}
          {active === "titulo1" && (
            <LockGate sectionLabel="Título I — Deficiencias"><TituloISection /></LockGate>
          )}
          {active === "titulo2" && (
            <LockGate sectionLabel="Título II — Roles"><TituloIISection /></LockGate>
          )}
          {active === "resultado" && (
            <LockGate sectionLabel="Resultado Final"><ResultSection /></LockGate>
          )}
          {active === "valoraciones" && (
            <LockGate sectionLabel="Mis Valoraciones">
              <ValoracionesSection onLoad={() => setActive("paciente")} />
            </LockGate>
          )}
          {active === "biblioteca" && <BibliotecaSection />}
          {active === "admin" && isAdmin && <AdminSection />}

          {workflowIndex !== -1 && (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => goToWorkflowSection(-1)}
                disabled={workflowIndex === 0}
                aria-label="Ir al módulo anterior"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Módulo {workflowIndex + 1} de {WORKFLOW_SECTIONS.length}
              </span>
              <Button
                type="button"
                onClick={() => goToWorkflowSection(1)}
                disabled={workflowIndex === WORKFLOW_SECTIONS.length - 1}
                aria-label="Ir al módulo siguiente"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
