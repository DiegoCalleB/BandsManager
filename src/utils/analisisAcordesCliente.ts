import { apiFetch } from "./api";
import type { AnalisisAcordes } from "../types";

/** Pide al servidor detectar los acordes con tiempos del audio de la canción (cálculo local, sin IA). Lanza con el motivo del servidor. */
export async function analizarAcordesDelAudio(songId: string, sobrescribir = false): Promise<AnalisisAcordes> {
  const data = await apiFetch<{ analisis?: AnalisisAcordes; error?: string }>(`/api/songs/${encodeURIComponent(songId)}/analizar-acordes`, {
    method: "POST",
    body: JSON.stringify(sobrescribir ? { sobrescribir } : {}),
  });
  if (!data?.analisis) throw new Error(data?.error || "No se pudieron analizar los acordes");
  return data.analisis;
}

/** Mensaje de aviso tras detectar: avisa de cuántos tramos quedaron sin acorde claro. */
export function resumenAnalisisAcordes(analisis: AnalisisAcordes): string {
  const total = analisis.segmentos.length;
  const dudosos = analisis.segmentos.filter((s) => s.acorde === "N").length;
  return dudosos > 0
    ? `⚠️ Acordes detectados del audio (${total} tramos, ${dudosos} sin acorde claro). Es una detección automática: revísala de oído.`
    : `✓ Acordes detectados del audio (${total} tramos). Es una detección automática: revísala de oído.`;
}
