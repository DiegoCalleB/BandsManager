// Reglas puras de la cola de letras: topes por plan y qué pasa tras cada intento. Sin base de datos,
// para poder probarlas sin red. El selector de canciones es el mismo de la transcripción masiva del
// cliente (`resumirTranscripcion`): solo audio sin cifrado, nunca se sobrescribe lo de la banda.

export type PlanLetras = "promo" | "promo_plus" | "ensayo" | "local" | "de_gira" | "cabeza_de_cartel";

/** Letras transcritas por banda y mes (cada una es una llamada de pago a Whisper). */
const LIMITE_LETRAS_MES: Record<PlanLetras, number> = {
  ensayo: 5,
  local: 20,
  promo: 25,
  promo_plus: 25,
  de_gira: 100,
  cabeza_de_cartel: 200,
};

export const limiteLetrasMes = (plan: string | undefined): number =>
  LIMITE_LETRAS_MES[plan as PlanLetras] ?? LIMITE_LETRAS_MES.ensayo;

export const MAX_INTENTOS = 3;

/** Espera antes de reintentar: Replicate se enfada con ráfagas, así que 2 min × intento. */
export const retrasoReintentoMs = (intentosHechos: number): number => 2 * 60_000 * Math.max(1, intentosHechos);

export type EstadoJob = "pendiente" | "en_curso" | "hecha" | "sin_letra" | "omitida" | "fallida";

/** Traduce el resultado HTTP de `ejecutarLetraSincronizada` al estado del trabajo. */
export function estadoTrasEjecucion(status: number, intentosHechos: number): { estado: EstadoJob; reintentar: boolean } {
  if (status === 200) return { estado: "hecha", reintentar: false };
  if (status === 422) return { estado: "sin_letra", reintentar: false }; // instrumental: no es un fallo
  if (status === 409 || status === 400 || status === 404) return { estado: "omitida", reintentar: false };
  return intentosHechos < MAX_INTENTOS
    ? { estado: "pendiente", reintentar: true }
    : { estado: "fallida", reintentar: false };
}

/** Cuántas letras caben aún: tope mensual menos las ya hechas este mes y las que están en cola. */
export const huecoDisponible = (limite: number, hechasEsteMes: number, enCola: number): number =>
  Math.max(0, limite - hechasEsteMes - enCola);

export const inicioDeMes = (ahora = new Date()): string =>
  new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();
