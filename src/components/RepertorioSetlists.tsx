import type { Analysis } from "./repertorio/SetlistAIAnalysisModal";
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 react-hooks/exhaustive-deps
*/
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useModuleTutorial } from "../hooks/useModuleTutorial";
import { useRepertorioTabs } from "../hooks/useRepertorioTabs";
import { Concert, Rehearsal, ThemeColors } from "../types";
import { formatSecondsToMmSs } from "../utils/stageTimeFormat";
import { useActiveSetlistState } from "./repertorio/hooks/useActiveSetlistState";
import { useBandRepertoireScope } from "./repertorio/hooks/useBandRepertoireScope";
import { useCatalogActions } from "./repertorio/hooks/useCatalogActions";
import { useEnergyMapData } from "./repertorio/hooks/useEnergyMapData";
import { useRepertorioData } from "./repertorio/hooks/useRepertorioData";
import { useRepertorioDialogs } from "./repertorio/hooks/useRepertorioDialogs";
import { useRepertorioPersistence } from "./repertorio/hooks/useRepertorioPersistence";
import { useRepertorioPlaybackAndModals } from "./repertorio/hooks/useRepertorioPlaybackAndModals";
import { useRepertorioPlayers } from "./repertorio/hooks/useRepertorioPlayers";
import { useRepertorioViewState } from "./repertorio/hooks/useRepertorioViewState";
import { useSetlistCrud } from "./repertorio/hooks/useSetlistCrud";
import { useSetlistDeletion } from "./repertorio/hooks/useSetlistDeletion";
import { useSetlistItemActions } from "./repertorio/hooks/useSetlistItemActions";
import { useSetlistItemPopovers } from "./repertorio/hooks/useSetlistItemPopovers";
import { useSetlistItemsMutations } from "./repertorio/hooks/useSetlistItemsMutations";
import { useSetlistReordering } from "./repertorio/hooks/useSetlistReordering";
import { useSetlistSync } from "./repertorio/hooks/useSetlistSync";
import { useSongEditing } from "./repertorio/hooks/useSongEditing";
import { RepertorioCatalogView } from "./repertorio/RepertorioCatalogView";
import { RepertorioModalsContainer } from "./repertorio/RepertorioModalsContainer";
import { RepertorioNavBar } from "./repertorio/RepertorioNavBar";
import { RepertorioSetlistsView } from "./repertorio/RepertorioSetlistsView";

interface RepertorioSetlistsProps {
  colors: ThemeColors;
  concerts: Concert[];
  rehearsals: Rehearsal[];
  bandName?: string;
  bandId?: string;
  bandUsers?: import("../types").User[];
  bandLogoUrl?: string;
  onUpdateConcert?: (id: string, fields: Partial<Concert>) => void;
  onUpdateRehearsal?: (id: string, fields: Partial<Rehearsal>) => void;
  view?: "repertorio" | "catalogo" | "discografia";
  currentUser?: import("../types").User;
  onNavigate?: (view: "repertorio" | "catalogo" | "discografia") => void;
}

import { SHOW_ITEM_TYPES } from "../config/defaultRepertoire";

export { SHOW_ITEM_TYPES };

export { formatSecondsToMmSs };


