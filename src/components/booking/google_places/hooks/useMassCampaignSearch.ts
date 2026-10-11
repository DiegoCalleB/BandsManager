import { errorMessage } from "../placesModel";
/**
 * Búsqueda masiva de recintos según la campaña activa.
 * Extraído de usePlaceSearch.ts (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction,useState } from "react";
import { BookingCampaign,Lead } from "../../../../types";
import { apiFetch } from "../../../../utils/api";
import { getStoredDiscarded,PlaceResult } from "../placesModel";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface MassCampaignSearchParams {
  setSearchError: Dispatch<SetStateAction<string>>;
  setImportSuccessMsg: Dispatch<SetStateAction<string>>;
  setExtractStatus: Dispatch<SetStateAction<string>>;
  setDiscardToast: Dispatch<SetStateAction<string>>;
  activeCampaign: BookingCampaign;
  selectedCity: string;
  aforoMin: string;
  aforoMax: string;
  massFilterTipos: string[];
  bandGenre: string;
  bandName: string;
  existingLeads: Lead[];
  setPlaces: Dispatch<SetStateAction<PlaceResult[]>>;
  setSearchSource: Dispatch<SetStateAction<string>>;
}

/**
 * Búsqueda masiva de recintos según la campaña activa.
 * @param params Estado y callbacks del contenedor ({@link MassCampaignSearchParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useMassCampaignSearch({ setSearchError, setImportSuccessMsg, setExtractStatus, setDiscardToast, activeCampaign, selectedCity, aforoMin, aforoMax, massFilterTipos, bandGenre, bandName, existingLeads, setPlaces, setSearchSource }: MassCampaignSearchParams) {
  const [isMassCampaignSearching, setIsMassCampaignSearching] = useState(false);

  // Búsqueda Masiva de Recintos, Locales y Discotecas según Campaña, Aforo, Localización y Estilo
  const handleMassCampaignSearch = async () => {
    setIsMassCampaignSearching(true);
    setSearchError("");
    setImportSuccessMsg("");
    setExtractStatus("");
    setDiscardToast("");

    try {
      const citiesToSearch =
        activeCampaign?.targetCities && activeCampaign.targetCities.length > 0
          ? activeCampaign.targetCities
          : selectedCity.trim()
            ? [selectedCity.trim()]
            : [
                "Madrid",
                "Barcelona",
                "Valencia",
                "Granada",
                "Sevilla",
                "Bilbao",
              ];

      const res = await apiFetch("/api/leads/campaign-mass-search", {
        method: "POST",
        body: JSON.stringify({
          targetCities: citiesToSearch,
          minCapacity: aforoMin
            ? Number(aforoMin)
            : activeCampaign?.minCapacity || undefined,
          maxCapacity: aforoMax
            ? Number(aforoMax)
            : activeCampaign?.maxCapacity || undefined,
          targetDates: activeCampaign?.targetDates,
          targetDatesText: activeCampaign?.targetDatesText,
          tipos: massFilterTipos,
          campaignName: activeCampaign?.name || "Campaña Activa",
          campaignId: activeCampaign?.id,
          limitPerCity: 12,
          bandGenre: bandGenre || undefined,
          bandName: bandName || undefined,
        }),
      });

      if (res.success && Array.isArray(res.results)) {
        const currentDiscarded = getStoredDiscarded();
        const isDiscarded = (p: PlaceResult) => {
          const normName = (p.nombre_sala || "").toLowerCase().trim();
          return currentDiscarded.some(
            (d) =>
              (p.place_id && d.place_id && d.place_id === p.place_id) ||
              (normName && d.nombre_sala.toLowerCase().trim() === normName),
          );
        };

        const mapped: PlaceResult[] = res.results
          .filter((p: PlaceResult) => !isDiscarded(p))
          .map((p: PlaceResult) => {
            const normName = (p.nombre_sala || "").toLowerCase().trim();
            const existingMatch = existingLeads.find((l) => {
              if (!l.nombre_sala) return false;
              const lNorm = l.nombre_sala.toLowerCase().trim();
              const sameName = lNorm === normName;
              const sameEmail =
                p.email_contacto &&
                l.email_contacto &&
                l.email_contacto.toLowerCase().trim() ===
                  p.email_contacto.toLowerCase().trim();
              return sameName || sameEmail;
            });
            const cap = p.aforo ? Number(p.aforo) : null;
            const minCap = aforoMin
              ? Number(aforoMin)
              : activeCampaign?.minCapacity || null;
            const maxCap = aforoMax
              ? Number(aforoMax)
              : activeCampaign?.maxCapacity || null;
            let capacityMatch = true;
            if (cap) {
              if (minCap && cap < minCap) capacityMatch = false;
              if (maxCap && cap > maxCap) capacityMatch = false;
            }
            return {
              ...p,
              selected: !existingMatch,
              alreadyInCrm: !!existingMatch,
              crmStatus: existingMatch ? existingMatch.estado : null,
              crmId: existingMatch ? existingMatch.id : null,
              crmNombre: existingMatch ? existingMatch.nombre_sala : null,
              capacityMatch,
            };
          });

        setPlaces(mapped);
        setSearchSource(
          `Scout Masivo de Campaña (${citiesToSearch.length} ciudades · Género: ${res.bandGenre || "Banda"} · Tipos: ${massFilterTipos.join(", ")})`,
        );
      } else {
        setSearchError(
          res.error ||
            "No se obtuvieron resultados para la prospección masiva.",
        );
      }
    } catch (err) {
      console.error("Error en prospección masiva de campaña:", err);
      setSearchError(
        errorMessage(err) ||
          "Error al ejecutar la búsqueda masiva de recintos de campaña.",
      );
    } finally {
      setIsMassCampaignSearching(false);
    }
  };

  return { handleMassCampaignSearch, isMassCampaignSearching };
}
