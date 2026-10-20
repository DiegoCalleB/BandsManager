/**
 * Captura de métricas en segundo plano. La captura de ~35 bandas tarda minutos y una petición
 * HTTP tan larga se corta en el móvil ("No hay conexión con el servidor"): el POST arranca el
 * trabajo y responde al instante; el cliente consulta el progreso.
 */
export interface EstadoMetricas {
  estado: "inactivo" | "en_curso" | "listo" | "error";
  hechas: number;
  total: number;
  filas: number;
  motivos: Record<string, number>;
  periodo?: string;
  error?: string;
}

const vacio = (): EstadoMetricas => ({ estado: "inactivo", hechas: 0, total: 0, filas: 0, motivos: {} });
const trabajos = new Map<string, EstadoMetricas>();

export function estadoMetricas(bandId: string): EstadoMetricas {
  return trabajos.get(bandId) ?? vacio();
}

/** Arranca `correr` en segundo plano. Devuelve false si ya hay uno en curso para esa cuenta. */
export function iniciarMetricas(
  bandId: string,
  total: number,
  periodo: string,
  correr: (estado: EstadoMetricas) => Promise<void>,
): boolean {
  if (trabajos.get(bandId)?.estado === "en_curso") return false;
  const estado: EstadoMetricas = { ...vacio(), estado: "en_curso", total, periodo };
  trabajos.set(bandId, estado);
  void correr(estado)
    .then(() => {
      estado.estado = "listo";
    })
    .catch((err: unknown) => {
      console.error("[Metricas] trabajo en segundo plano falló:", err);
      estado.estado = "error";
      estado.error = "No se pudieron actualizar las métricas.";
    });
  return true;
}
