// Constancia de la aprobación humana de un correo (AGENTS.md §3).
//
// Al aprobar, el servidor guarda quién, cuándo y una huella (sha256) del texto exacto aprobado. El
// Enviador solo despacha si la huella coincide con el texto que va a salir: si el texto cambió
// después de aprobarlo, o el lead llegó a un estado de envío por otro camino (importación, alta
// directa), NO sale hasta que una persona lo apruebe de nuevo.

import { createHash } from "node:crypto";

export const ESTADOS_DE_APROBACION = ["aprobado", "aprobado_propuesta", "aprobado_respuesta"] as const;

export function esEstadoDeAprobacion(estado: unknown): boolean {
  return (ESTADOS_DE_APROBACION as readonly string[]).includes(String(estado));
}

/** Huella del texto aprobado (sin espacios al principio y al final, que no cambian lo que se lee). */
export function hashTextoAprobado(texto: unknown): string {
  return createHash("sha256").update(String(texto ?? "").trim(), "utf8").digest("hex");
}

export interface LeadConAprobacion {
  pitch_generado?: unknown;
  pitch_aprobado_hash?: unknown;
}

/** ¿Puede el Enviador despachar el texto de este lead? Si no, `motivo` explica qué hacer. */
export function aprobacionVigente(lead: LeadConAprobacion): { ok: boolean; motivo?: string } {
  const hash = String(lead.pitch_aprobado_hash || "");
  if (!hash) {
    return { ok: false, motivo: "No consta quién aprobó este correo. Apruébalo de nuevo desde la sala antes de enviarlo." };
  }
  if (hash !== hashTextoAprobado(lead.pitch_generado)) {
    return { ok: false, motivo: "El texto cambió después de aprobarlo. Revísalo y apruébalo de nuevo antes de enviarlo." };
  }
  return { ok: true };
}

/**
 * Qué hay que hacer con la constancia de aprobación tras un PUT del lead:
 *  - 'sellar': el lead PASA a un estado de aprobación en esta petición (una persona lo acaba de
 *    aprobar). Un lead que ya estaba aprobado no se vuelve a sellar: el cliente reenvía el lead
 *    entero al editar cualquier campo y eso no es aprobar.
 *  - 'degradar': se editó el texto de un lead ya aprobado sin pasarlo por la aprobación: vuelve a
 *    `pendiente_aprobacion`, nunca sale con un texto que nadie ha visto aprobado.
 *  - 'nada': no afecta a la aprobación.
 */
export function accionTrasGuardar(
  existente: { estado?: unknown; pitch_generado?: unknown } | null | undefined,
  cambios: { estado?: unknown; pitch_generado?: unknown }
): "sellar" | "degradar" | "nada" {
  const yaAprobado = esEstadoDeAprobacion(existente?.estado);
  if (esEstadoDeAprobacion(cambios.estado) && !yaAprobado) return "sellar";
  const editaTexto =
    typeof cambios.pitch_generado === "string" &&
    hashTextoAprobado(cambios.pitch_generado) !== hashTextoAprobado(existente?.pitch_generado);
  const sigueAprobado = cambios.estado === undefined || esEstadoDeAprobacion(cambios.estado);
  return yaAprobado && editaTexto && sigueAprobado ? "degradar" : "nada";
}
