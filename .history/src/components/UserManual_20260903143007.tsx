import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";

export default function UserManual({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
            <BookOpen className="h-3.5 w-3.5 mr-2" />
            Manual de uso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Manual de Uso — MedValua
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="rounded-lg bg-primary/5 border border-primary/15 p-3">
              <h3 className="font-semibold text-base mb-1 text-primary">🔑 Acceso a la app</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>El registro es <strong>libre</strong>: cualquier persona puede crear cuenta con email y contraseña.</li>
                <li>Para usar las secciones clínicas necesitas un <strong>cupón de acceso</strong> entregado por el Administrador.</li>
                <li>Las secciones bloqueadas (Paciente, Título I, Título II, Resultado y Mis Valoraciones) muestran una pantalla con candado donde se ingresa el cupón.</li>
                <li>Una vez activado, tienes acceso por la cantidad de <strong>días</strong> que el admin haya definido (7, 15, 30, 60, 90, 180 o 365).</li>
                <li>Recibirás avisos cuando queden ≤3 días o el día de expiración.</li>
                <li>El primer usuario registrado obtiene rol <strong>Administrador</strong> automáticamente y nunca necesita cupón.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">1. Datos del Paciente</h3>
              <p className="text-muted-foreground">
                Inicia siempre completando nombre, documento, edad, sexo, ocupación
                y fecha de diligenciamiento Estos datos viajan al PDF y al historial.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">2. Título I — Deficiencias</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Cada uno de los 15 capítulos se abre en su acordeón.</li>
                <li>
                  Capítulos 1-14: selecciona en el desplegable la <strong>Clase y % oficial</strong>.
                  El sistema asigna el porcentaje automáticamente.
                </li>
                <li>
                  Capítulo 15 (Osteomuscular): elige articulación, movimiento, ingresa grados
                  y aplica las <strong>5 paradas (A-E)</strong> con FMC1 (dolor),
                  FMC2 (examen), FMC3 (ayudas).
                </li>
                <li>
                  El % combinado de Título I se calcula con la <strong>fórmula de Balthazard</strong>{" "}
                  y se muestra en la cabecera lateral en tiempo real.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">3. Título II — Roles</h3>
              <p className="text-muted-foreground">
                Responde el cuestionario de AVD (máx 25 pts) y Rol Laboral (máx 25 pts).
                Cada respuesta va de 0 (sin afectación) hasta el máximo (afectación total).
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">4. Resultado Final</h3>
              <p className="text-muted-foreground">
                PCL = <strong>Título I × 50% + AVD × 25% + Rol Laboral × 25%</strong>. Desde aquí puedes:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-1">
                <li><strong>Guardar valoración</strong> en tu historial en la nube.</li>
                <li><strong>Exportar PDF</strong> profesional del dictamen con datos del paciente, PCL total y detalle por capítulos.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">5. Mis Valoraciones</h3>
              <p className="text-muted-foreground">
                Revisa, recarga, elimina o descarga el PDF de cualquier valoración guardada.
                Exporta el consolidado <strong>CSV</strong> (compatible con Excel) cuando lo necesites.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">6. Biblioteca 1507</h3>
              <p className="text-muted-foreground">
                Diccionario rápido del Decreto 1507 con dos pestañas: Título I (criterios I-IV de los
                15 capítulos) y Título II (descripción de AVD y Rol Laboral). Acceso libre, no requiere cupón.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">7. Panel Administrador <span className="text-xs font-normal text-muted-foreground">(solo admin)</span></h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Generar cupones</strong> con duración personalizada (7 días a 1 año).</li>
                <li>Ver tarjetas de estadística: total, activos, en uso, expirados.</li>
                <li>
                  Tabla con <strong>quién usó cada cupón</strong> (nombre + email),
                  cuándo lo redimió, cuándo expira y días restantes.
                </li>
                <li>Filtrar por estado y buscar por código, nombre, email o notas.</li>
                <li>Recibe notificación al abrir el panel si hay cupones por expirar en ≤3 días.</li>
                <li>Copiar al portapapeles o eliminar cupones.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">8. Seguridad</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Recuperación de contraseña desde la pantalla de login (¿Olvidaste tu contraseña?).</li>
                <li>Mostrar/ocultar contraseña con el ícono del ojo.</li>
                <li>Tus valoraciones son privadas: solo tú las ves.</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
