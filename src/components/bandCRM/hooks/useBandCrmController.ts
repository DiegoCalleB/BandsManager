/**
 * Compone los hooks del CRM de bandas (datos, estado de interfaz, derivados, tono, formulario, CRUD y acciones masivas).
 * Extraído de BandCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { BookingCampaign } from "../../../types";
import { useState } from "react";
import { Lead } from "../../../types";
import { useBandBulkActions } from "./useBandBulkActions";
import { useBandCrmData } from "./useBandCrmData";
import { useBandCrmUiState } from "./useBandCrmUiState";
import { useBandCrud } from "./useBandCrud";
import { useBandDerivedData } from "./useBandDerivedData";
import { useBandForm } from "./useBandForm";
import { useBandToneAnalysis } from "./useBandToneAnalysis";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandCrmControllerParams {
  bandName: string;
  currentBandId: string;
  leads: Lead[];
  onUpdateLead: (id: string, updatedFields: Partial<Lead>) => void;
  onAddLead: (lead: Lead) => void;
}

/**
 * Compone los hooks del CRM de bandas (datos, estado de interfaz, derivados, tono, formulario, CRUD y acciones masivas).
 * @param params Estado y callbacks del contenedor ({@link BandCrmControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandCrmController({ bandName, currentBandId, leads, onUpdateLead, onAddLead }: BandCrmControllerParams) {
  const [activeCampaign, setActiveCampaign] = useState<BookingCampaign | null>(null);

  const { setReproductor, bands, myBandName, setBands, setSelectedBandIds, selectedBandIds, fetchBands, setBulkProgressState, registeredBands, subTab, setSubTab, fetchRegisteredBands, actualizarMetricas, actualizandoMetricas, isLoadingRegBands, metricas, disponibles, reproductor, bulkProgressState } = useBandCrmData({ bandName, currentBandId, leads });

  const { searchTerm, statusFilter, styleFilter, locationFilter, proposedMonth, proposedCity, proposedVenue, setSelectedToneBand, setIsToneModalOpen, setIsAnalyzingTone, setToneData, setEditingBand, setIsAddEditModalOpen, editingBand, setSelectedPitchBand, setIsPitchModalOpen, setIsSpotifySweepOpen, setSearchTerm, setStatusFilter, setLocationFilter, setViewMode, viewMode, setCustomPitchText, isAddEditModalOpen, isPitchModalOpen, selectedPitchBand, setProposedCity, setProposedVenue, setProposedMonth, customPitchText, isToneModalOpen, selectedToneBand, toneData, isAnalyzingTone, isSpotifySweepOpen } = useBandCrmUiState();

  const { filteredBands, totalBands, availableLocations, escuchar, generatePitchText } = useBandDerivedData({ setReproductor, bands, searchTerm, statusFilter, styleFilter, locationFilter, activeCampaign, myBandName, proposedMonth, proposedCity, proposedVenue });

  const { handleAnalyzeTone } = useBandToneAnalysis({ setSelectedToneBand, setIsToneModalOpen, setIsAnalyzingTone, setToneData, setBands });

  const { setFormName, setFormStyle, setFormLocation, setFormStatus, setFormLastContact, setFormContactName, setFormEmail, setFormPhone, setFormInstagram, setFormSpotifyYoutube, setFormAforo, setFormNotes, setFormIcon, setFormImageUrl, setAiProposal, setAiError, setIsAiSearching, formName, formStyle, formLocation, formStatus, formLastContact, formContactName, formEmail, formPhone, formInstagram, formSpotifyYoutube, formAforo, formNotes, formIcon, formImageUrl, setIsScoutModalOpen, handleAiLookup, isAiSearching, aiProposal, aiError, handleApplyAllAiData, handleLogoUpload, isUploadingLogo, isScoutModalOpen } = useBandForm({ setActiveCampaign, currentBandId });

  const { handleOpenCreateModal, handleDeselectAllBands, handleSelectAllFilteredBands, handleOpenEditModal, handleToggleSelectBand, handleUpdateBandFavorite, handleDeleteBand, handleSaveBand, handleImportScoutedBands } = useBandCrud({ setEditingBand, setFormName, setFormStyle, setFormLocation, setFormStatus, setFormLastContact, setFormContactName, setFormEmail, setFormPhone, setFormInstagram, setFormSpotifyYoutube, setFormAforo, setFormNotes, setFormIcon, setFormImageUrl, setAiProposal, setAiError, setIsAiSearching, setIsAddEditModalOpen, formName, editingBand, formStyle, formLocation, formStatus, formLastContact, formContactName, formEmail, formPhone, formInstagram, formSpotifyYoutube, formAforo, formNotes, formIcon, formImageUrl, setBands, onUpdateLead, onAddLead, myBandName, activeCampaign, setSelectedBandIds, filteredBands });

  const { handleBulkBandStatusChange, handleBulkGenerateSwaps, handleBulkBandToggleFavorite, handleBulkBandExportCsv, handleBulkBandDelete } = useBandBulkActions({ selectedBandIds, setBands, setSelectedBandIds, fetchBands, bands, setBulkProgressState, myBandName });

  return { totalBands, registeredBands, subTab, setSubTab, fetchRegisteredBands, bands, setSelectedPitchBand, setIsPitchModalOpen, setIsScoutModalOpen, actualizarMetricas, actualizandoMetricas, setIsSpotifySweepOpen, handleOpenCreateModal, isLoadingRegBands, searchTerm, setSearchTerm, statusFilter, setStatusFilter, locationFilter, setLocationFilter, availableLocations, filteredBands, selectedBandIds, handleDeselectAllBands, handleSelectAllFilteredBands, setViewMode, viewMode, handleBulkBandStatusChange, handleBulkGenerateSwaps, handleBulkBandToggleFavorite, handleBulkBandExportCsv, handleBulkBandDelete, handleOpenEditModal, handleToggleSelectBand, handleUpdateBandFavorite, metricas, disponibles, escuchar, setCustomPitchText, handleAnalyzeTone, handleDeleteBand, isAddEditModalOpen, setIsAddEditModalOpen, editingBand, handleSaveBand, formName, setFormName, formStyle, setFormStyle, formLocation, setFormLocation, formStatus, setFormStatus, formLastContact, setFormLastContact, formContactName, setFormContactName, formEmail, setFormEmail, formPhone, setFormPhone, formInstagram, setFormInstagram, formSpotifyYoutube, setFormSpotifyYoutube, formAforo, setFormAforo, formNotes, setFormNotes, formIcon, setFormIcon, formImageUrl, setFormImageUrl, handleAiLookup, isAiSearching, aiProposal, setAiProposal, aiError, setAiError, handleApplyAllAiData, handleLogoUpload, isUploadingLogo, isPitchModalOpen, selectedPitchBand, activeCampaign, myBandName, proposedCity, setProposedCity, proposedVenue, setProposedVenue, proposedMonth, setProposedMonth, generatePitchText, customPitchText, isToneModalOpen, setIsToneModalOpen, selectedToneBand, toneData, isAnalyzingTone, isSpotifySweepOpen, fetchBands, reproductor, setReproductor, isScoutModalOpen, handleImportScoutedBands, bulkProgressState, setBulkProgressState };
}
