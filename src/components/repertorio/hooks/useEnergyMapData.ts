/**
 * Datos memoizados del Mapa de Energía del setlist activo: curva, dominio, zonas y análisis de choques.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import { useMemo } from "react";
import { Setlist,Song } from "../../../types";
import { analyzeSetlistEnergy,calcularCurvaEnergiaIdeal } from "../../../utils/energyPacingUtils";
import { evaluarTransicionArmonica,parseTonalidad } from "../../../utils/harmonicAnalysis";
import { EvaluacionUnion,evaluarCalidadUnion } from "../../../utils/setlistCompatibility";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface EnergyMapDataParams {
  activeSetlist: Setlist;
  songs: Song[];
}

/**
 * Datos memoizados del Mapa de Energía del setlist activo: curva, dominio, zonas y análisis de choques.
 * @param params Estado y callbacks del contenedor ({@link EnergyMapDataParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useEnergyMapData({ activeSetlist, songs }: EnergyMapDataParams) {
  // Datos del Mapa de Energía, memoizados por setlist/repertorio real — si se recalculan en
  // cada render (p.ej. cada vez que cambia highlightedSongIds al hacer hover), Recharts ve un
  // array `data` con nueva referencia y remonta la animación entera desde cero (su `animationId`
  // depende de identidad de referencia, no de contenido), cancelando cualquier highlighting a
  // medio camino. Al depender solo de activeSetlist/songs, el gráfico no se re-anima por
  // interacciones de UI que no cambian los datos reales.
  const { energyAnalysis, chartData, yDomain, ZONAS_ENERGIA } = useMemo(() => {
    const analysis = analyzeSetlistEnergy(activeSetlist?.items || [], songs);
    // Curva de energía"ideal" de referencia (arco de pacing clásico, escalado al rango real de
    // este repertorio) — se pinta como segunda línea en el gráfico para ver de un vistazo dónde se
    // aleja más la curva real, sin depender de leer el texto del análisis.
    const idealCurve = calcularCurvaEnergiaIdeal(analysis.points);
    // Posición horizontal de cada punto en el gráfico, DISTINTA de `idx` (que sigue siendo la
    // posición real en el setlist, usada para arrastrar/reordenar). Las canciones ocupan
    // posiciones enteras consecutivas (0, 1, 2...) sin contar los bloques que haya entre medias;
    // los bloques se intercalan entre la canción anterior y la siguiente sin consumir su propio
    // hueco — así un bloque nunca separa visualmente dos canciones más de lo normal.
    const xPositions: number[] = new Array(analysis.points.length);
    {
      let songCounter = 0;
      let pendingBlocks: number[] = [];
      const flushBlocks = (leftPos: number, rightPos: number) => {
        pendingBlocks.forEach((ptIdx, i) => {
          xPositions[ptIdx] =
            leftPos +
            ((i + 1) / (pendingBlocks.length + 1)) * (rightPos - leftPos);
        });
        pendingBlocks = [];
      };
      analysis.points.forEach((pt, i) => {
        if (pt.isSong) {
          if (pendingBlocks.length > 0)
            flushBlocks(songCounter - 1, songCounter);
          xPositions[i] = songCounter;
          songCounter += 1;
        } else {
          pendingBlocks.push(i);
        }
      });
      if (pendingBlocks.length > 0) flushBlocks(songCounter - 1, songCounter);
    }
    const data = analysis.points.map((pt, idx) => {
      // Chapa/presentación/interludio/pausa/bis/etc. — cualquier evento que no sea canción — no
      // representa energía real del show: el"bis" en concreto es solo la marca de"aquí empieza",
      // no una canción en sí (las canciones reales del bis puntúan por su cuenta justo después).
      // Contarlos como un punto más de la curva (con su score de relleno) dibujaba un"bajón" o un
      // pico falso ahí. Se marcan en el gráfico con su propia línea vertical (ver EnergyChart) en
      // vez de ensuciar la curva con un valor inventado.
      const isSpeechEvent = !pt.isSong;
      // Choque de tonalidad con la SIGUIENTE canción real del setlist (círculo de quintas) — se
      // salta cualquier evento de"speech" de por medio para comparar canciones de verdad, no una
      // canción contra una chapa/interludio que no tiene tonalidad.
      let harmonyClash = false;
      if (!isSpeechEvent && pt.song?.tonalidad) {
        const siguienteCancion = analysis.points
          .slice(idx + 1)
          .find((p) => p.isSong);
        const keyA = parseTonalidad(pt.song.tonalidad);
        const keyB = siguienteCancion?.song?.tonalidad
          ? parseTonalidad(siguienteCancion.song.tonalidad)
          : null;
        if (keyA && keyB)
          harmonyClash = evaluarTransicionArmonica(keyA, keyB) === "choque";
      }
      let transitionToNext: EvaluacionUnion | null = null;
      let transitionFromPrev: EvaluacionUnion | null = null;
      if (!isSpeechEvent && pt.song) {
        const siguienteCancion = analysis.points
          .slice(idx + 1)
          .find((p) => p.isSong);
        if (siguienteCancion?.song) {
          transitionToNext = evaluarCalidadUnion(
            pt.song,
            siguienteCancion.song,
          );
        }
        const anteriorCancion = analysis.points
          .slice(0, idx)
          .reverse()
          .find((p) => p.isSong);
        if (anteriorCancion?.song) {
          transitionFromPrev = evaluarCalidadUnion(
            anteriorCancion.song,
            pt.song,
          );
        }
      }

      return {
        idx,
        xPos: xPositions[idx],
        id: pt.item.id,
        songId: isSpeechEvent ? undefined : pt.song?.id,
        name: pt.title,
        score: isSpeechEvent ? null : pt.score,
        idealScore: isSpeechEvent ? null : idealCurve[idx],
        range: [
          Math.max(1, pt.score - pt.variance),
          Math.min(20, pt.score + pt.variance),
        ] as [number, number],
        color: pt.info.hexColor,
        icon: pt.info.icon,
        label: pt.info.label,
        variance: pt.variance,
        isSong: pt.isSong,
        isSpeechEvent,
        bpm: isSpeechEvent
          ? null
          : typeof pt.song?.bpm === "number" && pt.song.bpm > 0
            ? pt.song.bpm
            : null,
        harmonyClash,
        tonalidad: isSpeechEvent ? null : pt.song?.tonalidad?.trim() || null,
        transitionToNext,
        transitionFromPrev,
      };
    });

    // Dominio Y dinámico: se escala al propio setlist (no siempre 1-20) para que las
    // diferencias de energía entre temas se noten de verdad, no se aplasten en un rango fijo.
    // Los eventos de"speech" quedan fuera del cálculo — su rango de relleno (4±0) no debe estrechar
    // ni desplazar la escala pensada para las canciones reales.
    let domain: [number, number] = [1, 20];
    const dataParaDominio = data.filter((d) => !d.isSpeechEvent);
    if (dataParaDominio.length > 0) {
      const allValues = dataParaDominio.flatMap((d) => d.range);
      const minVal = Math.min(...allValues);
      const maxVal = Math.max(...allValues);
      let lo = Math.max(1, minVal - 2);
      let hi = Math.min(20, maxVal + 2);
      if (hi - lo < 6) {
        const mid = (hi + lo) / 2;
        lo = Math.max(1, mid - 3);
        hi = Math.min(20, mid + 3);
      }
      domain = [lo, hi];
    }

    // Bandas de fondo por categoría de energía (mismos umbrales que getEnergyInfo) — es lo
    // que convierte la curva en un"mapa" de verdad: se ve a simple vista en qué zona cae
    // cada canción, no solo por el color del punto sino por el propio fondo del chart.
    const zonas = [
      { min: 1, max: 8, color: "#0284c7" },
      { min: 9, max: 14, color: "#059669" },
      { min: 15, max: 18, color: "#a16207" },
      { min: 19, max: 20, color: "#a21caf" },
    ]
      .map((z) => ({
        ...z,
        y1: Math.max(z.min, domain[0]),
        y2: Math.min(z.max, domain[1]),
      }))
      .filter((z) => z.y1 < z.y2);

    return {
      energyAnalysis: analysis,
      chartData: data,
      yDomain: domain,
      ZONAS_ENERGIA: zonas,
    };
  }, [activeSetlist, songs]);

  return { energyAnalysis, chartData, yDomain, ZONAS_ENERGIA };
}
