import { useAccess } from "@/hooks/useAccess";
import { AlertCircle, CalendarClock } from "lucide-react";

/** Banner sutil en la parte superior cuando el cupón está por expirar. */
export default function AccessBanner() {
  const { isAdmin, hasAccess, daysLeft, expiresAt } = useAccess();

  if (isAdmin || !hasAccess || daysLeft === null) return null;
  if (daysLeft > 5) return null;

  const critical = daysLeft <= 1;
  const fecha = expiresAt
    ? new Date(expiresAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <div
      className={
        "flex items-center gap-2 px-4 py-2 text-xs border-b " +
        (critical
          ? "bg-destructive/10 text-destructive border-destructive/30"
          : "bg-warning/10 text-warning-foreground border-warning/30")
      }
    >
      {critical ? <AlertCircle className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
      <span className="font-medium">
        {daysLeft === 0
          ? "Tu acceso expira hoy."
          : `Tu acceso expira en ${daysLeft} día(s) (${fecha}).`}
      </span>
      <span className="opacity-80">Solicita un nuevo cupón al administrador.</span>
    </div>
  );
}
