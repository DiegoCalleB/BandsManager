/** Texto para el motivo con el que el servidor devuelve a la app tras un fallo de la conexión. */
export function mensajeDeMotivoGmail(motivo: string): string {
  return motivo === "empieza_y_termina_en_el_mismo_dominio"
    ? "Google te ha devuelto a otro dominio y la conexión no ha podido cerrarse. Abre la app en el dominio que te indique el aviso al pulsar «Conectar» y vuelve a intentarlo."
    : `No se pudo conectar Gmail (${motivo}). Inténtalo de nuevo.`;
}
