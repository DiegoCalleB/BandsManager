import { apiFetch } from "../../../utils/api";
import type { ProximoHuecoResponse } from "../reelsApiTypes";

/** Próximo hueco que respeta la cadencia. Si falla se queda la hora del análisis: no bloquea nada. */
export async function pedirProximoHueco(plataforma: string, videoOrigen: string): Promise<{ fecha: string; hora: string; motivo: string } | null> {
  try {
    const q = new URLSearchParams({ plataforma, ...(videoOrigen ? { videoOrigen } : {}) });
    const r = await apiFetch<ProximoHuecoResponse>(`/api/reels/proximo-hueco?${q}`);
    return r?.success && r.fecha && r.hora ? { fecha: r.fecha, hora: r.hora, motivo: r.motivo || "" } : null;
  } catch (e) {
    console.warn("[Reels] No se pudo calcular el próximo hueco:", e);
    return null;
  }
}
