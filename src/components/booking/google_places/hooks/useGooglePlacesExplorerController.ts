/**
 * Controlador del explorador de lugares: compone los hooks por subdominio (filtros, resultados,
 * descartados, búsqueda, extracción de emails e importación al CRM).
 * Extraído de GooglePlacesExplorerModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { GooglePlacesExplorerModalProps } from "../../GooglePlacesExplorerModal";
import { useDiscardedPlaces } from "./useDiscardedPlaces";
import { usePlaceCrmImport } from "./usePlaceCrmImport";
import { usePlaceEmailExtraction } from "./usePlaceEmailExtraction";
import { usePlaceResults } from "./usePlaceResults";
import { usePlaceSearch } from "./usePlaceSearch";
import { useScoutFilters } from "./useScoutFilters";

/**
 * Estado y acciones del explorador de lugares.
 * @param params Props del modal con sus valores por defecto ya aplicados.
 * @returns Todo lo que consumen las vistas.
 */
export function useGooglePlacesExplorerController({
  isOpen,
  onClose,
  onImportLeads,
  activeCampaign,
  existingLeads,
  bandGenre,
  bandName,
  similarBands,
}: Required<Pick<GooglePlacesExplorerModalProps, "existingLeads" | "bandGenre" | "bandName" | "similarBands">> &
  Omit<GooglePlacesExplorerModalProps, "existingLeads" | "bandGenre" | "bandName" | "similarBands">) {
  const { selectedCity, selectedType, searchQuery, searchLimit, aforoMin, aforoMax, setSelectedCity, setSearchQuery, setSelectedType, setSearchLimit, massFilterTipos, setMassFilterTipos, setShowAdvancedFilters, showAdvancedFilters, setAforoMin, setAforoMax } = useScoutFilters({ activeCampaign, isOpen });

  const { setPlaces, places, setSearchError, setImportSuccessMsg, setExtractStatus, setSearchSource, searchSource, searchError, extractStatus, importSuccessMsg, toggleSelectAll, toggleSelectPlace, handlePlaceCategoryChange } = usePlaceResults();

  const { setDiscardedList, setShowDiscardedModal, setDiscardToast, discardedList, discardToast, selectedCount, handleDiscardPlace, showDiscardedModal, handleRestorePlace, handleClearAllDiscarded } = useDiscardedPlaces({ places, setPlaces });

  const { handleMassCampaignSearch, isMassCampaignSearching, isSearching, handleSearch, handleSearchMultiSource, handleSearchPublicCultural, handleQuickCityClick, handleSearchSimilarBands, handleCategoryChange } = usePlaceSearch({ selectedCity, selectedType, searchQuery, setSearchError, setImportSuccessMsg, setExtractStatus, setDiscardToast, searchLimit, aforoMin, aforoMax, existingLeads, activeCampaign, setPlaces, setSearchSource, massFilterTipos, bandGenre, bandName, similarBands, setSelectedCity, setSearchQuery, setSelectedType });

  const { handleExtractBatchEmails, isExtractingBatch, handleExtractSingleEmail, emailsFoundCount } = usePlaceEmailExtraction({ places, setPlaces, setExtractStatus });

  const { handleImportToCRM, isImporting } = usePlaceCrmImport({ places, setImportSuccessMsg, onImportLeads, onClose, setSearchError });

  return { selectedCity, selectedType, searchQuery, searchLimit, aforoMin, aforoMax, setSelectedCity, setSearchQuery, setSelectedType, setSearchLimit, massFilterTipos, setMassFilterTipos, setShowAdvancedFilters, showAdvancedFilters, setAforoMin, setAforoMax, setPlaces, places, setSearchError, setImportSuccessMsg, setExtractStatus, setSearchSource, searchSource, searchError, extractStatus, importSuccessMsg, toggleSelectAll, toggleSelectPlace, handlePlaceCategoryChange, setDiscardedList, setShowDiscardedModal, setDiscardToast, discardedList, discardToast, selectedCount, handleDiscardPlace, showDiscardedModal, handleRestorePlace, handleClearAllDiscarded, handleMassCampaignSearch, isMassCampaignSearching, isSearching, handleSearch, handleSearchMultiSource, handleSearchPublicCultural, handleQuickCityClick, handleSearchSimilarBands, handleCategoryChange, handleExtractBatchEmails, isExtractingBatch, handleExtractSingleEmail, emailsFoundCount, handleImportToCRM, isImporting };
}
