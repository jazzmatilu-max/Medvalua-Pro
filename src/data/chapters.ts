/**
 * Estructura oficial del Título I — Decreto 1507/2014.
 * Los 15 capítulos de deficiencias.
 *
 * Las clases I-IV son la estructura del Manual; los rangos %
 * son representativos y deben validarse contra las tablas exactas
 * del decreto para producción pericial.
 */

import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Eye,
  Ear,
  Wind,
  HeartPulse,
  Droplets,
  Activity,
  Soup,
  Beaker,
  Pill,
  Shield,
  Sparkles,
  Baby,
  Smile,
  Bone,
} from "lucide-react";

export interface ClassOption {
  clase: "I" | "II" | "III" | "IV";
  rango: [number, number];
  descripcion: string;
}

export interface Chapter {
  id: number;
  code: string;
  name: string;
  short: string;
  icon: LucideIcon;
  /** Tope anatómico del capítulo (validación de seguridad). */
  maxPercent: number;
  classes: ClassOption[];
}

const stdClasses = (
  ranges: [number, number][],
  descs: string[],
): ClassOption[] =>
  (["I", "II", "III", "IV"] as const).map((c, i) => ({
    clase: c,
    rango: ranges[i],
    descripcion: descs[i],
  }));

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    code: "Cap. 1",
    name: "Sistema Nervioso Central y Periférico",
    short: "Neurológico",
    icon: Brain,
    maxPercent: 80,
    classes: stdClasses(
      [[0, 14], [15, 25], [26, 50], [51, 80]],
      [
        "Síntomas neurológicos sin déficit objetivo significativo.",
        "Déficit neurológico leve, autovalente.",
        "Déficit moderado, requiere apoyo intermitente.",
        "Déficit severo, dependencia importante.",
      ],
    ),
  },
  {
    id: 2,
    code: "Cap. 2",
    name: "Órganos de los Sentidos — Visión",
    short: "Visual",
    icon: Eye,
    maxPercent: 50,
    classes: stdClasses(
      [[0, 9], [10, 24], [25, 39], [40, 50]],
      [
        "Agudeza/campo visual con afectación mínima.",
        "Disminución leve de agudeza o campo.",
        "Pérdida moderada bilateral.",
        "Ceguera funcional o pérdida severa bilateral.",
      ],
    ),
  },
  {
    id: 3,
    code: "Cap. 3",
    name: "Órganos de los Sentidos — Audición y Vestibular",
    short: "Audición",
    icon: Ear,
    maxPercent: 35,
    classes: stdClasses(
      [[0, 5], [6, 14], [15, 24], [25, 35]],
      [
        "Hipoacusia leve unilateral.",
        "Hipoacusia leve a moderada bilateral.",
        "Hipoacusia severa bilateral.",
        "Anacusia bilateral o vértigo incapacitante.",
      ],
    ),
  },
  {
    id: 4,
    code: "Cap. 4",
    name: "Sistema Respiratorio",
    short: "Respiratorio",
    icon: Wind,
    maxPercent: 50,
    classes: stdClasses(
      [[0, 9], [10, 24], [25, 39], [40, 50]],
      [
        "Disnea grandes esfuerzos.",
        "Disnea esfuerzos moderados, PFR levemente alterada.",
        "Disnea pequeños esfuerzos, hipoxemia.",
        "Insuficiencia respiratoria, O₂ permanente.",
      ],
    ),
  },
  {
    id: 5,
    code: "Cap. 5",
    name: "Sistema Cardiovascular",
    short: "Cardiovascular",
    icon: HeartPulse,
    maxPercent: 60,
    classes: stdClasses(
      [[0, 9], [10, 29], [30, 49], [50, 60]],
      [
        "Cardiopatía sin limitación funcional (NYHA I).",
        "NYHA II, FEVI conservada.",
        "NYHA III, FEVI reducida.",
        "NYHA IV, descompensación frecuente.",
      ],
    ),
  },
  {
    id: 6,
    code: "Cap. 6",
    name: "Sistema Hematológico",
    short: "Hematológico",
    icon: Droplets,
    maxPercent: 40,
    classes: stdClasses(
      [[0, 9], [10, 19], [20, 29], [30, 40]],
      [
        "Discrasia leve, sin transfusiones.",
        "Citopenia moderada controlada.",
        "Requiere tratamiento permanente / transfusiones ocasionales.",
        "Falla medular o coagulopatía severa.",
      ],
    ),
  },
  {
    id: 7,
    code: "Cap. 7",
    name: "Sistema Digestivo",
    short: "Digestivo",
    icon: Soup,
    maxPercent: 45,
    classes: stdClasses(
      [[0, 9], [10, 19], [20, 34], [35, 45]],
      [
        "Síntomas digestivos leves intermitentes.",
        "Patología crónica controlada con dieta/medicación.",
        "Compromiso nutricional o hepático moderado.",
        "Falla hepática / intestinal severa.",
      ],
    ),
  },
  {
    id: 8,
    code: "Cap. 8",
    name: "Sistema Genitourinario",
    short: "Genitourinario",
    icon: Beaker,
    maxPercent: 50,
    classes: stdClasses(
      [[0, 9], [10, 24], [25, 39], [40, 50]],
      [
        "Función renal/urológica preservada.",
        "ERC estadio II-III, TFG levemente reducida.",
        "ERC IV, requiere control especializado.",
        "ERC V / diálisis o trasplante.",
      ],
    ),
  },
  {
    id: 9,
    code: "Cap. 9",
    name: "Sistema Endocrino",
    short: "Endocrino",
    icon: Pill,
    maxPercent: 35,
    classes: stdClasses(
      [[0, 9], [10, 19], [20, 29], [30, 35]],
      [
        "Endocrinopatía controlada con tratamiento estable.",
        "Control metabólico irregular, sin órgano blanco.",
        "Daño de órgano blanco moderado.",
        "Complicaciones severas múltiples.",
      ],
    ),
  },
  {
    id: 10,
    code: "Cap. 10",
    name: "Sistema Inmunológico — Piel y Anexos",
    short: "Piel/Inmuno",
    icon: Shield,
    maxPercent: 40,
    classes: stdClasses(
      [[0, 9], [10, 19], [20, 29], [30, 40]],
      [
        "Lesiones limitadas, sin compromiso funcional.",
        "Compromiso cutáneo extenso o autoinmune leve.",
        "Enfermedad autoinmune sistémica controlada.",
        "Compromiso multisistémico severo.",
      ],
    ),
  },
  {
    id: 11,
    code: "Cap. 11",
    name: "Trastornos Mentales y del Comportamiento",
    short: "Mental",
    icon: Sparkles,
    maxPercent: 50,
    classes: stdClasses(
      [[0, 14], [15, 24], [25, 39], [40, 50]],
      [
        "Síntomas leves, funcionalidad conservada.",
        "Trastorno moderado, requiere tratamiento continuo.",
        "Compromiso laboral y social marcado.",
        "Discapacidad psicosocial severa.",
      ],
    ),
  },
  {
    id: 12,
    code: "Cap. 12",
    name: "Cabeza, Cuello y Cara — Estructura",
    short: "Cabeza/Cuello",
    icon: Smile,
    maxPercent: 35,
    classes: stdClasses(
      [[0, 9], [10, 19], [20, 29], [30, 35]],
      [
        "Cicatrices o deformidades menores.",
        "Pérdida estructural localizada.",
        "Deformidad severa con compromiso funcional.",
        "Pérdida estructural extensa, alteración deglución/fonación.",
      ],
    ),
  },
  {
    id: 13,
    code: "Cap. 13",
    name: "Sistema Reproductivo",
    short: "Reproductivo",
    icon: Baby,
    maxPercent: 25,
    classes: stdClasses(
      [[0, 4], [5, 9], [10, 17], [18, 25]],
      [
        "Disfunción leve, fertilidad conservada.",
        "Disfunción moderada, fertilidad disminuida.",
        "Pérdida funcional importante.",
        "Pérdida total de la función reproductiva.",
      ],
    ),
  },
  {
    id: 14,
    code: "Cap. 14",
    name: "Sistema Estomatognático — Oral y Maxilofacial",
    short: "Estomatológico",
    icon: Smile,
    maxPercent: 30,
    classes: stdClasses(
      [[0, 4], [5, 9], [10, 19], [20, 30]],
      [
        "Pérdida dental parcial, función conservada.",
        "Pérdida dental significativa, prótesis funcional.",
        "Compromiso de articulación temporomandibular.",
        "Pérdida estructural severa, alteración masticatoria/fonatoria.",
      ],
    ),
  },
  {
    id: 15,
    code: "Cap. 15",
    name: "Sistema Osteomuscular y Tegumentario",
    short: "Osteomuscular",
    icon: Bone,
    maxPercent: 80,
    // Cap. 15 NO usa selector de Clase: usa ROM + 5 paradas.
    classes: [],
  },
];

export const getChapter = (id: number) =>
  CHAPTERS.find((c) => c.id === id);
