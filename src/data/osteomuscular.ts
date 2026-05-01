/**
 * Capítulo 15 — Sistema Osteomuscular.
 * Articulaciones, movimientos, ROM normal y rangos A-E (5 paradas).
 *
 * NOTA PERICIAL: Los valores ROM y arrays A-E son representativos
 * según convenciones del Decreto 1507/2014 y deben ser validados
 * contra las tablas oficiales del manual antes de uso pericial.
 */

import type { ABCDE } from "@/utils/calculations";

export interface MovementDef {
  id: string;
  name: string;
  /** Grados de ROM normal (referencia). */
  romNormal: number;
  /** Valores % por clase A-E (5 paradas). */
  abcde: ABCDE;
}

export interface JointDef {
  id: string;
  name: string;
  segment: "Miembro Superior" | "Miembro Inferior" | "Columna";
  /** Tope anatómico del segmento para validar la suma. */
  movements: MovementDef[];
}

export const JOINTS: JointDef[] = [
  {
    id: "hombro",
    name: "Hombro",
    segment: "Miembro Superior",
    movements: [
      { id: "flexion", name: "Flexión", romNormal: 180, abcde: [1, 2, 4, 6, 9] },
      { id: "extension", name: "Extensión", romNormal: 50, abcde: [0, 1, 2, 3, 4] },
      { id: "abduccion", name: "Abducción", romNormal: 180, abcde: [1, 2, 4, 6, 9] },
      { id: "aduccion", name: "Aducción", romNormal: 50, abcde: [0, 1, 2, 3, 4] },
      { id: "rot_int", name: "Rotación interna", romNormal: 90, abcde: [0, 1, 2, 3, 5] },
      { id: "rot_ext", name: "Rotación externa", romNormal: 90, abcde: [0, 1, 2, 3, 5] },
    ],
  },
  {
    id: "codo",
    name: "Codo",
    segment: "Miembro Superior",
    movements: [
      { id: "flexion", name: "Flexión", romNormal: 150, abcde: [1, 2, 3, 5, 7] },
      { id: "extension", name: "Extensión", romNormal: 0, abcde: [0, 1, 2, 3, 4] },
      { id: "supinacion", name: "Supinación", romNormal: 80, abcde: [0, 1, 2, 3, 4] },
      { id: "pronacion", name: "Pronación", romNormal: 80, abcde: [0, 1, 2, 3, 4] },
    ],
  },
  {
    id: "muneca",
    name: "Muñeca",
    segment: "Miembro Superior",
    movements: [
      { id: "flexion", name: "Flexión palmar", romNormal: 80, abcde: [0, 1, 2, 3, 5] },
      { id: "extension", name: "Extensión dorsal", romNormal: 70, abcde: [0, 1, 2, 3, 5] },
      { id: "des_radial", name: "Desviación radial", romNormal: 20, abcde: [0, 1, 1, 2, 3] },
      { id: "des_cubital", name: "Desviación cubital", romNormal: 30, abcde: [0, 1, 1, 2, 3] },
    ],
  },
  {
    id: "cadera",
    name: "Cadera",
    segment: "Miembro Inferior",
    movements: [
      { id: "flexion", name: "Flexión", romNormal: 120, abcde: [1, 2, 4, 6, 8] },
      { id: "extension", name: "Extensión", romNormal: 30, abcde: [0, 1, 2, 3, 4] },
      { id: "abduccion", name: "Abducción", romNormal: 45, abcde: [0, 1, 2, 3, 5] },
      { id: "aduccion", name: "Aducción", romNormal: 30, abcde: [0, 1, 2, 3, 4] },
      { id: "rot_int", name: "Rotación interna", romNormal: 45, abcde: [0, 1, 2, 3, 4] },
      { id: "rot_ext", name: "Rotación externa", romNormal: 45, abcde: [0, 1, 2, 3, 4] },
    ],
  },
  {
    id: "rodilla",
    name: "Rodilla",
    segment: "Miembro Inferior",
    movements: [
      { id: "flexion", name: "Flexión", romNormal: 135, abcde: [1, 2, 4, 6, 9] },
      { id: "extension", name: "Extensión", romNormal: 0, abcde: [0, 1, 2, 4, 6] },
    ],
  },
  {
    id: "tobillo",
    name: "Tobillo",
    segment: "Miembro Inferior",
    movements: [
      { id: "flexion_plantar", name: "Flexión plantar", romNormal: 50, abcde: [0, 1, 2, 3, 5] },
      { id: "dorsiflexion", name: "Dorsiflexión", romNormal: 20, abcde: [0, 1, 2, 3, 4] },
      { id: "inversion", name: "Inversión", romNormal: 35, abcde: [0, 1, 2, 3, 4] },
      { id: "eversion", name: "Eversión", romNormal: 15, abcde: [0, 1, 1, 2, 3] },
    ],
  },
  {
    id: "columna_cervical",
    name: "Columna Cervical",
    segment: "Columna",
    movements: [
      { id: "flexion", name: "Flexión", romNormal: 50, abcde: [1, 2, 3, 5, 7] },
      { id: "extension", name: "Extensión", romNormal: 60, abcde: [1, 2, 3, 5, 7] },
      { id: "lat_der", name: "Lateralización derecha", romNormal: 45, abcde: [0, 1, 2, 3, 4] },
      { id: "lat_izq", name: "Lateralización izquierda", romNormal: 45, abcde: [0, 1, 2, 3, 4] },
      { id: "rot_der", name: "Rotación derecha", romNormal: 80, abcde: [0, 1, 2, 3, 4] },
      { id: "rot_izq", name: "Rotación izquierda", romNormal: 80, abcde: [0, 1, 2, 3, 4] },
    ],
  },
  {
    id: "columna_lumbar",
    name: "Columna Dorsolumbar",
    segment: "Columna",
    movements: [
      { id: "flexion", name: "Flexión", romNormal: 90, abcde: [1, 3, 5, 7, 10] },
      { id: "extension", name: "Extensión", romNormal: 30, abcde: [0, 1, 2, 4, 6] },
      { id: "lat_der", name: "Lateralización derecha", romNormal: 30, abcde: [0, 1, 2, 3, 4] },
      { id: "lat_izq", name: "Lateralización izquierda", romNormal: 30, abcde: [0, 1, 2, 3, 4] },
    ],
  },
];

/** Tope anatómico por segmento (% máximo del Decreto 1507/2014). */
export const SEGMENT_MAX: Record<JointDef["segment"], number> = {
  "Miembro Superior": 60,
  "Miembro Inferior": 50,
  "Columna": 35,
};

export const getJoint = (id: string) => JOINTS.find((j) => j.id === id);
