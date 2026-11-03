/**
 * Acordes en segundos, compases «afinados» después.
 *
 * Medido con un tema de 6 min: decodificar <1 s, detectar acordes 2,5 s y la red neuronal de pulso
 * (Beat This!) 20 s. La red solo aporta la rejilla de compases; los acordes no dependen de ella. Así que
 * se responde ya con el pulso clásico y la red corre DESPUÉS, de una en una, y sustituye el análisis solo
 * si nadie lo ha tocado entretanto (ni una corrección a mano ni un reanálisis).
 */
import type { Song } from "../../src/types.js";
import { getSupabase } from "../db/core.js";
import { mapSongRecord, dbGuardarAnalisisAcordes } from "../db/repertoire.js";
import { analizarAcordesDeCancion } from "./acordesCancion.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

/** Una sola canción, sin cargar el repertorio entero (con sus análisis, un par de MB por banda). */
export async function cancionPorId(id: string, bandId: string): Promise<Song | null> {
  const limpio = (bandId || "").trim();
  const sinPrefijo = limpio.replace(/^(band|reg)-/, "");
  const candidatos = Array.from(new Set([limpio, sinPrefijo, `band-${sinPrefijo}`, `reg-${sinPrefijo}`])).filter(Boolean);
  const { data, error } = await getSupabase().from("songs").select("*").eq("id", id).in("band_id", candidatos).maybeSingle();
  if (error) throw new Error(`Supabase Error (canción): ${error.message}`);
  return data ? mapSongRecord(data) : null;
}

/** ¿Sigue siendo ESTE el análisis que se guardó y sin correcciones a mano? Solo entonces se puede sustituir. */
function sinTocar(song: Song | null, analizadoEn: string): boolean {
  const a = song?.analisisAcordes;
  return !!a && a.analizadoEn === analizadoEn && !a.editadoEn && !a.segmentos.some((s) => s.editado);
}

let cola: Promise<unknown> = Promise.resolve();
const pendientes = new Set<string>();

/** Vuelve a analizar con la red de pulso y guarda el resultado si el análisis rápido sigue intacto. No espera, no lanza. */
export function afinarCompasesEnSegundoPlano(id: string, bandId: string, analizadoEn: string): void {
  if (process.env.BEAT_THIS === "off") return;
  const clave = `${bandId}:${id}`;
  if (pendientes.has(clave)) return;
  pendientes.add(clave);
  // De una en una: la red usa todos los núcleos; una subida masiva no debe tumbar el servidor.
  cola = cola.then(async () => {
    try {
      const inicio = Date.now();
      const song = await cancionPorId(id, bandId);
      if (!song || !sinTocar(song, analizadoEn)) return;
      const r = await analizarAcordesDeCancion(song);
      if (r.ok === false || r.analisis.pulso?.fuente !== "red") return;
      if (!sinTocar(await cancionPorId(id, bandId), analizadoEn)) return; // alguien lo tocó mientras la red trabajaba
      await dbGuardarAnalisisAcordes(id, bandId, r.analisis);
      console.log(`[acordes] compases afinados con la red «${song.titulo}» en ${((Date.now() - inicio) / 1000).toFixed(0)}s`);
    } catch (errCapturado) {
      console.warn("[acordes] no se pudieron afinar los compases:", comoErrorCapturado(errCapturado).message);
    } finally {
      pendientes.delete(clave);
    }
  });
}
