import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Briefcase, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import HelpTip from "@/components/HelpTip";

interface Question {
  id: string;
  text: string;
  /** Puntos máximos asignables a esta pregunta. */
  max: number;
}

const AVD_QUESTIONS: Question[] = [
  { id: "alim", text: "Alimentación (cortar, masticar, deglutir)", max: 3 },
  { id: "higiene", text: "Higiene personal (baño, vestido)", max: 4 },
  { id: "movilidad", text: "Movilidad en el hogar y desplazamientos", max: 4 },
  { id: "comunicacion", text: "Comunicación (lenguaje, escritura)", max: 3 },
  { id: "cognicion", text: "Funciones cognitivas (memoria, orientación)", max: 4 },
  { id: "social", text: "Relaciones sociales y familiares", max: 3 },
  { id: "ocio", text: "Actividades de ocio y recreativas", max: 2 },
  { id: "auto", text: "Autonomía económica y manejo del hogar", max: 2 },
];

const ROL_QUESTIONS: Question[] = [
  { id: "fisico", text: "Capacidad física para tareas habituales del oficio", max: 5 },
  { id: "cognitivo", text: "Demanda cognitiva del puesto (concentración, decisión)", max: 4 },
  { id: "sensorial", text: "Demanda sensorial específica (visual/auditiva/táctil)", max: 3 },
  { id: "ergonomica", text: "Posturas, manipulación de cargas, movimientos repetitivos", max: 4 },
  { id: "ambiental", text: "Tolerancia a riesgos ambientales del puesto", max: 3 },
  { id: "horario", text: "Cumplimiento de jornada y ritmo laboral", max: 3 },
  { id: "interpersonal", text: "Interacción interpersonal y trabajo en equipo", max: 3 },
];

export default function TituloIISection() {
  const { tituloII, setTituloII } = useApp();

  const setRespuesta = (group: "avd" | "rol", id: string, value: number) => {
    if (group === "avd") {
      const next = { ...tituloII.avdRespuestas, [id]: value };
      const total = Object.values(next).reduce((a, b) => a + b, 0);
      setTituloII({ avdRespuestas: next, avd: Math.min(25, total) });
    } else {
      const next = { ...tituloII.rolRespuestas, [id]: value };
      const total = Object.values(next).reduce((a, b) => a + b, 0);
      setTituloII({ rolRespuestas: next, rolLaboral: Math.min(25, total) });
    }
  };

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
              Título II — Roles
              <HelpTip title="Cómo calificar Título II">
                <p>
                  Para cada pregunta, selecciona los <strong>puntos</strong> de
                  0 hasta el máximo indicado, según el grado de afectación
                  observada en el valorado.
                </p>
                <p>
                  El total de cada bloque está topado a <strong>25 puntos</strong>:
                  AVD aporta el 25% y Rol Laboral el 25% del PCL final.
                </p>
                <p>0 = sin afectación · máximo = afectación total.</p>
              </HelpTip>
            </h1>
            <p className="text-sm text-muted-foreground">
              AVD (máx. 25 pts) y Rol Laboral (máx. 25 pts).
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <ScoreCard label="AVD" value={tituloII.avd} max={25} />
          <ScoreCard label="Rol Laboral" value={tituloII.rolLaboral} max={25} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <QuestionCard
          icon={<HeartHandshake className="h-5 w-5" />}
          title="Actividades de la Vida Diaria (AVD)"
          questions={AVD_QUESTIONS}
          answers={tituloII.avdRespuestas}
          onChange={(id, v) => setRespuesta("avd", id, v)}
        />
        <QuestionCard
          icon={<Briefcase className="h-5 w-5" />}
          title="Rol Laboral"
          questions={ROL_QUESTIONS}
          answers={tituloII.rolRespuestas}
          onChange={(id, v) => setRespuesta("rol", id, v)}
        />
      </div>
    </div>
  );
}

function ScoreCard({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="rounded-xl border bg-card px-5 py-3 shadow-card min-w-[140px]">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-mono font-bold text-primary">
        {value}<span className="text-base text-muted-foreground">/{max}</span>
      </p>
    </div>
  );
}

function QuestionCard({
  icon,
  title,
  questions,
  answers,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  questions: Question[];
  answers: Record<string, number>;
  onChange: (id: string, value: number) => void;
}) {
  const total = useMemo(
    () => questions.reduce((acc, q) => acc + (answers[q.id] ?? 0), 0),
    [questions, answers],
  );

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="h-9 w-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <span className="text-sm font-mono text-muted-foreground">
          {total} pts
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        {questions.map((q) => {
          const current = answers[q.id] ?? 0;
          const opciones = Array.from({ length: q.max + 1 }, (_, i) => i);
          return (
            <div key={q.id} className="space-y-2">
              <Label className="text-sm leading-snug">{q.text}</Label>
              <RadioGroup
                value={String(current)}
                onValueChange={(v) => onChange(q.id, Number(v))}
                className="flex flex-wrap gap-1.5"
              >
                {opciones.map((n) => (
                  <label
                    key={n}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-md border text-sm font-mono cursor-pointer transition-base",
                      current === n
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted/60",
                    )}
                  >
                    <RadioGroupItem value={String(n)} className="sr-only" />
                    {n}
                  </label>
                ))}
              </RadioGroup>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
