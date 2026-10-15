import { useMemo } from "react";
import { extractUniqueChords } from "../utils/chordUtils";
import { contextoDeAcordes, type ContextoAcorde } from "../utils/vistaAcordes";
import type { Tonalidad } from "../utils/teoriaArmonica";

/** Acordes únicos de una hoja de cifrado y su papel armónico (tónica, función, grado). Lo usan el visor y el ensayo. */
export function useAcordesDeLaHoja(texto: string, tonalidad: Tonalidad | null, transpose = 0): { acordes: string[]; contexto: Map<string, ContextoAcorde> } {
  const acordes = useMemo(() => extractUniqueChords(texto), [texto]);
  const contexto = useMemo(() => contextoDeAcordes(texto, acordes, tonalidad, transpose), [texto, acordes, tonalidad, transpose]);
  return { acordes, contexto };
}
