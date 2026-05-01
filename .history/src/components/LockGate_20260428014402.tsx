import { useState } from "react";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Ticket, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

/**
 * Envuelve secciones premium. Si el usuario no es admin y no tiene cupón vigente,
 * muestra una pantalla de candado con input para activar acceso.
 */
export default function LockGate({
  children,
  sectionLabel,
}: {
  children: React.ReactNode;
  sectionLabel: string;
}) {
  const { hasAccess, isAdmin, loading, redeem } = useAccess();
  const { signOut } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  // Debug: mostrar estado de acceso cuando se renderiza LockGate
  try {
    // eslint-disable-next-line no-console
    console.info('LockGate render', { sectionLabel, hasAccess, isAdmin, loading });
  } catch (e) {
    /* noop */
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasAccess || isAdmin) return <>{children}</>;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/\s+/g, "");
    if (clean.length < 3) {
      toast.error("Ingresa un código válido");
      return;
    }
    setBusy(true);
    const r = await redeem(clean);
    setBusy(false);
    if (!r.ok) {
      toast.error(r.message, {
        description: "Verifica que el código sea exactamente el generado por el administrador.",
      });
      return;
    }
    toast.success("✅ Cupón redimido correctamente", {
      description: "Acceso activado — las secciones se desbloquean ahora.",
    });
    setCode("");
  };

  return (
    <div className="max-w-xl mx-auto py-12 animate-fade-in">
      <Card className="p-8 shadow-elegant border-primary/20">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Sección bloqueada</h2>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{sectionLabel}</span> requiere un cupón de acceso vigente.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Un solo cupón desbloquea <strong>todas</strong> las secciones (Datos, Título I, Título II, Resultado, Mis valoraciones).
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground w-full">
            <ShieldCheck className="h-4 w-4 text-success inline mr-1" />
            Solicita tu cupón al administrador. Una vez activado, tendrás acceso por la cantidad de días asignada.
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5" /> Código de cupón
            </Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="MV-XXXXXXXX"
              className="font-mono uppercase text-center"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Activar acceso
          </Button>
        </form>
      </Card>
    </div>
  );
}
