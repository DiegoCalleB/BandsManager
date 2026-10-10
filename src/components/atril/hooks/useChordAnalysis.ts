/**
 * Análisis de acordes a partir del audio del tema.
 * Extraído de Atril.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Dispatch,SetStateAction,useEffect,useRef } from "react";
import { AnalisisAcordes,Song,SongSubstituteGuide } from "../../../types";
import { analizarAcordesDelAudio,resumenAnalisisAcordes } from "../../../utils/analisisAcordesCliente";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ChordAnalysisParams {
  setCifradoTexto: Dispatch<SetStateAction<string>>;
  song: Song;
  setGuiaSustituto: Dispatch<SetStateAction<SongSubstituteGuide>>;
  setIsAnalyzingChords: Dispatch<SetStateAction<boolean>>;
  setOidoOculto: Dispatch<SetStateAction<boolean>>;
  setAiSuccessMsg: Dispatch<SetStateAction<string>>;
  onUpdateSong: (updated: Song) => void;
  setShowAnalisisAcordes: Dispatch<SetStateAction<boolean>>;
  audioUrl: string;
  analisisAcordes: AnalisisAcordes;
  isAnalyzingChords: boolean;
}

/**
 * Análisis de acordes a partir del audio del tema.
 * @param params Estado y callbacks del contenedor ({@link ChordAnalysisParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useChordAnalysis({ setCifradoTexto, song, setGuiaSustituto, setIsAnalyzingChords, setOidoOculto, setAiSuccessMsg, onUpdateSong, setShowAnalisisAcordes, audioUrl, analisisAcordes, isAnalyzingChords }: ChordAnalysisParams) {
  // El estado de edición solo se inicializa desde `song` al montar (useState no vuelve a leer
  // sus argumentos). Cuando la subida de estructura o la generación con IA actualizan `song`
  // desde fuera del formulario de edición, había que cerrar y reabrir el modal para verlo:
  // este efecto sincroniza el estado local en cuanto cambian los valores reales de la canción.
  useEffect(() => {
    setCifradoTexto(song.cifradoTexto || "");
    setGuiaSustituto(song.guiaSustituto || {});
  }, [song.cifradoTexto, song.guiaSustituto]);

  // Detecta los acordes con tiempos directamente del audio (cálculo local, ~1 s, sin coste de IA).
  const handleAnalyzeChordsFromAudio = async (sobrescribir = false) => {
    try {
      setIsAnalyzingChords(true);
      setOidoOculto(false);
      setAiSuccessMsg(null);
      const analisis = await analizarAcordesDelAudio(song.id, sobrescribir);
      onUpdateSong({ ...song, analisisAcordes: analisis });
      setShowAnalisisAcordes(true);
      setAiSuccessMsg(resumenAnalisisAcordes(analisis));
    } catch (err) {
      setAiSuccessMsg(`⚠️ ${(err instanceof Error && err.message) || "No se pudieron analizar los acordes del audio"}`);
    } finally {
      setIsAnalyzingChords(false);
      setTimeout(() => setAiSuccessMsg(null), 7000);
    }
  };

  // El análisis de acordes del audio va activo por defecto: si el tema tiene audio y aún no está analizado, se analiza solo (una vez por canción).
  const jamifyAutoIntentado = useRef<string | null>(null);
  useEffect(() => {
    if (!audioUrl || analisisAcordes || isAnalyzingChords || jamifyAutoIntentado.current === song.id) return;
    jamifyAutoIntentado.current = song.id;
    handleAnalyzeChordsFromAudio();
     
  }, [audioUrl, analisisAcordes, song.id]);

  return { handleAnalyzeChordsFromAudio };
}
