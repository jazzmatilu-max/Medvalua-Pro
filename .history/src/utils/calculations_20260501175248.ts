/**
 * MedValua — Motor de cálculo (Decreto 1507/2014)
 *
 * Funciones críticas:
 *  1) balthazard(values): combinación recursiva de valores residuales.
 *     A + (100 - A) * (B/100), siempre con valores ordenados desc.
 *  2) modulator(base, fmc1, fmc2, fmc3): mueve el valor desde el índice 2 (C)
 *     dentro de [A, B, C, D, E] sumando pasos según los 3 FMC.
 *     FMC: 0 => -1 paso, 1 => 0 pasos, 2 => +1 paso. Total acotado a [-2, +2].
 */

export type ABCDE = readonly [number, number, number, number, number];

/**
 * Suma combinada de valores residuales (Balthazard).
 * Blindajes:
 *  - Filtra NaN, Infinity, negativos y > 100.
 *  - Acepta solo números finitos.
 *  - Acota cada entrada a [0, 100] antes de combinar.
 *  - Resultado garantizado en [0, 100].
 */
export function balthazard(values: number[]): number {
  if (!Array.isArray(values)) return 0;
  const filtered = values
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0)
    .map((v) => clamp(v, 0, 100));
  if (filtered.length === 0) return 0;
  if (filtered.length === 1) return round2(filtered[0]);

  // Orden descendente para minimizar la pérdida residual acumulada.
  const sorted = [...filtered].sort((a, b) => b - a);

  const combine = (a: number, b: number) => a + (100 - a) * (b / 100);
  let acc = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    acc = combine(acc, sorted[i]);
    if (acc >= 100) return 100;
  }
  return round2(clamp(acc, 0, 100));
}

/** Redondeo a 2 decimales para presentación. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** FMC válido: 0, 1 o 2. Cualquier otro valor se trata como 1 (neutro). */
export type FMC = 0 | 1 | 2;

/** Convierte un FMC a pasos (-1, 0, +1). */
export function fmcToStep(fmc: FMC): -1 | 0 | 1 {
  if (fmc === 0) return -1;
  if (fmc === 2) return 1;
  return 0;
}

export interface ModulatorResult {
  letter: "A" | "B" | "C" | "D" | "E";
  index: number;
  value: number;
  totalSteps: number;
}

/**
 * Calculadora de las 5 Paradas.
 * Base = índice 2 (C). Suma pasos desde C según FMC1+FMC2+FMC3.
 * Acotado al rango [0..4] => A..E.
 */
/** Normaliza un input arbitrario a FMC válido (0|1|2). */
function normalizeFMC(v: unknown): FMC {
  const n = Number(v);
  if (n === 0) return 0;
  if (n === 2) return 2;
  return 1; // por defecto neutro
}

export function modulator(
  range: ABCDE,
  fmc1: FMC,
  fmc2: FMC,
  fmc3: FMC,
): ModulatorResult {
  const baseIndex = 2;
  const f1 = normalizeFMC(fmc1);
  const f2 = normalizeFMC(fmc2);
  const f3 = normalizeFMC(fmc3);
  const rawSteps = fmcToStep(f1) + fmcToStep(f2) + fmcToStep(f3);
  // Acotar pasos al rango [-2, +2] según especificación de las 5 paradas.
  const steps = clamp(rawSteps, -2, 2);
  const targetIndex = clamp(baseIndex + steps, 0, 4);
  const letters: ModulatorResult["letter"][] = ["A", "B", "C", "D", "E"];
  // Defensa: si range no tiene 5 elementos válidos, devolver 0.
  const safeValue =
    Array.isArray(range) && Number.isFinite(range[targetIndex])
      ? clamp(range[targetIndex], 0, 100)
      : 0;
  return {
    letter: letters[targetIndex],
    index: targetIndex,
    value: round2(safeValue),
    totalSteps: steps,
  };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Combina deficiencias por capítulo en un solo % de Título I (Balthazard).
 */
export function combineChapterDeficiencies(
  chapterValues: Record<number, number | undefined>,
): number {
  const values = Object.values(chapterValues).filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  return balthazard(values);
}

/**
 * Cálculo del PCL Total (Decreto 1507/2014):
 *  PCL = Título I (50%) + AVD (25%) + Rol Laboral (25%)
 * Cada componente está expresado en su % máximo (50/25/25).
 */
export interface PCLBreakdown {
  tituloI: number;      // 0..50
  avd: number;          // 0..25
  rolLaboral: number;   // 0..25
  total: number;        // 0..100
}

export function calcPCL(
  tituloIPercent: number,    // 0..100 (deficiencia global combinada)
  avdPoints: number,         // 0..25
  rolPoints: number,         // 0..25
): PCLBreakdown {
  // El valor del Título I debe reflejar el % real de deficiencia combinado,
  // sin dividirlo por 2. El tope máximo aplicable al aporte de Título I es 50%,
  // por lo que acotamos `tituloIPercent` a 0..50.
  const tituloI = round2(clamp(tituloIPercent, 0, 50));
  const avd = round2(clamp(avdPoints, 0, 25));
  const rol = round2(clamp(rolPoints, 0, 25));
  return {
    tituloI,
    avd,
    rolLaboral: rol,
    total: round2(tituloI + avd + rol),
  };
}
