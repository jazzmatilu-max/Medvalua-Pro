import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import type { Chapter, ClassOption } from "@/data/chapters";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save } from "lucide-react";

interface Props {
  chapter: Chapter;
}

/** Construye opciones discretas dentro del rango de cada clase para el dropdown. */
function buildOptions(chapter: Chapter) {
  const opts: { key: string; label: string; clase: ClassOption["clase"]; value: number; descripcion: string }[] = [];
  chapter.classes.forEach((c) => {
    const [min, max] = c.rango;
    // Tres puntos representativos por clase: bajo / medio / alto
    const mid = Math.round((min + max) / 2);
    const valores = Array.from(new Set([min, mid, max])).sort((a, b) => a - b);
    valores.forEach((v) => {
      opts.push({
        key: `${c.clase}-${v}`,
        label: `Clase ${c.clase} · ${v}% — ${c.descripcion}`,
        clase: c.clase,
        value: v,
        descripcion: c.descripcion,
      });
    });
  });
  return opts;
}

export default function ChapterClassForm({ chapter }: Props) {
  const { deficiencias, setChapterDeficiency, clearChapter } = useApp();
  const saved = deficiencias[chapter.id];
  const options = buildOptions(chapter);

  const initialKey = saved?.clase ? `${saved.clase}-${saved.percent}` : "";
  const [selectedKey, setSelectedKey] = useState(initialKey);
  const [notes, setNotes] = useState(saved?.notes ?? "");

  useEffect(() => {
    setSelectedKey(saved?.clase ? `${saved.clase}-${saved.percent}` : "");
    setNotes(saved?.notes ?? "");
  }, [saved]);

  const selected = options.find((o) => o.key === selectedKey);

  const onSave = () => {
    if (!selected) return;
    setChapterDeficiency(chapter.id, {
      clase: selected.clase,
      percent: selected.value,
      notes,
    });
  };

  const onClear = () => {
    clearChapter(chapter.id);
    setSelectedKey("");
    setNotes("");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Tope anatómico:{" "}
          <span className="font-mono font-medium text-foreground">
            {chapter.maxPercent}%
          </span>
        </p>
        {saved && (
          <Badge className="bg-success/10 text-success border-success/20">
            Guardado · Clase {saved.clase} · {saved.percent}%
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <Label>Selecciona la deficiencia (asigna % automáticamente)</Label>
        <Select value={selectedKey} onValueChange={setSelectedKey}>
          <SelectTrigger>
            <SelectValue placeholder="Elegir clase y grado del Manual 1507…" />
          </SelectTrigger>
          <SelectContent className="max-w-[600px]">
            {options.map((o) => (
              <SelectItem key={o.key} value={o.key}>
                <div className="flex items-center gap-2 max-w-[560px]">
                  <Badge variant="outline" className="font-mono shrink-0">
                    Clase {o.clase}
                  </Badge>
                  <span className="font-mono font-semibold text-primary shrink-0 w-12 text-right">
                    {o.value}%
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {o.descripcion}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="rounded-lg border border-primary/15 bg-primary-soft/40 p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
              Clase {selected.clase}
            </Badge>
            <span className="font-mono text-lg font-bold text-primary">
              {selected.value}%
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {selected.descripcion}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Sustento técnico (opcional)</Label>
        <Textarea
          rows={3}
          placeholder="Diagnóstico, hallazgos clínicos, ayudas diagnósticas que sustentan la clase…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={!selected}>
          <Save className="h-4 w-4 mr-2" />
          Guardar capítulo
        </Button>
        {saved && (
          <Button variant="ghost" onClick={onClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
