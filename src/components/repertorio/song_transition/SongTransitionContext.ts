/**
 * Contexto de la comprobación de transición: reparte el controlador y las props a las vistas.
 */
import { createContext, useContext } from "react";
import type { useSongTransitionController } from "./hooks/useSongTransitionController";
import type { ResolvedSongTransitionProps } from "./types";

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type SongTransitionController = ReturnType<typeof useSongTransitionController>;

/** Valor del contexto: controlador + props del modal. */
export type SongTransitionContextValue = SongTransitionController & ResolvedSongTransitionProps;

export const SongTransitionContext = createContext<SongTransitionContextValue | null>(null);

/**
 * Lee el contexto de la comprobación de transición.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link SongTransitionProvider} (error de programación, falla rápido).
 */
export function useSongTransition(): SongTransitionContextValue {
  const value = useContext(SongTransitionContext);
  if (!value) throw new Error("useSongTransition debe usarse dentro de <SongTransitionProvider>");
  return value;
}
