/**
 * Análisis del ADN de tono de una banda con IA.
 * Extraído de BandCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction } from "react";
import { BandContact } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { ToneAnalysisData } from "../BandToneModal";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandToneAnalysisParams {
  setSelectedToneBand: Dispatch<SetStateAction<BandContact>>;
  setIsToneModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsAnalyzingTone: Dispatch<SetStateAction<boolean>>;
  setToneData: Dispatch<SetStateAction<ToneAnalysisData>>;
  setBands: Dispatch<SetStateAction<BandContact[]>>;
}

/**
 * Análisis del ADN de tono de una banda con IA.
 * @param params Estado y callbacks del contenedor ({@link BandToneAnalysisParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandToneAnalysis({ setSelectedToneBand, setIsToneModalOpen, setIsAnalyzingTone, setToneData, setBands }: BandToneAnalysisParams) {
  const handleAnalyzeTone = async (band: BandContact) => {
    setSelectedToneBand(band);
    setIsToneModalOpen(true);
    setIsAnalyzingTone(true);
    setToneData(null);

    try {
      const resData = await apiFetch<{ success?: boolean; data?: ToneAnalysisData; error?: string }>("/api/bands/analyze-tone", {
        method: "POST",
        body: JSON.stringify({
          nombre_entidad: band.nombre_banda,
          instagram: band.instagram,
          estilo_musical: band.estilo_musical,
          localizacion: band.localizacion,
          tipo: "Banda",
          save_to_band_id: band.id,
        }),
      });

      if (resData?.success && resData?.data) {
        let finalData = resData.data;

        // Also load learned rules from tone-dna endpoint to ensure we have the latest reglas_por_categoria
        try {
          const toneDnaData = await apiFetch<{ data?: ToneAnalysisData }>("/api/bands/tone-dna");
          if (toneDnaData?.data?.reglas_por_categoria) {
            finalData = {
              ...finalData,
              reglas_por_categoria: toneDnaData.data.reglas_por_categoria,
            };
          }
        } catch (err) {
          console.warn("Could not load learned rules:", err);
        }

        setToneData(finalData);
        setBands((prev) =>
          prev.map((b) =>
            b.id === band.id
              ? {
                  ...b,
                  estilo_comunicacion:
                    finalData.tono_comunicacion || b.estilo_comunicacion,
                  dna_expresion: finalData as unknown as Record<string, unknown>,
                }
              : b,
          ),
        );
      } else {
        alert(resData.error || "No se pudo obtener el análisis de tono.");
      }
    } catch (err) {
      console.error("Error analizando tono:", err);
      alert("Error de conexión al analizar el tono de comunicación.");
    } finally {
      setIsAnalyzingTone(false);
    }
  };

  return { handleAnalyzeTone };
}
