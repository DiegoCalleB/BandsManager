// Operaciones sobre colecciones del estado en memoria (`state.tours`, `state.fans`...) que son de
// TODAS las bandas. Una ruta nunca debe asignar `state.x = <datos de una banda>`: eso borraba de
// memoria lo de las demás (contexto del chat, fallback sin Supabase). Estas funciones solo tocan
// los registros de la banda indicada.

import { bandaDe, mismaBanda } from "./bandAccess.js";

type ConBanda = { id?: string; band_id?: string; bandId?: string };

const esDeBanda = (r: ConBanda, bandId: string) => mismaBanda(bandaDe(r), bandId);

/** Sustituye los registros de `bandId` por `nuevos`; los de otras bandas se conservan. */
export function fusionarColeccionDeBanda<T extends ConBanda>(actual: T[] | undefined, bandId: string, nuevos: T[]): T[] {
  const ajenos = (actual || []).filter((r) => !esDeBanda(r, bandId));
  // Un registro que declara otra banda no entra por la puerta de esta.
  const propios = nuevos.filter((r) => !bandaDe(r) || esDeBanda(r, bandId));
  return [...ajenos, ...propios];
}

/** Quita el registro `id` solo si es de `bandId`. */
export function quitarDeBanda<T extends ConBanda>(actual: T[] | undefined, bandId: string, id: string): T[] {
  return (actual || []).filter((r) => !(r.id === id && (!bandaDe(r) || esDeBanda(r, bandId))));
}

/** Sustituye (o añade) `guardado` en lugar del registro `id` de `bandId`; nunca toca el de otra banda. */
export function reemplazarDeBanda<T extends ConBanda>(actual: T[] | undefined, bandId: string, id: string, guardado: T): T[] {
  return [...quitarDeBanda(actual, bandId, id), guardado];
}
