import type { PlaceResult } from "../placesModel";
import { CATEGORIES,errorMessage,getStoredDiscarded } from "../placesModel";
import { useAlternativePlaceSources } from "./useAlternativePlaceSources";
import { useMassCampaignSearch } from "./useMassCampaignSearch";
/**
 * Búsquedas de lugares: manual, campaña masiva, bandas similares, multifuente y cultural.
 * Extraído de GooglePlacesExplorerModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction,useState } from "react";
import { BookingCampaign,Lead,LeadType } from "../../../../types";
import { apiFetch } from "../../../../utils/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PlaceSearchParams {
  selectedCity: string;
  selectedType: LeadType;
  searchQuery: string;
  setSearchError: Dispatch<SetStateAction<string>>;
  setImportSuccessMsg: Dispatch<SetStateAction<string>>;
  setExtractStatus: Dispatch<SetStateAction<string>>;
  setDiscardToast: Dispatch<SetStateAction<string>>;
  searchLimit: number;
  aforoMin: string;
  aforoMax: string;
  existingLeads: Lead[];
  activeCampaign: BookingCampaign;
  setPlaces: Dispatch<SetStateAction<PlaceResult[]>>;
  setSearchSource: Dispatch<SetStateAction<string>>;
  massFilterTipos: string[];
  bandGenre: string;
  bandName: string;
  similarBands: string[];
  setSelectedCity: Dispatch<SetStateAction<string>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedType: Dispatch<SetStateAction<LeadType>>;
}

/**
 * Búsquedas de lugares: manual, campaña masiva, bandas similares, multifuente y cultural.
 * @param params Estado y callbacks del contenedor ({@link PlaceSearchParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePlaceSearch({ selectedCity, selectedType, searchQuery, setSearchError, setImportSuccessMsg, setExtractStatus, setDiscardToast, searchLimit, aforoMin, aforoMax, existingLeads, activeCampaign, setPlaces, setSearchSource, massFilterTipos, bandGenre, bandName, similarBands, setSelectedCity, setSearchQuery, setSelectedType }: PlaceSearchParams) {
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (
    overrideQuery?: string,
    overrideCity?: string,
  ) => {
    const cityToUse = overrideCity !== undefined ? overrideCity : selectedCity;
    const catObj = CATEGORIES.find((c) => c.id === selectedType);
    let q = overrideQuery || searchQuery;

    if (!q.trim() && cityToUse.trim()) {
      q = `${catObj?.searchPrefix || catObj?.label || selectedType} en ${cityToUse.trim()}, España`;
    } else if (
      cityToUse.trim() &&
      !q.toLowerCase().includes(cityToUse.toLowerCase().trim())
    ) {
      q = `${q.trim()} en ${cityToUse.trim()}, España`;
    }

    if (!q.trim() && !cityToUse.trim()) {
      setSearchError("Por favor introduce una ciudad o término de búsqueda.");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setImportSuccessMsg("");
    setExtractStatus("");
    setDiscardToast("");

    try {
      const res = await apiFetch("/api/leads/places-search", {
        method: "POST",
        body: JSON.stringify({
          query: q,
          ciudad: cityToUse,
          tipo: selectedType,
          limit: searchLimit,
          aforoMin: aforoMin ? Number(aforoMin) : undefined,
          aforoMax: aforoMax ? Number(aforoMax) : undefined,
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
              tipo: p.tipo || selectedType,
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
          res.source ||
            (res.isPlacesApi
              ? "Google Places API Direct"
              : "Buscador Agéntico Gemini con Grounding"),
        );
      } else {
        setSearchError(
          res.error ||
            "No se encontraron resultados verificados para la búsqueda.",
        );
      }
    } catch (err) {
      console.error("Error en Buscador de Salas:", err);
      setSearchError(
        errorMessage(err) || "Error de conexión al buscar nuevos contactos.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickCityClick = (city: string) => {
    setSelectedCity(city);
    const catObj = CATEGORIES.find((c) => c.id === selectedType);
    const q = `${catObj?.searchPrefix || catObj?.label || selectedType} en ${city}, España`;
    setSearchQuery(q);
    handleSearch(q, city);
  };

  const handleCategoryChange = (newCat: LeadType) => {
    setSelectedType(newCat);
    if (selectedCity.trim()) {
      const catObj = CATEGORIES.find((c) => c.id === newCat);
      const q = `${catObj?.searchPrefix || catObj?.label || newCat} en ${selectedCity.trim()}, España`;
      setSearchQuery(q);
    }
  };

  const { handleMassCampaignSearch, isMassCampaignSearching } = useMassCampaignSearch({ setSearchError, setImportSuccessMsg, setExtractStatus, setDiscardToast, activeCampaign, selectedCity, aforoMin, aforoMax, massFilterTipos, bandGenre, bandName, existingLeads, setPlaces, setSearchSource });

  const { handleSearchMultiSource, handleSearchPublicCultural, handleSearchSimilarBands } = useAlternativePlaceSources({ setIsSearching, setSearchError, setImportSuccessMsg, setExtractStatus, setDiscardToast, similarBands, bandName, bandGenre, selectedCity, activeCampaign, searchLimit, existingLeads, setPlaces, setSearchSource, searchQuery, selectedType });

  return { handleCategoryChange, handleMassCampaignSearch, isMassCampaignSearching, isSearching, handleSearch, handleSearchMultiSource, handleSearchPublicCultural, handleQuickCityClick, handleSearchSimilarBands };
}
