/**
 * Lo aprendido de los Reels ya publicados de la banda (métricas reales). Se pide una vez al abrir
 * el centro de Reels; si falla, simplemente no se muestra nada (no bloquea el análisis).
 */
import { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/api";
import type { AprendizajeReelsResponse } from "../reelsApiTypes";

export type AprendizajeReels = Required<Pick<AprendizajeReelsResponse, "resumen" | "recomendacion">>;

/** Duración del selector (15/30/60) que corresponde a cada formato aprendido. */
export function duracionDeFormato(formato: AprendizajeReels["recomendacion"]["formato"]): 15 | 30 | 60 {
  return formato === "medio" ? 30 : formato === "largo" ? 60 : 15;
}

export function useAprendizajeReels() {
  const [aprendizaje, setAprendizaje] = useState<AprendizajeReels | null>(null);
  useEffect(() => {
    let vigente = true;
    apiFetch<AprendizajeReelsResponse>("/api/reels/aprendizaje")
      .then((r) => {
        if (vigente && r?.success && r.resumen && r.recomendacion) setAprendizaje({ resumen: r.resumen, recomendacion: r.recomendacion });
      })
      .catch((e) => console.warn("[Reels] No se pudo cargar lo aprendido de los Reels:", e));
    return () => {
      vigente = false;
    };
  }, []);
  return { aprendizaje };
}
