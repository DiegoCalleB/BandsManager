import { useMemo } from "react";
import { Setlist, Song } from "../types";
import {
  analyzeSetlistEnergy,
  calcularCurvaEnergiaIdeal,
  SetlistEnergyAnalysis,
} from "../utils/energyPacingUtils";
import { parseTonalidad, evaluarTransicionArmonica } from "../utils/harmonicAnalysis";
import { evaluarCalidadUnion, EvaluacionUnion } from "../utils/setlistCompatibility";
import { EnergyChartPoint } from "../components/repertorio/EnergyChart";

export interface EnergyZone {
  min: number;
  max: number;
  color: string;
  y1: number;
  y2: number;
}

export interface UseSetlistEnergyAnalysisResult {
  energyAnalysis: SetlistEnergyAnalysis;
  chartData: EnergyChartPoint[];
  yDomain: [number, number];
  ZONAS_ENERGIA: EnergyZone[];
}

/**
 * Hook para calcular la curva de energía y métricas armónicas del setlist.
 * Memoizado estrictamente por activeSetlist y songs para evitar re-render cascades
 * y remontajes innecesarios del gráfico interactivo de Recharts.
 */
export function useSetlistEnergyAnalysis(
  activeSetlist: Setlist | null,
  songs: Song[],
): UseSetlistEnergyAnalysisResult {
  return useMemo(() => {
    const analysis = analyzeSetlistEnergy(activeSetlist?.items || [], songs);
    const idealCurve = calcularCurvaEnergiaIdeal(analysis.points);

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

    const data: EnergyChartPoint[] = analysis.points.map((pt, idx) => {
      const isSpeechEvent = !pt.isSong;
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

    const zonas: EnergyZone[] = [
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
}
