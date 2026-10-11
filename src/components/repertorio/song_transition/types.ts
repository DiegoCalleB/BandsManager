/**
 * Tipos compartidos de la comprobación de transición entre dos temas del repertorio.
 */
import type { Song, SetlistItem } from "../../../types";

/** Pista de la transición: A es el tema que acaba, B el que entra. */
export type Pista = "A" | "B";

/** Un valor por pista. */
export type PorPista<T> = Record<Pista, T>;

/** De dónde sale el audio de una pista: subido a mano, maqueta del tema o muestra de estudio. */
export type AudioSourceType = "custom" | "maqueta" | "sample";

/** Audio real o sintetizado a partir de tono y BPM. */
export type PlaybackMode = "real" | "synth";

/** Pestañas del panel de diagnóstico. */
export type DiagnosisTab = "pros_cons" | "metrics" | "stagecraft";

/** Props del modal con la guarda de apertura ya resuelta: los dos temas existen. */
export interface ResolvedSongTransitionProps {
  onClose: () => void;
  songA: Song;
  songB: Song;
  itemA?: SetlistItem | null;
  itemB?: SetlistItem | null;
  indexA: number;
  indexB: number;
  totalItemsCount: number;
  onNavigateTransition?: (newIndexA: number, newIndexB: number) => void;
  onInsertInterludio?: (afterItemId: string) => void;
  onSwapSongs?: (indexA: number, indexB: number) => void;
  onUpdateSong?: (song: Song) => void;
}