export default function RepertorioSetlists({
  colors,
  concerts,
  rehearsals,
  bandName,
  bandId,
  bandUsers,
  bandLogoUrl,
  onUpdateConcert,
  onUpdateRehearsal,
  view,
  currentUser,
  onNavigate,
}: RepertorioSetlistsProps) {
  const { t } = useLanguage();
  const isLightTheme =
    (typeof document !== "undefined" &&
      document.documentElement.dataset.theme === "light") ||
    colors.name?.toLowerCase().includes("light") ||
    colors.bg.includes("f8fafc") ||
    colors.bg.includes("white") ||
    colors.bg.includes("neutral-50") ||
    false;
  const bName = bandName || "Tu Banda";

  const {
    isOpen: isTutorialOpen,
    openTutorial,
    closeTutorial,
  } = useModuleTutorial("repertorio");

  const { cleanBand, sanitizeBandSongs, sanitizeBandSetlists, bandRosterMembers } = useBandRepertoireScope({ bandId, bandUsers });

  // Navigation tab inside module
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const { activeTab, catalogoViewMode, setCatalogoViewMode, handleTabChange } =
    useRepertorioTabs(view, onNavigate);

  const { setlists, songs, setSongs, setSetlists } = useRepertorioData({ cleanBand });

  const { activeSetlist, setActiveSetlistId, setCustomShortcuts, newShortcutLabel, newShortcutIcon, setNewShortcutLabel, setNewShortcutIcon, setIsAddingShortcut, activeSetlistId, setPerformanceInitialMode, setPerformanceSetlistId, customShortcuts, isAddingShortcut, performanceSetlistId, performanceInitialMode } = useActiveSetlistState({ setlists });
  const [newShortcutMinutes, setNewShortcutMinutes] = useState<number>(1);

  const { handleSelectPlayerSong, setCurrentSong, setPlayerSongs, setPlayerIsPlaying, setIsPlayerPlaying, activePlayerSong, setActivePlayerSong, albumsList, handleShareSetlist, playerCurrentSong, isPlayerPlaying, handleShareSong, filteredSongs, catalogAlbumFilter, setCatalogAlbumFilter, catalogStatusFilter, setCatalogStatusFilter, catalogSearch, groupByAlbum, setGroupByAlbum, shareModalData, setShareModalData } = useRepertorioPlayers({ songs, bName, activeSetlist });

  const { getHeaders, toggleFavoriteSong } = useRepertorioPersistence({ songs, setSongs, bandId, cleanBand, sanitizeBandSongs, sanitizeBandSetlists, setSetlists, setActiveSetlistId, setlists, setCustomShortcuts });

  const { syncSetlistToBackend, activeSetlistMetrics } = useSetlistSync({ getHeaders, bandId, activeSetlist, songs });

  const { setActiveChordsSong, activeStudioSong, setActiveStudioSong, editingSong, setShowSongModal, setEditingSong, selectedSetlistItemId, setSelectedSetlistItemId, handleOpenTransitionPreview, selectPlayerSongWithQueue, handleOpenStudioModal, setActiveMemberNotesSong, draggedCatalogSongId, setDraggedCatalogSongId, dragOverCatalogSongId, setDragOverCatalogSongId, handleDropCatalogSong, showSongModal, activeStudioOpenIris, setActiveStudioOpenIris, activeMemberNotesSong, activeChordsSong, isSpotifyModalOpen, setIsSpotifyModalOpen, transitionPreviewData, setTransitionPreviewData } = useRepertorioPlaybackAndModals({ handleSelectPlayerSong, setCurrentSong, setPlayerSongs, songs, setPlayerIsPlaying, setIsPlayerPlaying, activeSetlist, setSongs, getHeaders });

  const { setAiAnalysisResult, setHighlightedSongIds, perfectSetlistDraft, setPerfectSetlistDraft, setUndoReorderSnapshot, setChapaSuggestion, setOptimizeSummary, chapaSuggestion, setPerfectSetlistLoading, setPerfectSetlistError, setPerfectSetlistPlan, undoReorderSnapshot, setShowImportSetlistModal, setShowAIAnalysisModal, setShowPerfectSetlistModal, aiAnalysisResult, showSetlistStats, setShowSetlistStats, showEnergyMap, setShowEnergyMap, showChartSettingsMenu, setShowChartSettingsMenu, showIdealCurve, setShowIdealCurve, showBpmLine, setShowBpmLine, showTonalidad, setShowTonalidad, chartZoom, setChartZoom, showTransitionBadges, setShowTransitionBadges, showConcertPlayer, setShowConcertPlayer, optimizeSummary, highlightedSongIds, showHeuristicWarnings, setShowHeuristicWarnings, showCatalogActionsMenu, setShowCatalogActionsMenu, showAIAnalysisModal, setAiAnalysisLoading, showPerfectSetlistModal, perfectSetlistLoading, perfectSetlistPlan, perfectSetlistError, showImportSetlistModal } = useRepertorioViewState();

  const { energyAnalysis, chartData, yDomain, ZONAS_ENERGIA } = useEnergyMapData({ activeSetlist, songs });

  const { draggedItemIndex, setDraggedItemIndex, setDragOverItemIndex, handleEnergyChartDrag, expandedSetlistItemIds, setExpandedSetlistItemIds, dragOverItemIndex, editingKeyItemId, setEditingKeyItemId, keyPopoverPos, setKeyPopoverPos, handleSetTonalidadDeseada, editingEnergyItemId, setEditingEnergyItemId, energyPopoverPos, setEnergyPopoverPos, savingEnergyItemId, handleSetEnergiaManual } = useSetlistItemPopovers({ activeSetlist, setSetlists, syncSetlistToBackend, setSongs, getHeaders, songs });

  const { setStatusBanner, setConfirmDeleteModal, editingShowItem, showItemAudioUrl, setShowShowItemModal, setEditingShowItem, setShowItemAudioUrl, assigningSetlist, selectedConcertToAssign, setAssigningSetlist, setSelectedCatalogIds, setSetlistModalData, setAssignSongsModalData, sortedSongsByAlbumAndOrder, setIsAddSongsModalOpen, handleUpdateSongFromStudio, setDeleteAlbumData, selectedCatalogIds, defaultAlbumForNewSong, setSelectedConcertToAssign, showShowItemModal, assignSongsModalData, setlistModalData, isAddSongsModalOpen, handleUpdateSongFromChords, confirmDeleteModal, deleteAlbumData, statusBanner } = useRepertorioDialogs({ songs, setSongs, setActiveChordsSong, activeStudioSong, setActiveStudioSong, activePlayerSong, setActivePlayerSong, bandId, getHeaders });

  // Cuando cambia el setlist activo, cargar el análisis IA guardado si existe
  useEffect(() => {
    if (activeSetlist?.ai_analysis_json) {
      setAiAnalysisResult(activeSetlist.ai_analysis_json as unknown as Analysis);
    } else {
      setAiAnalysisResult(null);
    }
    setHighlightedSongIds([]);
  }, [activeSetlist?.id, activeSetlist?.ai_analysis_json]);

  const { handleDeleteSong, handleSaveSong } = useSongEditing({ setStatusBanner, setSongs, editingSong, activePlayerSong, setActivePlayerSong, getHeaders, setShowSongModal, setEditingSong, songs, setConfirmDeleteModal, setlists, setSetlists });

  const { handleAddMultipleSongsToSetlist, handleAddItemToSetlist, handleUseCustomShortcut, handleDeleteShortcut, handleCreateShortcut, handleRemoveSetlistItem, handleUpdateItemNote, handleAssignSetlistToConcert, handleSaveShowItem } = useSetlistItemActions({ activeSetlist, selectedSetlistItemId, setSetlists, syncSetlistToBackend, setSelectedSetlistItemId, newShortcutLabel, getHeaders, newShortcutIcon, newShortcutMinutes, setCustomShortcuts, setNewShortcutLabel, setNewShortcutIcon, setNewShortcutMinutes, setIsAddingShortcut, editingShowItem, showItemAudioUrl, setShowShowItemModal, setEditingShowItem, setShowItemAudioUrl, assigningSetlist, selectedConcertToAssign, concerts, onUpdateConcert, rehearsals, onUpdateRehearsal, setAssigningSetlist, songs, activeSetlistMetrics, currentUser });

  const { handleToggleFavorite, handleNormalizeCatalogTitles, clearCatalogSelection, toggleCatalogSelect, handleBulkAddSelectedToSetlist, handleBulkDeleteSongs, handleSaveAlbumSongs, handleUnassignAlbumSongs, handleDeleteAlbumAndSongs } = useCatalogActions({ setSelectedCatalogIds, setConfirmDeleteModal, songs, setlists, setSongs, setSetlists, getHeaders, activeSetlist, setStatusBanner, handleAddMultipleSongsToSetlist, toggleFavoriteSong });

  const { handleDuplicateSetlist, handleCreateSetlist, handleSaveSetlistModal, handleSetlistImported } = useSetlistCrud({ setSetlistModalData, setSongs, setSetlists, setActiveSetlistId, setlists, getHeaders, songs });

  const { handleDeleteSetlist } = useSetlistDeletion({ setlists, setConfirmDeleteModal, setSetlists, activeSetlistId, setActiveSetlistId, perfectSetlistDraft, setPerfectSetlistDraft, getHeaders });

  const { optimizeSetlistTransitions, suggestChapaSpot, insertSuggestedChapa, reorderSetlistItems, removeSetlistItemAtIndex, insertSongAtIndex, insertBlockAtIndex } = useSetlistItemsMutations({ activeSetlist, setUndoReorderSnapshot, setSetlists, syncSetlistToBackend, songs, setChapaSuggestion, setOptimizeSummary, chapaSuggestion, handleAddItemToSetlist });

  const { canUndoReorder, undoLastReorder, handleDropItem, undoSourceKey, handleGeneratePerfectSetlist, applyPerfectSetlistAction } = useSetlistReordering({ reorderSetlistItems, removeSetlistItemAtIndex, insertSongAtIndex, insertBlockAtIndex, activeSetlist, perfectSetlistDraft, setlists, setActiveSetlistId, setPerfectSetlistLoading, setPerfectSetlistError, handleDuplicateSetlist, setPerfectSetlistDraft, setPerfectSetlistPlan, undoReorderSnapshot, setSetlists, syncSetlistToBackend, setUndoReorderSnapshot, draggedItemIndex, setDraggedItemIndex, setDragOverItemIndex });


  return (
    <div
      data-modulo={activeTab === "catalogo" ? "discografia" : "repertorio"}
      className="space-y-3"
    >
      {/* REPERTORIO UNIFIED NAV BAR: Título, tabs segmentadas (Setlists & Directo / Catálogo & Discografía) y acciones rápidas */}
      <RepertorioNavBar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        catalogoViewMode={catalogoViewMode}
        setCatalogoViewMode={setCatalogoViewMode}
        setlists={setlists}
        activeSetlistId={activeSetlistId}
        onSelectSetlist={(id) => {
          setActiveSetlistId(id);
        }}
        onCreateSetlist={handleCreateSetlist}
        onImportSetlist={() => setShowImportSetlistModal(true)}
        onOpenNewSongModal={() => {
          setEditingSong(null);
          setShowSongModal(true);
        }}
        onOpenNewAlbumModal={() =>
          setAssignSongsModalData({ isOpen: true, albumName: "" })
        }
        songCount={songs.length}
        albumCount={albumsList.filter((a) => a !== "todos").length}
        onOpenTutorial={openTutorial}
      />

      <RepertorioSetlistsView activeTab={activeTab} activeSetlist={activeSetlist} setSetlists={setSetlists} songs={songs} bandId={bandId} setPerformanceInitialMode={setPerformanceInitialMode} setPerformanceSetlistId={setPerformanceSetlistId} setShowAIAnalysisModal={setShowAIAnalysisModal} setPerfectSetlistPlan={setPerfectSetlistPlan} setPerfectSetlistError={setPerfectSetlistError} setShowPerfectSetlistModal={setShowPerfectSetlistModal} aiAnalysisResult={aiAnalysisResult} setShowPdfPreview={setShowPdfPreview} handleShareSetlist={handleShareSetlist} setAssigningSetlist={setAssigningSetlist} handleDuplicateSetlist={handleDuplicateSetlist} setShowImportSetlistModal={setShowImportSetlistModal} setSetlistModalData={setSetlistModalData} handleDeleteSetlist={handleDeleteSetlist} activeSetlistMetrics={activeSetlistMetrics} energyAnalysis={energyAnalysis} showSetlistStats={showSetlistStats} setShowSetlistStats={setShowSetlistStats} chartData={chartData} yDomain={yDomain} ZONAS_ENERGIA={ZONAS_ENERGIA} canUndoReorder={canUndoReorder} undoLastReorder={undoLastReorder} showEnergyMap={showEnergyMap} setShowEnergyMap={setShowEnergyMap} optimizeSetlistTransitions={optimizeSetlistTransitions} suggestChapaSpot={suggestChapaSpot} showChartSettingsMenu={showChartSettingsMenu} setShowChartSettingsMenu={setShowChartSettingsMenu} showIdealCurve={showIdealCurve} setShowIdealCurve={setShowIdealCurve} showBpmLine={showBpmLine} setShowBpmLine={setShowBpmLine} showTonalidad={showTonalidad} setShowTonalidad={setShowTonalidad} chartZoom={chartZoom} setChartZoom={setChartZoom} showTransitionBadges={showTransitionBadges} setShowTransitionBadges={setShowTransitionBadges} showConcertPlayer={showConcertPlayer} setShowConcertPlayer={setShowConcertPlayer} optimizeSummary={optimizeSummary} chapaSuggestion={chapaSuggestion} setChapaSuggestion={setChapaSuggestion} insertSuggestedChapa={insertSuggestedChapa} highlightedSongIds={highlightedSongIds} setHighlightedSongIds={setHighlightedSongIds} selectedSetlistItemId={selectedSetlistItemId} setSelectedSetlistItemId={setSelectedSetlistItemId} playerCurrentSong={playerCurrentSong} handleOpenTransitionPreview={handleOpenTransitionPreview} reorderSetlistItems={reorderSetlistItems} handleEnergyChartDrag={handleEnergyChartDrag} showHeuristicWarnings={showHeuristicWarnings} setShowHeuristicWarnings={setShowHeuristicWarnings} sortedSongsByAlbumAndOrder={sortedSongsByAlbumAndOrder} handleAddItemToSetlist={handleAddItemToSetlist} setIsAddSongsModalOpen={setIsAddSongsModalOpen} setEditingShowItem={setEditingShowItem} setShowShowItemModal={setShowShowItemModal} customShortcuts={customShortcuts} handleUseCustomShortcut={handleUseCustomShortcut} handleDeleteShortcut={handleDeleteShortcut} isAddingShortcut={isAddingShortcut} setIsAddingShortcut={setIsAddingShortcut} newShortcutIcon={newShortcutIcon} setNewShortcutIcon={setNewShortcutIcon} newShortcutLabel={newShortcutLabel} setNewShortcutLabel={setNewShortcutLabel} newShortcutMinutes={newShortcutMinutes} setNewShortcutMinutes={setNewShortcutMinutes} handleCreateShortcut={handleCreateShortcut} expandedSetlistItemIds={expandedSetlistItemIds} setExpandedSetlistItemIds={setExpandedSetlistItemIds} draggedItemIndex={draggedItemIndex} setDraggedItemIndex={setDraggedItemIndex} dragOverItemIndex={dragOverItemIndex} setDragOverItemIndex={setDragOverItemIndex} handleDropItem={handleDropItem} activePlayerSong={activePlayerSong} isPlayerPlaying={isPlayerPlaying} selectPlayerSongWithQueue={selectPlayerSongWithQueue} editingKeyItemId={editingKeyItemId} setEditingKeyItemId={setEditingKeyItemId} keyPopoverPos={keyPopoverPos} setKeyPopoverPos={setKeyPopoverPos} handleSetTonalidadDeseada={handleSetTonalidadDeseada} editingEnergyItemId={editingEnergyItemId} setEditingEnergyItemId={setEditingEnergyItemId} energyPopoverPos={energyPopoverPos} setEnergyPopoverPos={setEnergyPopoverPos} savingEnergyItemId={savingEnergyItemId} handleSetEnergiaManual={handleSetEnergiaManual} handleRemoveSetlistItem={handleRemoveSetlistItem} handleUpdateItemNote={handleUpdateItemNote} setEditingSong={setEditingSong} setShowSongModal={setShowSongModal} handleOpenStudioModal={handleOpenStudioModal} setActiveMemberNotesSong={setActiveMemberNotesSong} setActiveChordsSong={setActiveChordsSong} currentUser={currentUser} handleUpdateSongFromStudio={handleUpdateSongFromStudio} />

      <RepertorioCatalogView activeTab={activeTab} catalogoViewMode={catalogoViewMode} songs={songs} albumsList={albumsList} colors={colors} bName={bName} bandLogoUrl={bandLogoUrl} setSongs={setSongs} setSetlists={setSetlists} handleToggleFavorite={handleToggleFavorite} activePlayerSong={activePlayerSong} isPlayerPlaying={isPlayerPlaying} selectPlayerSongWithQueue={selectPlayerSongWithQueue} setDeleteAlbumData={setDeleteAlbumData} setAssignSongsModalData={setAssignSongsModalData} setActiveMemberNotesSong={setActiveMemberNotesSong} setActiveChordsSong={setActiveChordsSong} handleOpenStudioModal={handleOpenStudioModal} setEditingSong={setEditingSong} setShowSongModal={setShowSongModal} handleDeleteSong={handleDeleteSong} handleShareSong={handleShareSong} filteredSongs={filteredSongs} catalogAlbumFilter={catalogAlbumFilter} setCatalogAlbumFilter={setCatalogAlbumFilter} catalogStatusFilter={catalogStatusFilter} setCatalogStatusFilter={setCatalogStatusFilter} catalogSearch={catalogSearch} groupByAlbum={groupByAlbum} setGroupByAlbum={setGroupByAlbum} showCatalogActionsMenu={showCatalogActionsMenu} setShowCatalogActionsMenu={setShowCatalogActionsMenu} handleNormalizeCatalogTitles={handleNormalizeCatalogTitles} selectedCatalogIds={selectedCatalogIds} setSelectedCatalogIds={setSelectedCatalogIds} clearCatalogSelection={clearCatalogSelection} toggleCatalogSelect={toggleCatalogSelect} handleBulkAddSelectedToSetlist={handleBulkAddSelectedToSetlist} handleBulkDeleteSongs={handleBulkDeleteSongs} handleUpdateSongFromStudio={handleUpdateSongFromStudio} draggedCatalogSongId={draggedCatalogSongId} setDraggedCatalogSongId={setDraggedCatalogSongId} dragOverCatalogSongId={dragOverCatalogSongId} setDragOverCatalogSongId={setDragOverCatalogSongId} handleDropCatalogSong={handleDropCatalogSong} />

      <RepertorioModalsContainer
        showSongModal={showSongModal}
        setShowSongModal={setShowSongModal}
        editingSong={editingSong}
        bandRosterMembers={bandRosterMembers}
        defaultAlbumForNewSong={defaultAlbumForNewSong}
        albumsList={albumsList}
        colors={colors}
        handleSaveSong={handleSaveSong}
        assigningSetlist={assigningSetlist}
        setAssigningSetlist={setAssigningSetlist}
        concerts={concerts}
        rehearsals={rehearsals}
        selectedConcertToAssign={selectedConcertToAssign}
        setSelectedConcertToAssign={setSelectedConcertToAssign}
        handleAssignSetlistToConcert={handleAssignSetlistToConcert}
        showShowItemModal={showShowItemModal}
        setShowShowItemModal={setShowShowItemModal}
        editingShowItem={editingShowItem}
        setEditingShowItem={setEditingShowItem}
        handleSaveShowItem={handleSaveShowItem}
        showPdfPreview={showPdfPreview}
        setShowPdfPreview={setShowPdfPreview}
        bandLogoUrl={bandLogoUrl}
        activeSetlist={activeSetlist}
        activeSetlistMetrics={activeSetlistMetrics}
        songs={songs}
        bName={bName}
        handleUpdateSongFromStudio={handleUpdateSongFromStudio}
        activeStudioSong={activeStudioSong}
        setActiveStudioSong={setActiveStudioSong}
        activeStudioOpenIris={activeStudioOpenIris}
        setActiveStudioOpenIris={setActiveStudioOpenIris}
        currentUser={currentUser}
        assignSongsModalData={assignSongsModalData}
        setAssignSongsModalData={setAssignSongsModalData}
        handleSaveAlbumSongs={handleSaveAlbumSongs}
        setlistModalData={setlistModalData}
        setSetlistModalData={setSetlistModalData}
        handleSaveSetlistModal={handleSaveSetlistModal}
        isAddSongsModalOpen={isAddSongsModalOpen}
        setIsAddSongsModalOpen={setIsAddSongsModalOpen}
        handleAddMultipleSongsToSetlist={handleAddMultipleSongsToSetlist}
        activeMemberNotesSong={activeMemberNotesSong}
        setActiveMemberNotesSong={setActiveMemberNotesSong}
        activeChordsSong={activeChordsSong}
        setActiveChordsSong={setActiveChordsSong}
        handleUpdateSongFromChords={handleUpdateSongFromChords}
        confirmDeleteModal={confirmDeleteModal}
        setConfirmDeleteModal={setConfirmDeleteModal}
        deleteAlbumData={deleteAlbumData}
        setDeleteAlbumData={setDeleteAlbumData}
        handleUnassignAlbumSongs={handleUnassignAlbumSongs}
        handleDeleteAlbumAndSongs={handleDeleteAlbumAndSongs}
        shareModalData={shareModalData}
        setShareModalData={setShareModalData}
        isSpotifyModalOpen={isSpotifyModalOpen}
        setIsSpotifyModalOpen={setIsSpotifyModalOpen}
        setSongs={setSongs}
        statusBanner={statusBanner}
        showAIAnalysisModal={showAIAnalysisModal}
        setShowAIAnalysisModal={setShowAIAnalysisModal}
        setHighlightedSongIds={setHighlightedSongIds}
        highlightedSongIds={highlightedSongIds}
        aiAnalysisResult={aiAnalysisResult}
        setAiAnalysisResult={setAiAnalysisResult}
        setAiAnalysisLoading={setAiAnalysisLoading}
        chartData={chartData}
        yDomain={yDomain}
        zonasEnergia={ZONAS_ENERGIA}
        energyAnalysis={energyAnalysis}
        reorderSetlistItems={reorderSetlistItems}
        handleEnergyChartDrag={handleEnergyChartDrag}
        canUndoReorder={canUndoReorder}
        undoLastReorder={undoLastReorder}
        undoSourceKey={undoSourceKey}
        showPerfectSetlistModal={showPerfectSetlistModal}
        setShowPerfectSetlistModal={setShowPerfectSetlistModal}
        perfectSetlistLoading={perfectSetlistLoading}
        perfectSetlistPlan={perfectSetlistPlan}
        perfectSetlistError={perfectSetlistError}
        handleGeneratePerfectSetlist={handleGeneratePerfectSetlist}
        applyPerfectSetlistAction={applyPerfectSetlistAction}
        showImportSetlistModal={showImportSetlistModal}
        setShowImportSetlistModal={setShowImportSetlistModal}
        handleSetlistImported={handleSetlistImported}
        performanceSetlistId={performanceSetlistId}
        setPerformanceSetlistId={setPerformanceSetlistId}
        setlists={setlists}
        performanceInitialMode={performanceInitialMode}
        handleOpenStudioModal={handleOpenStudioModal}
        transitionPreviewData={transitionPreviewData}
        setTransitionPreviewData={setTransitionPreviewData}
        handleOpenTransitionPreview={handleOpenTransitionPreview}
        handleAddItemToSetlist={handleAddItemToSetlist}
        isTutorialOpen={isTutorialOpen}
        closeTutorial={closeTutorial}
      />
      </div>
  );
}
