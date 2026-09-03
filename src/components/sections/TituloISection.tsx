import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CHAPTERS } from "@/data/chapters";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/badge";
import ChapterClassForm from "@/components/chapters/ChapterClassForm";
import OsteomuscularForm from "@/components/chapters/OsteomuscularForm";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import HelpTip from "@/components/HelpTip";

export default function TituloISection() {
  const { deficiencias, tituloIPercent } = useApp();
  const completados = Object.keys(deficiencias).length;

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <ClipboardList className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
              Título I — Deficiencias
              <HelpTip title="Cómo calificar Título I">
                <p>
                  Abre cada capítulo y selecciona la <strong>Clase (I-IV)</strong>{" "}
                  que mejor describa la condición; el sistema asigna un % dentro
                  del rango oficial del Decreto 1507/2014.
                </p>
                <p>
                  El <strong>Capítulo 15 (Osteomuscular)</strong> no usa Clases:
                  se califica por movimiento articular usando la{" "}
                  <strong>calculadora de 5 paradas (A-E)</strong>:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Base = letra C (índice 2).</li>
                  <li>FMC1 (Dolor), FMC2 (Examen), FMC3 (Ayudas).</li>
                  <li>Cada FMC: 0 = -1 paso · 1 = neutro · 2 = +1 paso.</li>
                  <li>El total de pasos se suma a C → letra final.</li>
                </ul>
                <p>
                  Los % de los 15 capítulos se combinan vía{" "}
                  <strong>fórmula de Balthazard</strong> (no se suman).
                </p>
              </HelpTip>
            </h1>
            <p className="text-sm text-muted-foreground">
              15 capítulos del Decreto 1507/2014. Combinación por fórmula de Balthazard.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card px-5 py-3 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            % combinado Título I
          </p>
          <p className="text-3xl font-mono font-bold text-primary">
            {tituloIPercent}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {completados}/15 capítulos calificados
          </p>
        </div>
      </header>

      <Accordion type="multiple" className="space-y-3">
        {CHAPTERS.map((ch) => {
          const def = deficiencias[ch.id];
          const Icon = ch.icon;
          return (
            <AccordionItem
              key={ch.id}
              value={`ch-${ch.id}`}
              className="rounded-xl border bg-card shadow-sm overflow-hidden data-[state=open]:shadow-card transition-base"
            >
              <AccordionTrigger className="px-3 sm:px-5 py-4 hover:no-underline group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0 group-data-[state=open]:gradient-primary group-data-[state=open]:text-primary-foreground transition-base">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-mono text-muted-foreground">
                      {ch.code}
                    </p>
                    <p className="font-semibold leading-snug break-words">{ch.name}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 mr-1 sm:mr-3">
                  {def ? (
                    <Badge className="bg-success/10 text-success border-success/20 font-mono">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {def.percent}%
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Sin calificar
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 sm:px-5 pb-5 pt-1 border-t bg-muted/20">
                {ch.id === 15 ? <OsteomuscularForm /> : <ChapterClassForm chapter={ch} />}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
