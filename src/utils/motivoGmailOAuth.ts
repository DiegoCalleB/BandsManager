/** Texto para el motivo con el que el servidor devuelve a la app tras un fallo de la conexión. */
export function mensajeDeMotivoGmail(motivo: string): string {
  if (motivo === "empieza_y_termina_en_el_mismo_dominio") {
    return "Google te ha devuelto a otro dominio y la conexión no ha podido cerrarse. Abre la app en el dominio que te indique el aviso al pulsar «Conectar» y vuelve a intentarlo.";
  }
  if (motivo === "servidor_sin_clave_de_cifrado") {
    return "Google ha aceptado la conexión, pero el servidor no tiene configurada la clave de cifrado de credenciales y no puede guardarla. Avisa a quien administra el servidor (variable CREDENTIALS_ENCRYPTION_KEY).";
  }
  return `No se pudo conectar Gmail (${motivo}). Inténtalo de nuevo.`;
}
