/**
 * Resumen de la semana de los Reels de la banda. Si falla no se muestra nada: es información,
 * no una pantalla que dependa de ello.
 */
import { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/api";
import type { ResumenSemanalResponse } from "../reelsApiTypes";

export function useResumenSemanal() {
  const [resumen, setResumen] = useState<ResumenSemanalResponse | null>(null);
  useEffect(() => {
    let vigente = true;
    apiFetch<ResumenSemanalResponse>("/api/reels/resumen-semanal")
      .then((r) => { if (vigente && r?.success) setResumen(r); })
      .catch((e) => console.warn("[Reels] No se pudo cargar el resumen semanal:", e));
    return () => { vigente = false; };
  }, []);
  return { resumen };
}
