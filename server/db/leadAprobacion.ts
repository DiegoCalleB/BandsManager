// Sello de la aprobación humana en `leads` (ver server/utils/aprobacionLead.ts). Escritura aparte de
// dbUpsertLead a propósito: el cliente nunca puede fijar estos campos por el cuerpo de la petición.

import { getSupabase, cleanBandId } from "./core.js";
import { hashTextoAprobado, accionTrasGuardar } from "../utils/aprobacionLead.js";

/** Guarda quién aprobó, cuándo y la huella del texto que se aprueba. Devuelve el error si falla. */
export async function dbSellarAprobacion(leadId: string, bandId: string, por: string, texto: unknown): Promise<string | null> {
  const { error } = await getSupabase()
    .from("leads")
    .update({ aprobado_por: por, aprobado_at: new Date().toISOString(), pitch_aprobado_hash: hashTextoAprobado(texto) })
    .eq("id", leadId)
    .eq("band_id", cleanBandId(bandId));
  return error ? String(error.message || error) : null;
}

/** Un texto editado tras aprobarlo vuelve a la cola de revisión y pierde el sello. */
export async function dbDegradarAAprobacionPendiente(leadId: string, bandId: string): Promise<string | null> {
  const { error } = await getSupabase()
    .from("leads")
    .update({ estado: "pendiente_aprobacion", aprobado_por: null, aprobado_at: null, pitch_aprobado_hash: null })
    .eq("id", leadId)
    .eq("band_id", cleanBandId(bandId));
  return error ? String(error.message || error) : null;
}

/**
 * Tras un PUT del lead: sella la aprobación si la petición aprobó, o devuelve a revisión un lead ya
 * aprobado cuyo texto se editó sin aprobarlo de nuevo. Devuelve el estado final del lead; si el
 * sello falla no pasa nada peligroso: sin huella el Enviador no despacha (falla hacia lo seguro).
 */
export async function aplicarAprobacionTrasGuardar(
  existente: { estado?: unknown; pitch_generado?: unknown } | null | undefined,
  cambios: { estado?: unknown; pitch_generado?: unknown },
  guardado: { id: string; estado?: unknown; pitch_generado?: unknown },
  bandId: string,
  aprobadoPor: string
): Promise<string | undefined> {
  const accion = accionTrasGuardar(existente, cambios);
  if (accion === "sellar") {
    const err = await dbSellarAprobacion(guardado.id, bandId, aprobadoPor, guardado.pitch_generado);
    if (err) console.warn("[Aprobación] No se pudo sellar la aprobación del lead %s: %s", guardado.id, err);
  } else if (accion === "degradar") {
    const err = await dbDegradarAAprobacionPendiente(guardado.id, bandId);
    if (!err) return "pendiente_aprobacion";
    console.warn("[Aprobación] No se pudo devolver a revisión el lead %s: %s", guardado.id, err);
  }
  return guardado.estado as string | undefined;
}
