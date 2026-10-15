/**
 * Progreso de «El Oído» (el análisis del audio: acordes, tono, tempo y letra). Las peticiones son
 * largas y de una sola respuesta, así que el servidor anota en qué etapa va y el cliente lo consulta
 * mientras espera. Memoria de proceso: vale porque la petición y la consulta caen en el mismo servidor
 * y el dato solo importa mientras dura el análisis.
 */

export type TareaOido = "acordes" | "letra";

export interface EtapaOido { id: string; titulo: string }

export interface ProgresoOido {
  tarea: TareaOido;
  etapas: EtapaOido[];
  /** Id de la etapa en curso; null al terminar. */
  actual: string | null;
  /** Frase de lo que está haciendo ahora mismo. */
  detalle: string;
  /** 0-100. */
  pct: number;
  estado: "en_curso" | "listo" | "error";
  error?: string;
  inicio: number;
  actualizado: number;
}

export const ETAPAS_ACORDES: EtapaOido[] = [
  { id: "audio", titulo: "Elegir y descargar el audio" },
  { id: "acordes", titulo: "Detectar los acordes" },
  { id: "pulso", titulo: "Medir tono y tempo" },
  { id: "revision", titulo: "Comprobar que es fiable" },
];

export const ETAPAS_LETRA: EtapaOido[] = [
  { id: "voz", titulo: "Buscar la pista de voz" },
  ...ETAPAS_ACORDES.map((e) => ({ ...e })),
  { id: "transcribir", titulo: "Escuchar y transcribir la letra" },
  { id: "unir", titulo: "Unir letra y acordes" },
];

const registro = new Map<string, ProgresoOido>();
const CADUCA_MS = 10 * 60_000;

function limpiarCaducados(ahora: number) {
  for (const [k, v] of registro) if (ahora - v.actualizado > CADUCA_MS) registro.delete(k);
}

export function iniciarProgreso(clave: string, tarea: TareaOido, detalle = "Preparando…"): void {
  const ahora = Date.now();
  limpiarCaducados(ahora);
  const etapas = tarea === "letra" ? ETAPAS_LETRA : ETAPAS_ACORDES;
  registro.set(clave, { tarea, etapas, actual: etapas[0].id, detalle, pct: 0, estado: "en_curso", inicio: ahora, actualizado: ahora });
}

/** Marca una etapa como la actual. Las etapas que se saltan (p. ej. acordes ya detectados) cuentan como hechas. */
export function avanzarProgreso(clave: string, id: string, detalle: string): void {
  const p = registro.get(clave);
  if (!p || p.estado !== "en_curso") return;
  const i = p.etapas.findIndex((e) => e.id === id);
  if (i < 0) return;
  p.actual = id;
  p.detalle = detalle;
  p.pct = Math.round((i / p.etapas.length) * 100);
  p.actualizado = Date.now();
}

export function terminarProgreso(clave: string, error?: string): void {
  const p = registro.get(clave);
  if (!p) return;
  p.actual = null;
  p.estado = error ? "error" : "listo";
  p.pct = error ? p.pct : 100;
  if (error) p.error = error;
  p.detalle = error ? error : "Listo";
  p.actualizado = Date.now();
}

export function leerProgreso(clave: string): ProgresoOido | null {
  return registro.get(clave) ?? null;
}

export function olvidarProgreso(clave: string): void {
  registro.delete(clave);
}
