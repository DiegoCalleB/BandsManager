import type { AjustesPistas } from './mezclaStems';

/** Mezcla y velocidad personales del Atril; viven solo en este dispositivo, nunca en la canción. */
export interface MezclaGuardada {
  ajustes: AjustesPistas;
  velocidad: number;
}

export const VELOCIDADES_ATRIL = [0.5, 0.75, 1] as const;
export const MEZCLA_VACIA: MezclaGuardada = { ajustes: {}, velocidad: 1 };

export const claveMezclaAtril = (songId: string | number) => `bm_mezcla_atril:${songId}`;

/** Lee lo guardado descartando cualquier valor corrupto o fuera de rango. */
export function leerMezcla(raw: string | null): MezclaGuardada {
  if (!raw) return MEZCLA_VACIA;
  try {
    const o = JSON.parse(raw) as { ajustes?: unknown; velocidad?: unknown };
    const ajustes: AjustesPistas = {};
    if (o.ajustes && typeof o.ajustes === 'object') {
      for (const [id, a] of Object.entries(o.ajustes as Record<string, Record<string, unknown>>)) {
        if (!a || typeof a !== 'object') continue;
        ajustes[id] = {
          ...(typeof a.volumen === 'number' && a.volumen >= 0 && a.volumen <= 1 ? { volumen: a.volumen } : {}),
          ...(a.muted === true ? { muted: true } : {}),
          ...(a.solo === true ? { solo: true } : {}),
        };
      }
    }
    const velocidad = typeof o.velocidad === 'number' && o.velocidad >= 0.25 && o.velocidad <= 2 ? o.velocidad : 1;
    return { ajustes, velocidad };
  } catch {
    return MEZCLA_VACIA;
  }
}

/** `null` cuando no hay nada que recordar (todo por defecto), para no ensuciar el almacenamiento. */
export function serializarMezcla(m: MezclaGuardada): string | null {
  const porDefecto = Object.keys(m.ajustes).length === 0 && m.velocidad === 1;
  return porDefecto ? null : JSON.stringify(m);
}
