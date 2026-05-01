import { useMemo, useState } from "react";
import { CHAPTERS } from "@/data/chapters";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search, ClipboardList, Briefcase } from "lucide-react";
import HelpTip from "@/components/HelpTip";

export default function BibliotecaSection() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CHAPTERS;
    return CHAPTERS.filter((c) => {
      return (
        `${c.code} ${c.name} ${c.short}`.toLowerCase().includes(q) ||
        c.classes.some((cl) => cl.descripcion.toLowerCase().includes(q))
      );
    });
  }, [query]);

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
              Biblioteca — Decreto 1507/2014
              <HelpTip title="Cómo usar la biblioteca">
                <p>
                  Consulta rápida del decreto. Usa las pestañas para alternar entre{" "}
                  <strong>Título I</strong> (deficiencias por capítulo) y{" "}
                  <strong>Título II</strong> (AVD y Rol Laboral).
                </p>
              </HelpTip>
            </h1>
            <p className="text-sm text-muted-foreground">
              Diccionario pericial sin salir de la valoración.
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="t1">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="t1" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Título I
          </TabsTrigger>
          <TabsTrigger value="t2" className="gap-2">
            <Briefcase className="h-4 w-4" /> Título II
          </TabsTrigger>
        </TabsList>

        <TabsContent value="t1" className="mt-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar capítulo, criterio, sigla… (ej: NYHA, hipoacusia, ERC)"
              className="pl-9"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} de {CHAPTERS.length} capítulos coinciden.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.id} className="shadow-card">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">{c.code}</p>
                      <CardTitle className="text-base leading-tight">{c.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="font-mono shrink-0">
                      máx {c.maxPercent}%
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {c.classes.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Capítulo osteomuscular: rangos de movilidad articular (ROM) +
                        calculadora de 5 paradas (A-E).
                      </p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {c.classes.map((cl) => (
                          <li
                            key={cl.clase}
                            className="flex gap-3 border-l-2 border-primary/30 pl-3 py-0.5"
                          >
                            <span className="font-mono font-semibold text-primary shrink-0 w-16">
                              Clase {cl.clase}
                            </span>
                            <span className="font-mono text-muted-foreground shrink-0 w-16">
                              {cl.rango[0]}–{cl.rango[1]}%
                            </span>
                            <span className="text-foreground">{cl.descripcion}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="t2" className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">
                  Actividades de la Vida Diaria (AVD)
                </CardTitle>
                <p className="text-xs text-muted-foreground">Aporta hasta 25 puntos al PCL.</p>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  Evalúa la dependencia del valorado en: alimentación, higiene, movilidad,
                  comunicación, cognición, vida social, ocio y autonomía económica.
                </p>
                <p>
                  Asigne 0 a la afectación nula y el máximo del ítem cuando hay
                  dependencia total.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Rol Laboral</CardTitle>
                <p className="text-xs text-muted-foreground">Aporta hasta 25 puntos al PCL.</p>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  Mide la afectación para ejecutar el oficio habitual: demanda física,
                  cognitiva, sensorial, ergonómica, ambiental, de jornada e interpersonal.
                </p>
                <p>
                  Combinado con AVD y Título I produce el PCL final:{" "}
                  <span className="font-mono">T-I 50% + AVD 25% + RL 25%</span>.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
