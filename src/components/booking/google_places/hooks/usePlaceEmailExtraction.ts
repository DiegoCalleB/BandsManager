import type { PlaceResult } from "../placesModel";
import { errorMessage } from "../placesModel";
/**
 * Extracción de emails de contacto (individual y por lotes) de los lugares encontrados.
 * Extraído de GooglePlacesExplorerModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction,useState } from "react";
import { apiFetch } from "../../../../utils/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PlaceEmailExtractionParams {
  places: PlaceResult[];
  setPlaces: Dispatch<SetStateAction<PlaceResult[]>>;
  setExtractStatus: Dispatch<SetStateAction<string>>;
}

/**
 * Extracción de emails de contacto (individual y por lotes) de los lugares encontrados.
 * @param params Estado y callbacks del contenedor ({@link PlaceEmailExtractionParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePlaceEmailExtraction({ places, setPlaces, setExtractStatus }: PlaceEmailExtractionParams) {
  const [isExtractingBatch, setIsExtractingBatch] = useState(false);

  // Single venue email extraction (Completador / Enriquecedor de Contactos)
  const handleExtractSingleEmail = async (placeId: string) => {
    const target = places.find((p) => p.place_id === placeId);
    if (!target) return;

    setPlaces((prev) =>
      prev.map((p) =>
        p.place_id === placeId ? { ...p, extractingEmail: true } : p,
      ),
    );

    try {
      const res = await apiFetch("/api/leads/extract-emails", {
        method: "POST",
        body: JSON.stringify({
          places: [
            {
              place_id: target.place_id,
              nombre_sala: target.nombre_sala,
              ciudad: target.ciudad,
              website: target.website,
            },
          ],
        }),
      });

      if (
        res.success &&
        Array.isArray(res.extracted) &&
        res.extracted.length > 0
      ) {
        const item = res.extracted[0];
        setPlaces((prev) =>
          prev.map((p) =>
            p.place_id === placeId
              ? {
                  ...p,
                  email_contacto: item.email_contacto || p.email_contacto || "",
                  instagram: item.instagram || p.instagram || "",
                  contacto_nombre:
                    item.contacto_nombre || p.contacto_nombre || "",
                  extractingEmail: false,
                }
              : p,
          ),
        );
      }
    } catch (err) {
      console.error("Error completando datos de contacto:", err);
      setPlaces((prev) =>
        prev.map((p) =>
          p.place_id === placeId ? { ...p, extractingEmail: false } : p,
        ),
      );
    }
  };

  // Batch email extraction for selected places lacking email (Agente Enriquecedor de Contactos)
  const handleExtractBatchEmails = async () => {
    const selectedPlaces = places.filter((p) => p.selected);
    if (selectedPlaces.length === 0) return;

    setIsExtractingBatch(true);
    setExtractStatus(
      `Iniciando Agente Enriquecedor para ${selectedPlaces.length} contactos...`,
    );

    const CHUNK_SIZE = 3;
    let totalExtractedCount = 0;

    try {
      for (let i = 0; i < selectedPlaces.length; i += CHUNK_SIZE) {
        const chunk = selectedPlaces.slice(i, i + CHUNK_SIZE);
        const currentProgress = Math.min(i + CHUNK_SIZE, selectedPlaces.length);
        setExtractStatus(
          `⚡ Investigando webs oficiales (${currentProgress}/${selectedPlaces.length}): ${chunk.map((c) => c.nombre_sala).join(", ")}...`,
        );

        try {
          const res = await apiFetch("/api/leads/extract-emails", {
            method: "POST",
            body: JSON.stringify({
              places: chunk.map((p) => ({
                place_id: p.place_id,
                nombre_sala: p.nombre_sala,
                ciudad: p.ciudad,
                website: p.website,
              })),
            }),
          });

          if (res.success && Array.isArray(res.extracted)) {
            const emailMap = new Map<string, Partial<PlaceResult> & { id?: string }>();
            res.extracted.forEach((item: Partial<PlaceResult> & { id?: string }) => {
              if (item.id) emailMap.set(item.id, item);
              if (item.nombre_sala)
                emailMap.set(item.nombre_sala.toLowerCase().trim(), item);
            });

            let newFoundInChunk = 0;
            setPlaces((prev) =>
              prev.map((p) => {
                const match =
                  emailMap.get(p.place_id) ||
                  emailMap.get(p.nombre_sala.toLowerCase().trim());
                if (
                  match &&
                  match.email_contacto &&
                  match.email_contacto.trim() !== ""
                ) {
                  newFoundInChunk++;
                  return {
                    ...p,
                    email_contacto: match.email_contacto,
                    instagram: match.instagram || p.instagram,
                    contacto_nombre: match.contacto_nombre || p.contacto_nombre,
                  };
                }
                return p;
              }),
            );
            totalExtractedCount += res.extractedCount || newFoundInChunk;
          }
        } catch (chunkErr) {
          console.warn(
            `[Batch Enriquecedor] Advertencia en sub-lote ${i / CHUNK_SIZE + 1}:`,
            chunkErr,
          );
        }
      }

      setExtractStatus(
        `✨ Proceso completado: Extraídos ${totalExtractedCount} correos oficiales verificados.`,
      );
      setTimeout(() => {
        setExtractStatus("");
      }, 7000);
    } catch (err) {
      console.error("Error completando lote de contactos:", err);
      setExtractStatus(
        `⚠️ Enriquecimiento completado parcialmente: ${errorMessage(err) || "Verifica la conexión"}`,
      );
    } finally {
      setIsExtractingBatch(false);
    }
  };

  const emailsFoundCount = places.filter(
    (p) => p.email_contacto && p.email_contacto.trim() !== "",
  ).length;

  return { emailsFoundCount, handleExtractBatchEmails, isExtractingBatch, handleExtractSingleEmail };
}
