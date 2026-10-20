/**
 * Ajusta cada corte elegido a un sitio donde se pueda cortar sin que suene a tijeretazo.
 *
 * La IA y las ventanas fijas dan un inicio y una duración "aproximada". Cortar justo ahí
 * suele pillar el final de una frase musical a medias. Aquí el INICIO se encaja en el golpe
 * y el FINAL se mueve unos segundos (la duración es flexible) hasta el respiro más cercano:
 * el valle de volumen, mejor aún si coincide con un cambio de plano.
 */
import { type PuntoEnergia } from "./audioEnergy.js";
import { encajarEnElGolpe, type VentanaViral } from "./viralSignals.js";
import { formatMMSS } from "./reelsCore.js";

export interface CorteAjustable {
  startSec: number;
  endSec: number;
  duration: number;
  range: string;
  reason: string;
}

export interface OpcionesAjuste {
  videoDuration: number;
  /** Duración deseada del clip, en segundos. */
  objetivo: number;
}

/** El final puede adelantarse o retrasarse esto (s) buscando un respiro. */
const ADELANTAR_MAX = 5;
const RETRASAR_MAX = 6;
/** Cuánto más bajo (dB) debe ser el nuevo final para que merezca la pena moverlo. */
const MEJORA_MINIMA_DB = 3;
/** Un cambio de plano a menos de esto del final cuenta como corte natural. */
const BONUS_CAMBIO_DB = 2;

function dbEn(curva: PuntoEnergia[], desde: number, hasta: number): number | null {
  let suma = 0;
  let n = 0;
  for (const p of curva) if (p.t >= desde && p.t < hasta) { suma += p.db; n++; }
  return n ? suma / n : null;
}

/** Mejor final para un corte que empieza en `start`, o el actual si nada mejora lo bastante. */
export function mejorFinal(start: number, end: number, curva: PuntoEnergia[], cambios: number[], o: OpcionesAjuste): number {
  const minDur = Math.max(8, Math.round(o.objetivo * 0.7));
  const maxDur = Math.min(90, Math.round(o.objetivo * 1.4));
  const desde = Math.max(start + minDur, end - ADELANTAR_MAX);
  const hasta = Math.min(start + maxDur, end + RETRASAR_MAX, o.videoDuration);
  const coste = (t: number) => {
    const db = dbEn(curva, t - 0.5, t + 0.5);
    if (db === null) return null;
    return cambios.some((c) => Math.abs(c - t) <= 0.6) ? db - BONUS_CAMBIO_DB : db;
  };
  const actual = coste(end);
  if (actual === null) return end;
  let mejor = end;
  let mejorCoste = actual;
  for (let t = desde; t <= hasta; t += 0.5) {
    const c = coste(t);
    if (c !== null && c < mejorCoste) { mejorCoste = c; mejor = t; }
  }
  return actual - mejorCoste >= MEJORA_MINIMA_DB ? mejor : end;
}

export function ajustarCortes<T extends CorteAjustable>(cortes: T[], curva: PuntoEnergia[], cambios: number[], o: OpcionesAjuste): T[] {
  if (!Array.isArray(curva) || curva.length < 2) return cortes;
  const ultimo = Math.max(...curva.map((p) => p.t));
  return cortes.map((c) => {
    const base = { start: c.startSec, end: c.endSec, energia: 0, arranque: 0, dinamismo: 0, score: 0, motivo: "" } as VentanaViral;
    const enGolpe = encajarEnElGolpe(base, curva, ultimo);
    const end = mejorFinal(enGolpe.start, enGolpe.end, curva, cambios, o);
    if (enGolpe.start === c.startSec && end === c.endSec) return c;
    const notas = [
      enGolpe.start !== c.startSec ? "inicio en el golpe" : "",
      end !== enGolpe.end ? "final en un respiro, no a mitad de frase" : ""
    ].filter(Boolean).join(" y ");
    return {
      ...c,
      startSec: enGolpe.start,
      endSec: end,
      duration: Number((end - enGolpe.start).toFixed(1)),
      range: `${formatMMSS(enGolpe.start)} - ${formatMMSS(end)}`,
      reason: `${c.reason}${c.reason ? " · " : ""}Ajustado: ${notas}.`
    };
  });
}
