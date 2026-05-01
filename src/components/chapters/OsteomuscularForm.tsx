import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import type { OsteomuscularEntry } from "@/context/AppContext";
import { JOINTS, SEGMENT_MAX, getJoint } from "@/data/osteomuscular";
import { modulator, balthazard, type FMC } from "@/utils/calculations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { AlertCircle, Plus, Trash2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const FMC_LABELS: { value: FMC; label: string; hint: string }[] = [
  { value: 0, label: "Mejor (0)", hint: "−1 paso" },
  { value: 1, label: "Igual (1)", hint: "0 pasos" },
  { value: 2, label: "Peor (2)", hint: "+1 paso" },
];

export default function OsteomuscularForm() {
  const { deficiencias, setOsteomuscular } = useApp();
  const saved = deficiencias[15];
  const entries: OsteomuscularEntry[] = saved?.osteomuscular ?? [];

  // Form temporal
  const [jointId, setJointId] = useState("");
  const [movementId, setMovementId] = useState("");
  const [grados, setGrados] = useState<number | "">("");
  const [fmc1, setFmc1] = useState<FMC>(1);
  const [fmc2, setFmc2] = useState<FMC>(1);
  const [fmc3, setFmc3] = useState<FMC>(1);

  const joint = getJoint(jointId);
  const movement = joint?.movements.find((m) => m.id === movementId);

  const preview = useMemo(() => {
    if (!movement) return null;
    return modulator(movement.abcde, fmc1, fmc2, fmc3);
  }, [movement, fmc1, fmc2, fmc3]);

  const segmentTotals = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    entries.forEach((e) => {
      grouped[e.segment] = grouped[e.segment] || [];
      grouped[e.segment].push(e.value);
    });
    return Object.entries(grouped).map(([seg, vals]) => ({
      segment: seg as keyof typeof SEGMENT_MAX,
      combined: balthazard(vals),
      max: SEGMENT_MAX[seg as keyof typeof SEGMENT_MAX] ?? 100,
    }));
  }, [entries]);

  const onAdd = () => {
    if (!joint || !movement || typeof grados !== "number" || !preview) return;
    const newEntry: OsteomuscularEntry = {
      jointId: joint.id,
      movementId: movement.id,
      segment: joint.segment,
      grados,
      fmc1,
      fmc2,
      fmc3,
      letter: preview.letter,
      value: preview.value,
    };
    setOsteomuscular([...entries, newEntry]);
    // reset parcial
    setMovementId("");
    setGrados("");
    setFmc1(1);
    setFmc2(1);
    setFmc3(1);
  };

  const onRemove = (idx: number) => {
    setOsteomuscular(entries.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg border border-primary/15 bg-primary-soft/40 p-4 text-sm text-foreground/80">
        <div className="flex items-center gap-2 font-medium text-primary mb-1">
          <Activity className="h-4 w-4" />
          Calculadora ROM + 5 Paradas (A-E)
        </div>
        Selecciona articulación y movimiento, registra los grados de movilidad
        y modula con los FMC (Dolor / Examen / Ayudas diagnósticas).
      </div>

      {/* Selectores */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Articulación</Label>
          <Select
            value={jointId}
            onValueChange={(v) => {
              setJointId(v);
              setMovementId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {JOINTS.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  <div className="flex flex-col">
                    <span>{j.name}</span>
                    <span className="text-xs text-muted-foreground">{j.segment}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Movimiento</Label>
          <Select value={movementId} onValueChange={setMovementId} disabled={!joint}>
            <SelectTrigger>
              <SelectValue placeholder={joint ? "Seleccionar…" : "—"} />
            </SelectTrigger>
            <SelectContent>
              {joint?.movements.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} <span className="text-xs text-muted-foreground ml-2">ROM {m.romNormal}°</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Grados medidos</Label>
          <Input
            type="number"
            min={0}
            value={grados}
            disabled={!movement}
            onChange={(e) =>
              setGrados(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="font-mono"
          />
          {movement && (
            <p className="text-xs text-muted-foreground">
              ROM normal: <span className="font-mono">{movement.romNormal}°</span>
            </p>
          )}
        </div>
      </div>

      {/* FMC */}
      {movement && (
        <div className="grid gap-4 md:grid-cols-3 rounded-lg border bg-card p-4">
          <FmcSelector label="FMC 1 — Dolor" value={fmc1} onChange={setFmc1} />
          <FmcSelector label="FMC 2 — Examen físico" value={fmc2} onChange={setFmc2} />
          <FmcSelector label="FMC 3 — Ayudas diagnósticas" value={fmc3} onChange={setFmc3} />
        </div>
      )}

      {/* Preview A-E */}
      {preview && movement && (
        <div className="flex items-center justify-between gap-4 rounded-xl gradient-primary p-5 text-primary-foreground shadow-elegant">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Resultado modulado</p>
            <p className="text-3xl font-bold mt-1">
              Clase {preview.letter}
              <span className="text-base font-normal opacity-80 ml-3">
                {preview.totalSteps >= 0 ? "+" : ""}{preview.totalSteps} pasos desde C
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider opacity-80">% asignado</p>
            <p className="text-4xl font-mono font-bold">{preview.value}%</p>
          </div>
        </div>
      )}

      <Button onClick={onAdd} disabled={!movement || typeof grados !== "number"} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Agregar movimiento
      </Button>

      {/* Lista de entradas */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Movimientos registrados ({entries.length})
          </h4>
          <div className="rounded-lg border divide-y bg-card">
            {entries.map((e, i) => {
              const j = getJoint(e.jointId);
              const m = j?.movements.find((mm) => mm.id === e.movementId);
              return (
                <div key={i} className="flex items-center justify-between p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {j?.name} · {m?.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {e.grados}° · FMC {e.fmc1}/{e.fmc2}/{e.fmc3} · {e.segment}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary text-primary-foreground font-mono">
                      {e.letter} · {e.value}%
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => onRemove(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validación por segmento */}
          <div className="grid gap-2 sm:grid-cols-3">
            {segmentTotals.map((s) => {
              const over = s.combined > s.max;
              return (
                <div
                  key={s.segment}
                  className={cn(
                    "rounded-lg border p-3 text-sm",
                    over ? "border-destructive/40 bg-destructive/5" : "bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{s.segment}</span>
                    <span className="font-mono font-semibold">
                      {s.combined}% / {s.max}%
                    </span>
                  </div>
                  {over && (
                    <p className="flex items-center gap-1 mt-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" /> Excede tope anatómico
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border-2 border-primary/20 bg-primary-soft/40 p-4 flex items-center justify-between">
            <span className="font-semibold">Cap. 15 (Balthazard)</span>
            <span className="text-2xl font-mono font-bold text-primary">
              {saved?.percent ?? 0}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function FmcSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FMC;
  onChange: (v: FMC) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <RadioGroup
        value={String(value)}
        onValueChange={(v) => onChange(Number(v) as FMC)}
        className="space-y-1"
      >
        {FMC_LABELS.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-base text-sm",
              value === opt.value
                ? "border-primary bg-primary-soft/60"
                : "border-border hover:bg-muted/50",
            )}
          >
            <RadioGroupItem value={String(opt.value)} />
            <span className="flex-1">{opt.label}</span>
            <span className="text-xs text-muted-foreground font-mono">{opt.hint}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
