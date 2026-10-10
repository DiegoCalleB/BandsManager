import type { CulturalOpportunityItem,MultiSourceVenueItem,SimilarVenueItem } from "../placesModel";
import { errorMessage } from "../placesModel";
/**
 * Búsquedas por bandas similares, multifuente y cultural pública.
 * Extraído de usePlaceSearch.ts (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction } from "react";
import { BookingCampaign,Lead,LeadType } from "../../../../types";
import { apiFetch } from "../../../../utils/api";
import { getStoredDiscarded,PlaceResult } from "../placesModel";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AlternativePlaceSourcesParams {
  setIsSearching: Dispatch<SetStateAction<boolean>>;
  setSearchError: Dispatch<SetStateAction<string>>;
  setImportSuccessMsg: Dispatch<SetStateAction<string>>;
  setExtractStatus: Dispatch<SetStateAction<string>>;
  setDiscardToast: Dispatch<SetStateAction<string>>;
  similarBands: string[];
  bandName: string;
  bandGenre: string;
  selectedCity: string;
  activeCampaign: BookingCampaign;
  searchLimit: number;
  existingLeads: Lead[];
  setPlaces: Dispatch<SetStateAction<PlaceResult[]>>;
  setSearchSource: Dispatch<SetStateAction<string>>;
  searchQuery: string;
  selectedType: LeadType;
}

/**
 * Búsquedas por bandas similares, multifuente y cultural pública.
 * @param params Estado y callbacks del contenedor ({@link AlternativePlaceSourcesParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAlternativePlaceSources({ setIsSearching, setSearchError, setImportSuccessMsg, setExtractStatus, setDiscardToast, similarBands, bandName, bandGenre, selectedCity, activeCampaign, searchLimit, existingLeads, setPlaces, setSearchSource, searchQuery, selectedType }: AlternativePlaceSourcesParams) {
  const handleSearchSimilarBands = async (targetBand?: string) => {
    setIsSearching(true);
    setSearchError("");
    setImportSuccessMsg("");
    setExtractStatus("");
    setDiscardToast("");

    const bandsToQuery = targetBand
      ? [targetBand]
      : similarBands && similarBands.length > 0
        ? similarBands
        : ["Macaco", "La Pegatina"];

    try {
      const res = await apiFetch("/api/leads/similar-artists-venues", {
        method: "POST",
        body: JSON.stringify({
          bandName: bandName || "Tu Banda",
          genre: bandGenre || "Música en directo",
          similarArtists: bandsToQuery,
          targetCities: selectedCity
            ? [selectedCity]
            : activeCampaign?.targetCities?.length
              ? activeCampaign.targetCities
              : ["Madrid", "Barcelona", "Valencia", "Sevilla"],
          limit: searchLimit || 8,
        }),
      });

      if (res.success && Array.isArray(res.matches)) {
        const currentDiscarded = getStoredDiscarded();
        const isDiscarded = (name: string) => {
          const norm = (name || "").toLowerCase().trim();
          return currentDiscarded.some(
            (d) => d.nombre_sala.toLowerCase().trim() === norm,
          );
        };

        const mapped: PlaceResult[] = res.matches
          .filter((m: SimilarVenueItem) => !isDiscarded(m.nombre_sala))
          .map((m: SimilarVenueItem, idx: number) => {
            const normName = (m.nombre_sala || "").toLowerCase().trim();
            const existingMatch = existingLeads.find(
              (l) =>
                l.nombre_sala &&
                l.nombre_sala.toLowerCase().trim() === normName,
            );
            return {
              place_id: `similar-${Date.now()}-${idx}`,
              nombre_sala: m.nombre_sala,
              ciudad: m.ciudad || selectedCity || "España",
              region: "España",
              direccion: m.ciudad || "",
              telefono: "",
              website: "",
              tipo: "sala",
              aforo: m.aforo_estimado,
              genero: m.genero_predominante,
              descripcion: `${m.razon_recomendacion || ""} (Artistas afines: ${(m.bandas_similares_que_tocaron || []).join(", ")})`,
              email_contacto: m.contacto_sugerido || "",
              fuente: `Radar Afinidad (${m.fuente || "Bandsintown & Setlist.fm"})`,
              selected: !existingMatch,
              alreadyInCrm: !!existingMatch,
              crmStatus: existingMatch ? existingMatch.estado : null,
              crmId: existingMatch ? existingMatch.id : null,
              crmNombre: existingMatch ? existingMatch.nombre_sala : null,
              capacityMatch: true,
            };
          });

        setPlaces(mapped);
        setSearchSource(
          `Efecto Espejo: Recintos donde han tocado ${bandsToQuery.join(", ")} (${res.matches.length} salas encontradas)`,
        );
      } else {
        setSearchError(
          res.error || "No se obtuvieron recintos para las bandas afines.",
        );
      }
    } catch (err) {
      console.error("Error en búsqueda de bandas afines:", err);
      setSearchError(
        errorMessage(err) || "Fallo de conexión en el radar de afinidad.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchMultiSource = async () => {
    setIsSearching(true);
    setSearchError("");
    setImportSuccessMsg("");
    setExtractStatus("");
    setDiscardToast("");

    const queryCity =
      selectedCity || activeCampaign?.targetCities?.[0] || "Madrid";

    try {
      const res = await apiFetch("/api/leads/multi-source-venues", {
        method: "POST",
        body: JSON.stringify({
          query: searchQuery || `Salas de conciertos y música en vivo`,
          ciudad: queryCity,
          tipo: selectedType || "sala",
          limit: searchLimit || 10,
        }),
      });

      if (res.success && Array.isArray(res.venues)) {
        const currentDiscarded = getStoredDiscarded();
        const isDiscarded = (name: string) => {
          const norm = (name || "").toLowerCase().trim();
          return currentDiscarded.some(
            (d) => d.nombre_sala.toLowerCase().trim() === norm,
          );
        };

        const mapped: PlaceResult[] = res.venues
          .filter((v: MultiSourceVenueItem) => !isDiscarded(v.nombre))
          .map((v: MultiSourceVenueItem, idx: number) => {
            const normName = (v.nombre || "").toLowerCase().trim();
            const existingMatch = existingLeads.find(
              (l) =>
                l.nombre_sala &&
                l.nombre_sala.toLowerCase().trim() === normName,
            );
            const verifiedBadges =
              Array.isArray(v.fuentes_verificadas) &&
              v.fuentes_verificadas.length > 0
                ? v.fuentes_verificadas.join(", ")
                : v.fuente;

            return {
              place_id: `multisource-${Date.now()}-${idx}`,
              nombre_sala: v.nombre,
              ciudad: v.ciudad || queryCity,
              region: v.pais || "España",
              direccion: v.direccion || v.ciudad || "",
              telefono: v.telefono || "",
              website: v.url_oficial || "",
              tipo: v.tipo || "sala",
              aforo: v.capacidad,
              genero: Array.isArray(v.generos_frecuentes)
                ? v.generos_frecuentes.join(", ")
                : "",
              descripcion:
                v.detalles_tecnicos || `Verificado en ${verifiedBadges}`,
              email_contacto: v.email || "",
              fuente: `Radar Multi-Fuente (${verifiedBadges})`,
              selected: !existingMatch,
              alreadyInCrm: !!existingMatch,
              crmStatus: existingMatch ? existingMatch.estado : null,
              crmId: existingMatch ? existingMatch.id : null,
              crmNombre: existingMatch ? existingMatch.nombre_sala : null,
              capacityMatch: true,
            };
          });

        setPlaces(mapped);
        setSearchSource(
          `Radar Multi-Fuente: ${res.venues.length} recintos encontrados (${(res.fuentes_consultadas || ["Wegow", "Songkick", "Ticketmaster", "MusicBrainz"]).join(" • ")})`,
        );
      } else {
        setSearchError(
          res.error || "No se obtuvieron recintos con el radar multi-fuente.",
        );
      }
    } catch (err) {
      console.error("Error en búsqueda multi-fuente:", err);
      setSearchError(errorMessage(err) || "Fallo al ejecutar el radar multi-fuente.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchPublicCultural = async () => {
    setIsSearching(true);
    setSearchError("");
    setImportSuccessMsg("");
    setExtractStatus("");
    setDiscardToast("");

    const queryRegion =
      selectedCity || activeCampaign?.targetCities?.[0] || "Madrid";

    try {
      const res = await apiFetch("/api/leads/public-cultural-radar", {
        method: "POST",
        body: JSON.stringify({
          provinciaOrRegion: queryRegion,
          estiloMusical: bandGenre || "Música en directo",
          bandName: bandName || "Tu Banda",
          limit: searchLimit || 8,
        }),
      });

      if (res.success && Array.isArray(res.oportunidades)) {
        const currentDiscarded = getStoredDiscarded();
        const isDiscarded = (name: string) => {
          const norm = (name || "").toLowerCase().trim();
          return currentDiscarded.some(
            (d) => d.nombre_sala.toLowerCase().trim() === norm,
          );
        };

        const mapped: PlaceResult[] = res.oportunidades
          .filter((op: CulturalOpportunityItem) => !isDiscarded(op.entidad_o_evento))
          .map((op: CulturalOpportunityItem, idx: number) => {
            const normName = (op.entidad_o_evento || "").toLowerCase().trim();
            const existingMatch = existingLeads.find(
              (l) =>
                l.nombre_sala &&
                l.nombre_sala.toLowerCase().trim() === normName,
            );

            return {
              place_id: `cultural-${Date.now()}-${idx}`,
              nombre_sala: op.entidad_o_evento,
              ciudad: op.municipio || queryRegion,
              region: op.provincia || queryRegion,
              direccion: op.municipio || "",
              telefono: op.telefono || "",
              website: op.url_registro || "",
              tipo: (op.tipo === "ayuntamiento"
                ? "ayuntamiento"
                : "sala") as LeadType,
              aforo: undefined,
              genero: bandGenre || "Cultural",
              descripcion: `${op.programa_o_ciclo || ""} · ${op.requisitos_o_perfil || ""} (${op.plazo_presentacion || "Convocatoria"})`,
              email_contacto: op.email_contacto || "",
              fuente: `Radar Cultural Público (${op.fuente_datos || "Datos Abiertos & Municipios"})`,
              selected: !existingMatch,
              alreadyInCrm: !!existingMatch,
              crmStatus: existingMatch ? existingMatch.estado : null,
              crmId: existingMatch ? existingMatch.id : null,
              crmNombre: existingMatch ? existingMatch.nombre_sala : null,
              capacityMatch: true,
            };
          });

        setPlaces(mapped);
        setSearchSource(
          `Radar Cultural Público: ${res.oportunidades.length} teatros, auditorios y convocatorias en ${queryRegion}`,
        );
      } else {
        setSearchError(
          res.error || "No se obtuvieron convocatorias en el radar cultural.",
        );
      }
    } catch (err) {
      console.error("Error en radar cultural público:", err);
      setSearchError(errorMessage(err) || "Fallo de conexión con el radar cultural.");
    } finally {
      setIsSearching(false);
    }
  };

  return { handleSearchMultiSource, handleSearchPublicCultural, handleSearchSimilarBands };
}
