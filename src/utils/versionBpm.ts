/**
 * El BPM de cada canción se midió hasta el 3-nov-2026 (mañana) con el detector por ataques, que fallaba ~4 de
 * cada 10 (duplicaba los tempos lentos, partía los rápidos, ±2 % en el resto). Desde entonces sale de los
 * pulsos de la red (server/utils/medirBpm.ts). Lo medido antes de esta fecha se ofrece para remedir en
 * «Analizar dinámica»; sin esto, una canción ya analizada no se volvía a tocar nunca.
 */
export const BPM_CON_RED_DESDE = '2026-11-03T10:15:00Z';

/** ¿Hay que (re)medir el BPM de esta canción? Sin medir, o medido antes del detector nuevo. */
export function bpmPorRemedir(bpmDetectadoEn?: string | null): boolean {
  if (!bpmDetectadoEn) return true;
  const cuando = Date.parse(bpmDetectadoEn);
  return Number.isNaN(cuando) || cuando < Date.parse(BPM_CON_RED_DESDE);
}
