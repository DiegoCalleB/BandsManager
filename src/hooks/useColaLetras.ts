import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/api";
import { comoErrorCapturado } from '../utils/errorCapturado';

/** Estado de la cola de letras del servidor (espejo de `ResumenCola` en server/services/colaLetras.ts). */
export interface ResumenColaLetras {
  activado: boolean;
  limiteMes: number;
  hechasMes: number;
  pendientes: number;
  enCurso: number;
  hechas: number;
  sinLetra: string[];
  fallidas: string[];
  omitidas: number;
}

export const colaActiva = (r: ResumenColaLetras | null): boolean => Boolean(r && r.pendientes + r.enCurso > 0);

const CADA_MS = 8000;

/**
 * La transcripción en lote vive en el servidor: aquí solo se consulta y se pide. Mientras haya
 * trabajos se sondea la cola; cada vez que sube el número de letras hechas se avisa para refrescar las canciones.
 */
export function useColaLetras(alHacerseLetras: () => void) {
  const [resumen, setResumen] = useState<ResumenColaLetras | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [porTope, setPorTope] = useState(0);
  const hechasPrevias = useRef<number | null>(null);
  const aviso = useRef(alHacerseLetras);
  useEffect(() => { aviso.current = alHacerseLetras; });

  const aplicar = useCallback((r: ResumenColaLetras | null) => {
    if (!r) return;
    if (hechasPrevias.current !== null && r.hechas > hechasPrevias.current) aviso.current();
    hechasPrevias.current = r.hechas;
    setResumen(r);
  }, []);

  const refrescar = useCallback(async () => { aplicar(await pedirCola()); }, [aplicar]);

  useEffect(() => {
    let vivo = true;
    pedirCola().then((r) => { if (vivo) aplicar(r); });
    return () => { vivo = false; };
  }, [aplicar]);
  useEffect(() => {
    if (!colaActiva(resumen)) return;
    const t = setInterval(() => void refrescar(), CADA_MS);
    return () => clearInterval(t);
  }, [resumen, refrescar]);

  const accion = async (fn: () => Promise<unknown>) => {
    setError(null);
    try { await fn(); } catch (eCapturado) {
                                         const e = comoErrorCapturado(eCapturado); setError(e?.message || "No se pudo completar."); }
    await refrescar();
  };

  return {
    resumen,
    error,
    /** Canciones que cumplían los requisitos pero no cupieron en el tope mensual del plan. */
    porTope,
    encolar: (songIds?: string[]) =>
      accion(async () => {
        const r = await apiFetch<{ porTope?: number }>("/api/letras/cola", { method: "POST", body: JSON.stringify({ songIds }) });
        setPorTope(r?.porTope ?? 0);
      }),
    parar: () => accion(() => apiFetch("/api/letras/cola", { method: "DELETE" })),
    fijarAuto: (activado: boolean) =>
      accion(() => apiFetch("/api/letras/auto", { method: "PUT", body: JSON.stringify({ activado }) })),
  };
}

/** Estado de la cola de letras; `null` si no hay cola (migración pendiente, sin red…): la vista sigue sin el panel. */
async function pedirCola(): Promise<ResumenColaLetras | null> {
  try {
    return await apiFetch<ResumenColaLetras>("/api/letras/cola");
  } catch {
    return null;
  }
}
