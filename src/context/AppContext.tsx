import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  balthazard,
  calcPCL,
  combineChapterDeficiencies,
  type PCLBreakdown,
} from "@/utils/calculations";
import { CHAPTERS } from "@/data/chapters";

export interface PacienteData {
  nombre: string;
  documento: string;
  edad: number | "";
  sexo: "M" | "F" | "O" | "";
  ocupacion: string;
  fechaEstructuracion: string; // ISO date
  diagnosticos: string;
}

/** Detalle por capítulo: para Cap.1-14 guardamos clase + %; para Cap.15 lista de movimientos. */
export interface OsteomuscularEntry {
  jointId: string;
  movementId: string;
  segment: string;
  grados: number;
  fmc1: 0 | 1 | 2;
  fmc2: 0 | 1 | 2;
  fmc3: 0 | 1 | 2;
  letter: "A" | "B" | "C" | "D" | "E";
  value: number; // % asignado
}

export interface ChapterDeficiency {
  clase?: "I" | "II" | "III" | "IV";
  percent: number;            // % final del capítulo
  notes?: string;
  osteomuscular?: OsteomuscularEntry[]; // sólo Cap.15
}

export interface TituloIIData {
  /** AVD: 0..25 puntos. */
  avd: number;
  /** Rol Laboral: 0..25 puntos. */
  rolLaboral: number;
  avdRespuestas: Record<string, number>;
  rolRespuestas: Record<string, number>;
}

interface AppState {
  paciente: PacienteData;
  deficiencias: Record<number, ChapterDeficiency>;
  tituloII: TituloIIData;
  tituloIPercent: number;
  pcl: PCLBreakdown;
}

interface AppContextValue extends AppState {
  setPaciente: (p: Partial<PacienteData>) => void;
  setChapterDeficiency: (chapterId: number, data: ChapterDeficiency) => void;
  clearChapter: (chapterId: number) => void;
  setOsteomuscular: (entries: OsteomuscularEntry[]) => void;
  setTituloII: (data: Partial<TituloIIData>) => void;
  reset: () => void;
}

const initialPaciente: PacienteData = {
  nombre: "",
  documento: "",
  edad: "",
  sexo: "",
  ocupacion: "",
  fechaEstructuracion: "",
  diagnosticos: "",
};

const initialTituloII: TituloIIData = {
  avd: 0,
  rolLaboral: 0,
  avdRespuestas: {},
  rolRespuestas: {},
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [paciente, setPacienteState] = useState<PacienteData>(initialPaciente);
  const [deficiencias, setDeficiencias] = useState<Record<number, ChapterDeficiency>>({});
  const [tituloII, setTituloIIState] = useState<TituloIIData>(initialTituloII);

  const setPaciente = useCallback((p: Partial<PacienteData>) => {
    setPacienteState((prev) => ({ ...prev, ...p }));
  }, []);

  const setChapterDeficiency = useCallback(
    (chapterId: number, data: ChapterDeficiency) => {
      setDeficiencias((prev) => ({ ...prev, [chapterId]: data }));
    },
    [],
  );

  const clearChapter = useCallback((chapterId: number) => {
    setDeficiencias((prev) => {
      const next = { ...prev };
      delete next[chapterId];
      return next;
    });
  }, []);

  /** Cap. 15: combina entradas via Balthazard y guarda en deficiencias[15]. */
  const setOsteomuscular = useCallback((entries: OsteomuscularEntry[]) => {
    const percent = balthazard(entries.map((e) => e.value));
    setDeficiencias((prev) => ({
      ...prev,
      15: { percent, osteomuscular: entries },
    }));
  }, []);

  const setTituloII = useCallback((data: Partial<TituloIIData>) => {
    setTituloIIState((prev) => ({ ...prev, ...data }));
  }, []);

  const reset = useCallback(() => {
    setPacienteState(initialPaciente);
    setDeficiencias({});
    setTituloIIState(initialTituloII);
  }, []);

  const tituloIPercent = useMemo(() => {
    const map: Record<number, number | undefined> = {};
    CHAPTERS.forEach((c) => {
      map[c.id] = deficiencias[c.id]?.percent;
    });
    return combineChapterDeficiencies(map);
  }, [deficiencias]);

  const pcl = useMemo(
    () => calcPCL(tituloIPercent, tituloII.avd, tituloII.rolLaboral),
    [tituloIPercent, tituloII.avd, tituloII.rolLaboral],
  );

  const value: AppContextValue = {
    paciente,
    deficiencias,
    tituloII,
    tituloIPercent,
    pcl,
    setPaciente,
    setChapterDeficiency,
    clearChapter,
    setOsteomuscular,
    setTituloII,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
