import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  History, Pencil, Trash2, FileDown, FileText, FolderOpen, Loader2, Sheet,
} from "lucide-react";
import { toast } from "sonner";
import { exportDictamenPDF, exportDictamenWord, exportValoracionesCSV } from "@/utils/exporter";
import HelpTip from "@/components/HelpTip";

interface Valoracion {
  id: string;
  paciente_nombre: string;
  paciente_documento: string | null;
  paciente: any;
  deficiencias: any;
  titulo_ii: any;
  titulo_i_percent: number;
  pcl_total: number;
  pcl: any;
  created_at: string;
  updated_at: string;
}

export default function ValoracionesSection({ onLoad }: { onLoad?: () => void }) {
  const { user } = useAuth();
  const { setPaciente, setChapterDeficiency, clearChapter, setTituloII, reset } = useApp();
  const [rows, setRows] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [delId, setDelId] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("valoraciones")
      .select("*")
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as Valoracion[]);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user]);

  const onDelete = async () => {
    if (!delId) return;
    const { error } = await supabase.from("valoraciones").delete().eq("id", delId);
    setDelId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Valoración eliminada");
    fetchAll();
  };

  const onLoadInto = (v: Valoracion) => {
    reset();
    setPaciente(v.paciente);
    Object.entries(v.deficiencias || {}).forEach(([k, val]) => {
      setChapterDeficiency(Number(k), val as any);
    });
    setTituloII(v.titulo_ii);
    toast.success(`Cargado: ${v.paciente_nombre}`);
    onLoad?.();
  };

  const onPDF = (v: Valoracion) => {
    exportDictamenPDF({
      paciente: v.paciente,
      deficiencias: v.deficiencias,
      tituloII: v.titulo_ii,
      tituloIPercent: v.titulo_i_percent,
      pcl: v.pcl,
    });
  };

  const onWord = (v: Valoracion) => {
    exportDictamenWord({
      paciente: v.paciente,
      deficiencias: v.deficiencias,
      tituloII: v.titulo_ii,
      tituloIPercent: v.titulo_i_percent,
      pcl: v.pcl,
    });
  };

  const onCSV = () => {
    if (rows.length === 0) { toast.error("Sin valoraciones para exportar"); return; }
    exportValoracionesCSV(rows.map((r) => ({
      paciente_nombre: r.paciente_nombre,
      paciente_documento: r.paciente_documento,
      titulo_i_percent: r.titulo_i_percent,
      pcl_total: r.pcl_total,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })));
    toast.success("CSV consolidado descargado");
  };

  const cat = (n: number) =>
    n >= 50
      ? { label: "Severa", cls: "bg-destructive/10 text-destructive border-destructive/30" }
      : n >= 25
      ? { label: "Moderada", cls: "bg-warning/10 text-warning-foreground border-warning/30" }
      : { label: "Leve", cls: "bg-success/10 text-success border-success/30" };

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <History className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
              Mis Valoraciones
              <HelpTip title="Histórico">
                <p>
                  Cada valoración guardada aparece aquí. Puedes <strong>editar</strong>{" "}
                  (cargarla en la calculadora), <strong>eliminar</strong>, descargar el{" "}
                  <strong>PDF individual</strong> o exportar el <strong>consolidado CSV</strong>{" "}
                  para revisar en Excel.
                </p>
              </HelpTip>
            </h1>
            <p className="text-sm text-muted-foreground">
              Histórico de pacientes valorados — persistido en backend.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onCSV}>
          <Sheet className="h-4 w-4" /> Exportar consolidado (CSV)
        </Button>
      </header>

      <Card className="shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aún no hay valoraciones guardadas. Crea una en{" "}
            <strong>Resultado Final → Guardar valoración</strong>.
          </div>
        ) : (
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="text-right">Título I</TableHead>
                <TableHead className="text-right">PCL</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const c = cat(r.pcl_total);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.paciente_nombre}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.paciente_documento || "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.titulo_i_percent}%</TableCell>
                    <TableCell className="text-right font-mono font-bold">{r.pcl_total}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.cls}>{c.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.updated_at).toLocaleDateString("es-CO")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => onLoadInto(r)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onPDF(r)} title="Descargar PDF">
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onWord(r)} title="Descargar Word">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onLoadInto(r)} title="Abrir">
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => setDelId(r.id)}
                          className="text-destructive hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta valoración?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará de forma permanente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
