/**
 * MedValua — Exportadores
 * - PDF profesional del dictamen (jsPDF + autotable)
 * - CSV consolidado de valoraciones (historial)
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CHAPTERS } from "@/data/chapters";

export function slugify(s: string): string {
  return (
    (s || "paciente")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "paciente"
  );
}

export function downloadBlob(filename: string, content: BlobPart, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface DictamenData {
  paciente: {
    nombre: string;
    documento: string;
    edad: number | "";
    sexo: string;
    ocupacion: string;
    fechaEstructuracion: string;
    diagnosticos: string;
  };
  deficiencias: Record<number, { clase?: string; percent: number; notes?: string }>;
  tituloII: { avd: number; rolLaboral: number };
  tituloIPercent: number;
  pcl: { tituloI: number; avd: number; rolLaboral: number; total: number };
}

/** Genera el PDF del dictamen y dispara la descarga. */
export function exportDictamenPDF(data: DictamenData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const teal: [number, number, number] = [22, 138, 122];

  // Header
  doc.setFillColor(...teal);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MedValua", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Dictamen Pericial · Decreto 1507/2014 — Colombia", margin, 50);
  doc.setFontSize(9);
  doc.text(`Emitido: ${new Date().toLocaleString("es-CO")}`, pageW - margin, 50, { align: "right" });

  // Paciente
  let y = 100;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("1. Datos del Paciente", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y + 4,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: "bold", textColor: [80, 80, 80] },
      1: { cellWidth: "auto" },
    },
    body: [
      ["Nombre", data.paciente.nombre || "—"],
      ["Documento", data.paciente.documento || "—"],
      ["Edad", data.paciente.edad ? `${data.paciente.edad} años` : "—"],
      ["Sexo", data.paciente.sexo || "—"],
      ["Ocupación", data.paciente.ocupacion || "—"],
      ["F. Estructuración", data.paciente.fechaEstructuracion || "—"],
      ["Diagnósticos", data.paciente.diagnosticos || "—"],
    ],
  });
  // @ts-expect-error autotable agrega lastAutoTable
  y = doc.lastAutoTable.finalY + 16;

  // PCL Box
  doc.setFillColor(...teal);
  doc.roundedRect(margin, y, pageW - margin * 2, 70, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PÉRDIDA DE CAPACIDAD LABORAL (PCL)", margin + 16, y + 22);
  doc.setFontSize(28);
  doc.text(`${data.pcl.total}%`, margin + 16, y + 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const colX = margin + 220;
  doc.text(`Título I: ${data.pcl.tituloI} / 50`, colX, y + 30);
  doc.text(`AVD: ${data.pcl.avd} / 25`, colX, y + 46);
  doc.text(`Rol Laboral: ${data.pcl.rolLaboral} / 25`, colX, y + 62);

  const veredicto = data.pcl.total >= 50 ? "SEVERA" : data.pcl.total >= 25 ? "MODERADA" : "LEVE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Categoría: ${veredicto}`, pageW - margin - 16, y + 30, { align: "right" });
  y += 90;

  // Título I detalle
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`2. Título I — Deficiencias (combinado: ${data.tituloIPercent}%)`, margin, y);
  y += 6;

  const filas = CHAPTERS.map((ch) => {
    const def = data.deficiencias[ch.id];
    return [
      ch.code,
      ch.name,
      def?.clase ?? "—",
      def ? `${def.percent}%` : "Sin calificar",
      `${ch.maxPercent}%`,
    ];
  });

  autoTable(doc, {
    startY: y + 6,
    head: [["Cap.", "Sistema", "Clase", "Asignado", "Tope"]],
    body: filas,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: teal, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      2: { cellWidth: 50, halign: "center" },
      3: { cellWidth: 80, halign: "right", fontStyle: "bold" },
      4: { cellWidth: 50, halign: "right", textColor: [120, 120, 120] },
    },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(
        `MedValua · Dictamen ${data.paciente.nombre || "—"}`,
        margin,
        doc.internal.pageSize.getHeight() - 20,
      );
      doc.text(
        `Página ${doc.getNumberOfPages()}`,
        pageW - margin,
        doc.internal.pageSize.getHeight() - 20,
        { align: "right" },
      );
    },
  });

  // @ts-expect-error autotable
  y = doc.lastAutoTable.finalY + 16;

  if (y > 700) { doc.addPage(); y = 60; }
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("3. Título II — Roles", margin, y);
  autoTable(doc, {
    startY: y + 6,
    head: [["Componente", "Puntos", "Máximo"]],
    body: [
      ["Actividades de la Vida Diaria (AVD)", String(data.tituloII.avd), "25"],
      ["Rol Laboral", String(data.tituloII.rolLaboral), "25"],
    ],
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: teal, textColor: 255 },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" },
      2: { halign: "right", textColor: [120, 120, 120] },
    },
  });

  // @ts-expect-error autotable
  y = doc.lastAutoTable.finalY + 20;

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Fórmula PCL = Título I (50%) + AVD (25%) + Rol Laboral (25%). " +
      "Combinación intracapítulo por fórmula de Balthazard: A + (100−A)×(B/100).",
    margin,
    y,
    { maxWidth: pageW - margin * 2 },
  );

  doc.save(
    `medvalua-${slugify(data.paciente.nombre)}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

export interface ValoracionRow {
  paciente_nombre: string;
  paciente_documento: string | null;
  titulo_i_percent: number;
  pcl_total: number;
  created_at: string;
  updated_at: string;
}

/** Exporta CSV consolidado (compatible con Excel). */
export function exportValoracionesCSV(rows: ValoracionRow[]) {
  const header = ["Paciente", "Documento", "Título I (%)", "PCL Total (%)", "Categoría", "Creado", "Actualizado"];
  const cat = (n: number) => (n >= 50 ? "Severa" : n >= 25 ? "Moderada" : "Leve");
  const escape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        escape(r.paciente_nombre),
        escape(r.paciente_documento ?? ""),
        r.titulo_i_percent,
        r.pcl_total,
        escape(cat(r.pcl_total)),
        escape(new Date(r.created_at).toLocaleString("es-CO")),
        escape(new Date(r.updated_at).toLocaleString("es-CO")),
      ].join(","),
    ),
  ];
  downloadBlob(
    `medvalua-valoraciones-${new Date().toISOString().slice(0, 10)}.csv`,
    "\uFEFF" + lines.join("\n"),
    "text/csv;charset=utf-8",
  );
}
