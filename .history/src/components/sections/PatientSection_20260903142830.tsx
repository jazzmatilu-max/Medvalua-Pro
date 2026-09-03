import { useApp } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import HelpTip from "@/components/HelpTip";

export default function PatientSection() {
  const { paciente, setPaciente } = useApp();

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <header className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <User className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-1.5">
            Datos del Paciente
            <HelpTip title="Cómo diligenciar esta sección">
              <p>
                Captura la información de identificación del valorado. La{" "}
                <strong>fecha de estructuración</strong> es la fecha en que se
                considera consolidada la deficiencia y es clave para efectos
                legales del dictamen.
              </p>
              <p>
                En diagnósticos, lista los códigos <strong>CIE-10</strong>{" "}
                relevantes separados por comas.
              </p>
            </HelpTip>
          </h1>
          <p className="text-sm text-muted-foreground">
            Información básica para la valoración pericial.
          </p>
        </div>
      </header>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Identificación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Nombre completo</Label>
            <Input
              value={paciente.nombre}
              onChange={(e) => setPaciente({ nombre: e.target.value })}
              placeholder="Juan Pérez Rodríguez"
            />
          </div>
          <div className="space-y-2">
            <Label>Documento de identidad</Label>
            <Input
              value={paciente.documento}
              onChange={(e) => setPaciente({ documento: e.target.value })}
              placeholder="C.C. 1.000.000.000"
            />
          </div>
          <div className="space-y-2">
            <Label>Edad</Label>
            <Input
              type="number"
              value={paciente.edad}
              onChange={(e) =>
                setPaciente({ edad: e.target.value === "" ? "" : Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Sexo</Label>
            <Select
              value={paciente.sexo}
              onValueChange={(v) => setPaciente({ sexo: v as "M" | "F" | "O" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
                <SelectItem value="O">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ocupación</Label>
            <Input
              value={paciente.ocupacion}
              onChange={(e) => setPaciente({ ocupacion: e.target.value })}
              placeholder="Operario de planta"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Fecha de diligenciamiento</Label>
            <Input
              type="date"
              value={paciente.fechaEstructuracion}
              onChange={(e) => setPaciente({ fechaEstructuracion: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Diagnósticos principales</Label>
            <Textarea
              rows={3}
              placeholder="Lista de diagnósticos CIE-10 relevantes…"
              value={paciente.diagnosticos}
              onChange={(e) => setPaciente({ diagnosticos: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
