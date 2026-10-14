// Qué leads puede reescribir el Agente Redactor por lotes (POST /api/trigger-agent).
//
// Solo los que todavía no tienen conversación: un lead `nuevo` o uno cuyo borrador sigue
// esperando aprobación. Antes `all`/`regenerate` (o un id suelto) reescribía también el pitch de
// leads en `contactado` o `negociando` y los devolvía a `pendiente_aprobacion`, perdiendo su
// estado en el embudo.

export const ESTADOS_REDACTABLES = ["nuevo", "pendiente_aprobacion"] as const;

export interface ParametrosRedactor {
  id?: string;
  lead_id?: string;
  all?: unknown;
  regenerate?: unknown;
}

/** Estados que entran en el lote: por defecto solo `nuevo`; con id, all o regenerate, todos los redactables. */
export function estadosARedactar(params: ParametrosRedactor | undefined): string[] {
  const ampliado = Boolean(params?.id || params?.lead_id || params?.all || params?.regenerate);
  return ampliado ? [...ESTADOS_REDACTABLES] : ["nuevo"];
}
