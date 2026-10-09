import { getErrorMessage } from "../../../../utils/errorMessage";
/**
 * Acciones de inteligencia Scout: Jina, fechas de sala, Instagram y fechas de festival.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-explicit-any
*/
import { Dispatch,SetStateAction } from "react";
import { Lead } from "../../../../types";
import { apiFetch } from "../../../../utils/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface VenueScoutActionsParams {
  selectedLead: Lead;
  editedLeadInfo: Partial<Lead>;
  setScoutActionFeedback: Dispatch<SetStateAction<string>>;
  setIsScanningJina: Dispatch<SetStateAction<boolean>>;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  setEditedLeadInfo: Dispatch<SetStateAction<Partial<Lead>>>;
  setIsDetectingDates: Dispatch<SetStateAction<boolean>>;
  setIsEnrichingInstagram: Dispatch<SetStateAction<boolean>>;
}

/**
 * Acciones de inteligencia Scout: Jina, fechas de sala, Instagram y fechas de festival.
 * @param params Estado y callbacks del contenedor ({@link VenueScoutActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useVenueScoutActions({ selectedLead, editedLeadInfo, setScoutActionFeedback, setIsScanningJina, onUpdateLead, setEditedLeadInfo, setIsDetectingDates, setIsEnrichingInstagram }: VenueScoutActionsParams) {
  const handleScanWithJina = async () => {
    if (!selectedLead) return;
    const targetUrl = selectedLead.website || editedLeadInfo.website;
    if (!targetUrl) {
      setScoutActionFeedback(
        "Añade un sitio web o enlace a la sala para escanear con Jina Reader",
      );
      setTimeout(() => setScoutActionFeedback(null), 4000);
      return;
    }
    try {
      setIsScanningJina(true);
      setScoutActionFeedback(
        "Escaneando sitio web con Jina Reader (r.jina.ai)...",
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-jina`,
        {
          method: "POST",
          body: JSON.stringify({ website: targetUrl }),
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Jina Reader: Extraído móvil, fijo, email y rider correctamente.",
        );
      } else {
        setScoutActionFeedback(
          `Aviso: ${res?.error || "No se encontraron datos adicionales."}`,
        );
      }
    } catch (err: unknown) {
      setScoutActionFeedback(
        `Error Jina Reader: ${getErrorMessage(err, "Error de conexión")}`,
      );
    } finally {
      setIsScanningJina(false);
      setTimeout(() => setScoutActionFeedback(null), 5000);
    }
  };

  const handleDetectVenueDates = async () => {
    if (!selectedLead) return;
    try {
      setIsDetectingDates(true);
      setScoutActionFeedback(
        "Consultando y contrastando radar en Wegow y Bandsintown...",
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/detect-dates`,
        {
          method: "POST",
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        const numLibres = res.radar?.fechas_libres_detectadas?.length || 0;
        const numOcupadas = res.radar?.fechas_ocupadas?.length || 0;
        const contrastado = res.radar?.contrastado_multi_fuente
          ? "✓ Multi-fuente contrastada (Wegow + Bandsintown)"
          : "Radar consultado";
        if (res.radar?.datos_fechas_encontrados === false) {
          setScoutActionFeedback(
            "(no se han encontrado datos de fechas de esta sala)",
          );
        } else if (res.radar?.is_campaign_active) {
          setScoutActionFeedback(
            `${contrastado}: ${res.radar?.mensaje_disponibilidad || `${numLibres} fechas libres detectadas`}`,
          );
        } else {
          setScoutActionFeedback(
            `${contrastado}: ${numOcupadas} eventos detectados. ${numLibres} fechas libres disponibles.`,
          );
        }
      } else {
        setScoutActionFeedback(
          `Aviso: ${res?.error || "No se pudieron calcular las fechas."}`,
        );
      }
    } catch (err: unknown) {
      setScoutActionFeedback(
        `Error Radar: ${getErrorMessage(err, "Error de conexión")}`,
      );
    } finally {
      setIsDetectingDates(false);
      setTimeout(() => setScoutActionFeedback(null), 5000);
    }
  };

  const handleEnrichInstagram = async () => {
    if (!selectedLead) return;
    const igHandle = selectedLead.instagram || editedLeadInfo.instagram;
    if (!igHandle) {
      setScoutActionFeedback(
        "Añade un perfil de Instagram a la sala para analizarlo",
      );
      setTimeout(() => setScoutActionFeedback(null), 4000);
      return;
    }
    try {
      setIsEnrichingInstagram(true);
      setScoutActionFeedback("Consultando perfil comercial de Instagram...");
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-instagram`,
        {
          method: "POST",
          body: JSON.stringify({ instagram: igHandle }),
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Instagram: Datos comerciales y WhatsApp sincronizados.",
        );
      } else {
        const info =
          res?.data?.apify_free_tier_info ||
          res?.error ||
          "No se extrajeron datos adicionales";
        setScoutActionFeedback(`Aviso: ${info}`);
      }
    } catch (err: unknown) {
      setScoutActionFeedback(
        `Error Instagram: ${getErrorMessage(err, "Error de conexión")}`,
      );
    } finally {
      setIsEnrichingInstagram(false);
      setTimeout(() => setScoutActionFeedback(null), 6000);
    }
  };

  return { handleScanWithJina, handleDetectVenueDates, handleEnrichInstagram };
}
