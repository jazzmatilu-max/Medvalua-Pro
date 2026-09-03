import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { CHAPTERS } from "@/data/chapters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award, FileText, TrendingUp, AlertCircle, CheckCircle2, FileDown, Save, Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import HelpTip from "@/components/HelpTip";
import { exportDictamenPDF, exportDictamenWord } from "@/utils/exporter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResultSection() {
  const { paciente, deficiencias, tituloII, tituloIPercent, pcl } = useApp();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const verdict =
    pcl.total >= 50
      ? { label: "Pérdida de Capacidad Laboral SEVERA", color: "destructive" as const, icon: AlertCircle }
      : pcl.total >= 25
      ? { label: "Pérdida de Capacidad Laboral MODERADA", color: "warning" as const, icon: TrendingUp }
      : { label: "Pérdida de Capacidad Laboral LEVE", color: "success" as const, icon: CheckCircle2 };

  const Icon = verdict.icon;
  const colorClass =
    verdict.color === "destructive"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : verdict.color === "warning"
      ? "bg-warning/10 text-warning-foreground border-warning/30"
      : "bg-success/10 text-success border-success/30";

  const onPDF = () => {
    if (!paciente.nombre) {
      toast.error("Completa los datos del paciente primero");
      return;
    }
    exportDictamenPDF({ paciente, deficiencias, tituloII, tituloIPercent, pcl });
    toast.success("Dictamen PDF generado");
  };

  const onWord = () => {
    if (!paciente.nombre) {
      toast.error("Completa los datos del paciente primero");
      return;
    }
    exportDictamenWord({ paciente, deficiencias, tituloII, tituloIPercent, pcl });
    toast.success("Dictamen Word generado");
  };

  const onSave = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }
    if (!paciente.nombre) {
      toast.error("Completa los datos del paciente");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("valoraciones").insert({
      user_id: user.id,
      paciente_nombre: paciente.nombre,
      paciente_documento: paciente.documento || null,
      paciente: paciente as any,
      deficiencias: deficiencias as any,
      titulo_ii: tituloII as any,
      titulo_i_percent: tituloIPercent,
      pcl_total: pcl.total,
      pcl: pcl as any,
    });
    setSaving(false);
    if (error) {
      toast.error("Error al guardar: " + error.message);
      return;
    }
    toast.success("Valoración guardada en tu historial");
  };

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-success flex items-center justify-center shadow-glow">
            <Award className="h-6 w-6 text-success-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
              Resultado Final — PCL
              <HelpTip title="Cómo se calcula el PCL">
                <p>
                  <strong>PCL = Título I (50%) + AVD (25%) + Rol Laboral (25%)</strong>
                </p>
                <p>
                  El % de Título I se obtiene combinando los 15 capítulos por
                  <strong> fórmula de Balthazard</strong>:
                </p>
                <code className="block font-mono text-xs bg-muted px-2 py-1 rounded">
                  A + (100 − A) × (B/100)
                </code>
                <p>
                  Umbrales: <strong>≥50%</strong> severa, <strong>25-49%</strong>{" "}
                  moderada, <strong>&lt;25%</strong> leve.
                </p>
              </HelpTip>
            </h1>
            <p className="text-sm text-muted-foreground">
              Decreto 1507/2014 · Título I (50%) + AVD (25%) + Rol Laboral (25%)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar valoración
          </Button>
          <Button size="sm" onClick={onPDF}>
            <FileDown className="h-4 w-4" />
            Exportar Reporte PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onWord}>
            <FileText className="h-4 w-4" />
            Exportar Reporte Word
          </Button>
        </div>
      </header>

      <Card className="overflow-hidden border-0 shadow-elegant">
        <div className="gradient-primary p-8 text-primary-foreground relative">
          <div className="relative z-10 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-widest opacity-80">PCL Total</p>
              <p className="text-5xl sm:text-7xl font-mono font-bold mt-2">{pcl.total}%</p>
              <Badge className={`mt-3 ${colorClass} bg-background/95`}>
                <Icon className="h-3 w-3 mr-1.5" />
                {verdict.label}
              </Badge>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-3 sm:gap-4 sm:text-right lg:w-auto">
              <Component label="Título I" value={pcl.tituloI} max={50} />
              <Component label="AVD" value={pcl.avd} max={25} />
              <Component label="Rol Laboral" value={pcl.rolLaboral} max={25} />
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-primary-glow/20 blur-3xl" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Nombre" value={paciente.nombre || "—"} />
            <Row label="Documento" value={paciente.documento || "—"} />
            <Row label="Edad" value={paciente.edad ? `${paciente.edad} años` : "—"} />
            <Row label="Ocupación" value={paciente.ocupacion || "—"} />
            <Row label="F. estructuración" value={paciente.fechaEstructuracion || "—"} mono />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Título I — Detalle por capítulo</span>
              <span className="text-sm font-mono text-primary">{tituloIPercent}% combinado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CHAPTERS.map((ch) => {
                const def = deficiencias[ch.id];
                const pct = def?.percent ?? 0;
                const ChIcon = ch.icon;
                return (
                  <div key={ch.id} className="flex items-center gap-3">
                    <ChIcon className={`h-4 w-4 shrink-0 ${def ? "text-primary" : "text-muted-foreground/40"}`} />
                    <span className={`text-sm flex-1 truncate ${def ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {ch.code}. {ch.short}
                    </span>
                    <Progress value={(pct / ch.maxPercent) * 100} className="w-24 h-1.5" />
                    <span className="font-mono text-sm w-14 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Título II — Roles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">AVD</span>
              <span className="font-mono text-sm">{tituloII.avd}/25 pts</span>
            </div>
            <Progress value={(tituloII.avd / 25) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">Rol Laboral</span>
              <span className="font-mono text-sm">{tituloII.rolLaboral}/25 pts</span>
            </div>
            <Progress value={(tituloII.rolLaboral / 25) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Component({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="bg-background/15 backdrop-blur rounded-lg px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-2xl font-mono font-bold mt-0.5">
        {value}<span className="text-xs opacity-70">/{max}</span>
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : "font-medium text-right truncate"}>{value}</span>
    </div>
  );
}
