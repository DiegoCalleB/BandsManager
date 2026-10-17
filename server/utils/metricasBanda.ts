// Lógica pura de las métricas de banda (sin red): periodo mensual y elección del canal de YouTube.

import { normalizarNombreArtista } from "./spotifyMatch.js";

/** Periodo mensual `YYYY-MM` (UTC) para la fila de métricas. */
export function periodoMensual(fecha: Date = new Date()): string {
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface CanalYoutube {
  channelId: string;
  channelTitle: string;
}

/** Canal con el nombre exacto de la banda (tras normalizar); el primero que coincida. */
export function elegirCanalYoutube(nombreBanda: string, canales: CanalYoutube[]): CanalYoutube | null {
  const buscado = normalizarNombreArtista(nombreBanda);
  if (!buscado) return null;
  return (
    (canales || []).find(
      (c) => typeof c?.channelId === "string" && normalizarNombreArtista(c.channelTitle || "") === buscado,
    ) || null
  );
}

const MAX_SEGUIDORES = 1_000_000_000;

/** Seguidores anotados a mano: entero >= 0 (número o texto de dígitos); null si no es válido. */
export function validarSeguidores(valor: unknown): number | null {
  const n = typeof valor === "string" && /^\d+$/.test(valor.trim()) ? Number(valor.trim()) : valor;
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= MAX_SEGUIDORES ? n : null;
}
