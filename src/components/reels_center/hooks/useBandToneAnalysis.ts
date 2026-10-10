/**
 * Análisis del tono de expresión de la banda y reglas aprendidas.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { apiFetch } from "../../../utils/api";
import { ToneAnalysisData } from "../../bandCRM/BandToneModal";
import type { BandToneResponse } from "../reelsApiTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandToneAnalysisParams {
  instagramHandle: string;
  hasAnySocialLink: boolean;
  bandName: string;
}

/**
 * Análisis del tono de expresión de la banda y reglas aprendidas.
 * @param params Estado y callbacks del contenedor ({@link BandToneAnalysisParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandToneAnalysis({ instagramHandle, hasAnySocialLink, bandName }: BandToneAnalysisParams) {
  // Band Tone Analysis State
  const [isBandToneModalOpen, setIsBandToneModalOpen] =
    useState(false);

  const [bandToneData, setBandToneData] =
    useState<ToneAnalysisData | null>(null);

  const [isAnalyzingBandTone, setIsAnalyzingBandTone] =
    useState(false);

  // Si el backend confirmó que guardó el ADN de tono en Supabase (y no solo en esta pantalla).
  // El usuario preguntó explícitamente si esto se guardaba: antes no había forma de saberlo.
  const [toneAnalysisSaved, setToneAnalysisSaved] = useState(false);

  // Abrir el modal disparaba SIEMPRE un análisis nuevo con IA, aunque ya hubiera un ADN guardado
  // (de una edición manual o de un análisis anterior): cada vez que el usuario solo quería
  // consultarlo, se lo pisaba con un resultado nuevo de la IA y perdía sus correcciones a mano.
  // Ahora primero se mira qué hay ya guardado; solo se lanza la IA si no hay nada todavía.
  const handleOpenToneModal = async () => {
    setIsBandToneModalOpen(true);
    setIsAnalyzingBandTone(true);
    try {
      const res = await apiFetch("/api/bands/tone-dna");
      const json = res as BandToneResponse;
      if (json?.success && json.data) {
        setBandToneData(json.data);
        setToneAnalysisSaved(true);
        setIsAnalyzingBandTone(false);
        return;
      }
    } catch (err) {
      console.error("Error cargando el ADN de tono guardado:", err);
    }
    // Sin nada guardado todavía: se cae al análisis con IA de siempre.
    await handleAnalyzeBandTone();
  };

  // Refresca solo lo guardado en Supabase (incluidas las reglas de Self-Refining Tone DNA
  // recién generadas por"Entrenar ADN de tono ahora"), sin relanzar el rastreo de redes.
  const handleRefreshLearnedRules = async () => {
    try {
      const res = await apiFetch("/api/bands/tone-dna");
      const json = res as BandToneResponse;
      if (json?.success && json.data) {
        setBandToneData(json.data);
        setToneAnalysisSaved(true);
      }
    } catch (err) {
      console.error("Error refrescando el ADN de tono aprendido:", err);
    }
  };

  // Antes esto analizaba siempre @bakandeya en Instagram, sin importar qué banda estuviera
  // usando la app: el botón"Analizar tono de voz" de CUALQUIER banda escaneaba la cuenta de
  // Instagram del fundador en vez de la suya propia.
  const handleAnalyzeBandTone = async () => {
    // El backend ya rastrea Instagram, TikTok, YouTube y Facebook (lee el EPK real de la banda),
    // así que exigir Instagram en concreto bloqueaba a cualquier banda que solo tuviera, por
    // ejemplo, TikTok configurado.
    if (!instagramHandle && !hasAnySocialLink) {
      alert(
        "Configura al menos una red social de tu banda (Instagram, TikTok, YouTube o Facebook) en el EPK antes de analizar el tono de voz.",
      );
      return;
    }
    setIsAnalyzingBandTone(true);
    setIsBandToneModalOpen(true);
    setToneAnalysisSaved(false);
    try {
      const res = await apiFetch("/api/bands/analyze-tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_entidad: bandName || "Tu Banda",
          instagram: instagramHandle,
          estilo_musical: "",
          localizacion: "",
          tipo: "Banda / Artista Emisora",
          is_sender: true,
        }),
      });
      const json = res as BandToneResponse;
      if (json?.success && json.data) {
        setBandToneData(json.data);
        // El backend guarda el ADN en Supabase de forma automática cuando is_sender es true;
        // savedPermanently confirma que la escritura no falló, para poder decírselo al usuario.
        setToneAnalysisSaved(Boolean(json.savedPermanently));
      }
    } catch (err) {
      console.error("Error analyzing band tone:", err);
    } finally {
      setIsAnalyzingBandTone(false);
    }
  };

  return { handleOpenToneModal, isBandToneModalOpen, setIsBandToneModalOpen, bandToneData, isAnalyzingBandTone, toneAnalysisSaved, setBandToneData, setToneAnalysisSaved, handleAnalyzeBandTone, handleRefreshLearnedRules };
}
