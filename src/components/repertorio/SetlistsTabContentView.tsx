import React from "react";
import { Setlist, Song, SetlistItem, SetlistShortcut } from "../../types";
import { ActiveSetlistHeader } from "./ActiveSetlistHeader";
import { SetlistStatsSummaryBar } from "./SetlistStatsSummaryBar";
import { EnergyMapCard } from "./EnergyMapCard";
import { SetlistAddBar } from "./SetlistAddBar";
import { SetlistItemsList } from "./SetlistItemsList";
import { EnergyChartPoint } from "./EnergyChart";
import { SetlistEnergyAnalysis } from "../../utils/energyPacingUtils";
import { EnergyZone } from "../../hooks/useSetlistEnergyAnalysis";
import { SugerenciaChapa } from "../../utils/setlistCompatibility";

export interface SetlistsTabContentViewProps {
  activeSetlist: Setlist | null;
  songs: Song[];
  sortedSongsByAlbumAndOrder: Song[];
  bandId?: string;
  currentUser?: any;
  setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>;
  activeSetlistMetrics: any;
  energyAnalysis: SetlistEnergyAnalysis;
  chartData: EnergyChartPoint[];
  yDomain: [number, number];
  ZONAS_ENERGIA: EnergyZone[];
  canUndoReorder: boolean;
  undoLastReorder: () => void;
  showEnergyMap: boolean;
  setShowEnergyMap: React.Dispatch<React.SetStateAction<boolean>>;
  showSetlistStats: boolean;
  setShowSetlistStats: React.Dispatch<React.SetStateAction<boolean>>;
  optimizeSetlistTransitions: () => void;
  suggestChapaSpot: () => void;
  showChartSettingsMenu: boolean;
  setShowChartSettingsMenu: React.Dispatch<React.SetStateAction<boolean>>;
  showIdealCurve: boolean;
  setShowIdealCurve: React.Dispatch<React.SetStateAction<boolean>>;
  showBpmLine: boolean;
  setShowBpmLine: React.Dispatch<React.SetStateAction<boolean>>;
  showTonalidad: boolean;
  setShowTonalidad: React.Dispatch<React.SetStateAction<boolean>>;
  chartZoom: boolean;
  setChartZoom: React.Dispatch<React.SetStateAction<boolean>>;
  showTransitionBadges: boolean;
  setShowTransitionBadges: React.Dispatch<React.SetStateAction<boolean>>;
  showConcertPlayer: boolean;
  setShowConcertPlayer: React.Dispatch<React.SetStateAction<boolean>>;
  optimizeSummary: string | null;
  chapaSuggestion: SugerenciaChapa | null;
  setChapaSuggestion: (val: SugerenciaChapa | null) => void;
  insertSuggestedChapa: () => void;
  highlightedSongIds: string[];
  setHighlightedSongIds: (ids: string[]) => void;
  selectedSetlistItemId: string | null;
  setSelectedSetlistItemId: (id: string | null) => void;
  playerCurrentSong?: Song | null;
  handleOpenTransitionPreview: (idxA: number, idxB: number) => void;
  reorderSetlistItems: (from: number, to: number, sourceKey?: string) => void;
  handleEnergyChartDrag: (point: EnergyChartPoint, newScore: number) => void;
  showHeuristicWarnings: boolean;
  setShowHeuristicWarnings: React.Dispatch<React.SetStateAction<boolean>>;
  aiAnalysisResult: any;
  setShowAIAnalysisModal: (val: boolean) => void;
  titlesMatch: (title: string, list: string[]) => boolean;
  handleAddItemToSetlist: (...args: any[]) => void;
  setIsAddSongsModalOpen: (val: boolean) => void;
  setEditingShowItem: (item: SetlistItem | null) => void;
  setShowShowItemModal: (val: boolean) => void;
  customShortcuts: SetlistShortcut[];
  handleUseCustomShortcut: (sc: SetlistShortcut) => void;
  handleDeleteShortcut: (id: string) => void;
  isAddingShortcut: boolean;
  setIsAddingShortcut: (val: boolean) => void;
  newShortcutIcon: string;
  setNewShortcutIcon: (val: string) => void;
  newShortcutLabel: string;
  setNewShortcutLabel: (val: string) => void;
  newShortcutMinutes: number;
  setNewShortcutMinutes: (val: number) => void;
  handleCreateShortcut: () => void;
  expandedSetlistItemIds: Set<string>;
  setExpandedSetlistItemIds: (ids: Set<string>) => void;
  draggedItemIndex: number | null;
  setDraggedItemIndex: (val: number | null) => void;
  dragOverItemIndex: number | null;
  setDragOverItemIndex: (val: number | null) => void;
  handleDropItem: (targetIndex: number) => void;
  activePlayerSong: Song | null;
  isPlayerPlaying: boolean;
  selectPlayerSongWithQueue: (song: Song, autoPlay?: boolean, queue?: Song[] | null) => void;
  editingKeyItemId: string | null;
  setEditingKeyItemId: (id: string | null) => void;
  keyPopoverPos: any;
  setKeyPopoverPos: (pos: any) => void;
  handleSetTonalidadDeseada: (itemId: string, tonalidad: string) => void;
  editingEnergyItemId: string | null;
  setEditingEnergyItemId: (id: string | null) => void;
  energyPopoverPos: any;
  setEnergyPopoverPos: (pos: any) => void;
  savingEnergyItemId: string | null;
  handleSetEnergiaManual: (song: Song, itemId: string, val: number) => void;
  handleRemoveSetlistItem: (itemId: string) => void;
  handleUpdateItemNote: (itemId: string, note: string) => void;
  setEditingSong: (song: Song | null) => void;
  setShowSongModal: (val: boolean) => void;
  handleOpenStudioModal: (song: Song, opts?: any) => void;
  setActiveMemberNotesSong: (song: Song | null) => void;
  setActiveChordsSong: (song: Song | null) => void;
  handleUpdateSongFromStudio: (song: Song) => void;
  cacheActiveStageSetlist: (setlist: Setlist, songs: Song[], bandId?: string) => void;
  setPerformanceInitialMode: (mode: "directo" | "ensayo") => void;
  setPerformanceSetlistId: (id: string) => void;
  setPerfectSetlistPlan: (plan: any) => void;
  setPerfectSetlistError: (err: any) => void;
  setShowPerfectSetlistModal: (val: boolean) => void;
  setShowPdfPreview: (val: boolean) => void;
  handleShareSetlist: (setlist: Setlist | null) => void;
  setAssigningSetlist: (setlist: Setlist | null) => void;
  handleDuplicateSetlist: (setlist: Setlist) => void;
  setShowImportSetlistModal: (val: boolean) => void;
  setSetlistModalData: (data: any) => void;
  handleDeleteSetlist: (id: string) => void;
  transparentDragImage?: HTMLImageElement | null;
}

/**
 * Componente que desacopla toda la vista y árbol de renderizado del Tab 1 ("Setlists & Directo"),
 * aislando la interacción de cabecera, mapa de energía Recharts, barra de atajos y lista draggable.
 */
export const SetlistsTabContentView: React.FC<SetlistsTabContentViewProps> = ({
  activeSetlist,
  songs,
  sortedSongsByAlbumAndOrder,
  bandId,
  currentUser,
  setSetlists,
  activeSetlistMetrics,
  energyAnalysis,
  chartData,
  yDomain,
  ZONAS_ENERGIA,
  canUndoReorder,
  undoLastReorder,
  showEnergyMap,
  setShowEnergyMap,
  showSetlistStats,
  setShowSetlistStats,
  optimizeSetlistTransitions,
  suggestChapaSpot,
  showChartSettingsMenu,
  setShowChartSettingsMenu,
  showIdealCurve,
  setShowIdealCurve,
  showBpmLine,
  setShowBpmLine,
  showTonalidad,
  setShowTonalidad,
  chartZoom,
  setChartZoom,
  showTransitionBadges,
  setShowTransitionBadges,
  showConcertPlayer,
  setShowConcertPlayer,
  optimizeSummary,
  chapaSuggestion,
  setChapaSuggestion,
  insertSuggestedChapa,
  highlightedSongIds,
  setHighlightedSongIds,
  selectedSetlistItemId,
  setSelectedSetlistItemId,
  playerCurrentSong,
  handleOpenTransitionPreview,
  reorderSetlistItems,
  handleEnergyChartDrag,
  showHeuristicWarnings,
  setShowHeuristicWarnings,
  aiAnalysisResult,
  setShowAIAnalysisModal,
  titlesMatch,
  handleAddItemToSetlist,
  setIsAddSongsModalOpen,
  setEditingShowItem,
  setShowShowItemModal,
  customShortcuts,
  handleUseCustomShortcut,
  handleDeleteShortcut,
  isAddingShortcut,
  setIsAddingShortcut,
  newShortcutIcon,
  setNewShortcutIcon,
  newShortcutLabel,
  setNewShortcutLabel,
  newShortcutMinutes,
  setNewShortcutMinutes,
  handleCreateShortcut,
  expandedSetlistItemIds,
  setExpandedSetlistItemIds,
  draggedItemIndex,
  setDraggedItemIndex,
  dragOverItemIndex,
  setDragOverItemIndex,
  handleDropItem,
  activePlayerSong,
  isPlayerPlaying,
  selectPlayerSongWithQueue,
  editingKeyItemId,
  setEditingKeyItemId,
  keyPopoverPos,
  setKeyPopoverPos,
  handleSetTonalidadDeseada,
  editingEnergyItemId,
  setEditingEnergyItemId,
  energyPopoverPos,
  setEnergyPopoverPos,
  savingEnergyItemId,
  handleSetEnergiaManual,
  handleRemoveSetlistItem,
  handleUpdateItemNote,
  setEditingSong,
  setShowSongModal,
  handleOpenStudioModal,
  setActiveMemberNotesSong,
  setActiveChordsSong,
  handleUpdateSongFromStudio,
  cacheActiveStageSetlist,
  setPerformanceInitialMode,
  setPerformanceSetlistId,
  setPerfectSetlistPlan,
  setPerfectSetlistError,
  setShowPerfectSetlistModal,
  setShowPdfPreview,
  handleShareSetlist,
  setAssigningSetlist,
  handleDuplicateSetlist,
  setShowImportSetlistModal,
  setSetlistModalData,
  handleDeleteSetlist,
  transparentDragImage,
}) => {
  return (
    <div className="w-full">
      {/* MAIN EDITOR FOR ACTIVE SETLIST */}
      <div className="w-full p-3 sm:p-6 rounded-[var(--r-l)] sm:rounded-[var(--r-l)] space-y-2 sm:space-y-4 bg-[var(--surface)] max-lg:sticky max-lg:top-[-0.75rem] max-lg:z-20">
        <ActiveSetlistHeader
          activeSetlist={activeSetlist}
          onUpdateSetlistName={(val) => {
            if (!activeSetlist) return;
            const updatedSetlist = {
              ...activeSetlist,
              nombre: val,
            };
            setSetlists((prev) =>
              prev.map((st) =>
                st.id === activeSetlist.id ? updatedSetlist : st,
              ),
            );
          }}
          onEnterStageMode={() => {
            if (activeSetlist) {
              cacheActiveStageSetlist(activeSetlist, songs, bandId);
              setPerformanceInitialMode("directo");
              setPerformanceSetlistId(activeSetlist.id);
            }
          }}
          onEnterRehearsalMode={() => {
            if (activeSetlist) {
              cacheActiveStageSetlist(activeSetlist, songs, bandId);
              setPerformanceInitialMode("ensayo");
              setPerformanceSetlistId(activeSetlist.id);
            }
          }}
          onOpenAIAnalysis={() => setShowAIAnalysisModal(true)}
          onOpenPerfectSetlist={() => {
            setPerfectSetlistPlan(null);
            setPerfectSetlistError(null);
            setShowPerfectSetlistModal(true);
          }}
          aiAnalysisOverallScore={aiAnalysisResult?.overallScore}
          onPrintSetlist={() => setShowPdfPreview(true)}
          onShareSetlist={() => handleShareSetlist(activeSetlist)}
          onAssignSetlist={() => setAssigningSetlist(activeSetlist)}
          onDuplicateSetlist={() => handleDuplicateSetlist(activeSetlist!)}
          onImportSetlist={() => setShowImportSetlistModal(true)}
          onEditSetlistDetails={() =>
            setSetlistModalData({
              isOpen: true,
              setlistToEdit: activeSetlist,
            })
          }
          onDeleteSetlist={() => {
            if (activeSetlist) handleDeleteSetlist(activeSetlist.id);
          }}
        />
      </div>

      {/* SETLIST VIEW MODES & SUMMARY BAR */}
      <div className="flex flex-col gap-2.5">
        <SetlistStatsSummaryBar
          metrics={activeSetlistMetrics}
          profileLabel={energyAnalysis.profileLabel}
          showStats={showSetlistStats}
          onToggleShowStats={() => setShowSetlistStats((v) => !v)}
        />

        {/* MAPA Y CURVA DE ENERGÍA DEL SHOW */}
        {energyAnalysis.points.length > 0 && (
          <EnergyMapCard
            setlistKey={activeSetlist?.id || "empty"}
            energyAnalysis={energyAnalysis}
            chartData={chartData}
            yDomain={yDomain}
            zonasEnergia={ZONAS_ENERGIA}
            canUndoReorder={canUndoReorder}
            undoLastReorder={undoLastReorder}
            showEnergyMap={showEnergyMap}
            setShowEnergyMap={setShowEnergyMap}
            optimizeSetlistTransitions={optimizeSetlistTransitions}
            suggestChapaSpot={suggestChapaSpot}
            showChartSettingsMenu={showChartSettingsMenu}
            setShowChartSettingsMenu={setShowChartSettingsMenu}
            showIdealCurve={showIdealCurve}
            setShowIdealCurve={setShowIdealCurve}
            showBpmLine={showBpmLine}
            setShowBpmLine={setShowBpmLine}
            showTonalidad={showTonalidad}
            setShowTonalidad={setShowTonalidad}
            chartZoom={chartZoom}
            setChartZoom={setChartZoom}
            showTransitionBadges={showTransitionBadges}
            setShowTransitionBadges={setShowTransitionBadges}
            showConcertPlayer={showConcertPlayer}
            setShowConcertPlayer={setShowConcertPlayer}
            optimizeSummary={optimizeSummary}
            chapaSuggestion={chapaSuggestion}
            setChapaSuggestion={setChapaSuggestion}
            insertSuggestedChapa={insertSuggestedChapa}
            highlightedSongIds={highlightedSongIds}
            setHighlightedSongIds={setHighlightedSongIds}
            selectedSetlistItemId={selectedSetlistItemId}
            setSelectedSetlistItemId={setSelectedSetlistItemId}
            playerCurrentSongId={playerCurrentSong?.id}
            handleOpenTransitionPreview={handleOpenTransitionPreview}
            reorderSetlistItems={reorderSetlistItems}
            handleEnergyChartDrag={handleEnergyChartDrag}
            showHeuristicWarnings={showHeuristicWarnings}
            setShowHeuristicWarnings={setShowHeuristicWarnings}
            aiAnalysisResult={aiAnalysisResult}
            setShowAIAnalysisModal={setShowAIAnalysisModal}
            titlesMatch={titlesMatch}
          />
        )}
      </div>

      {/* ADD ITEMS ACTION BAR (Modular) */}
      <SetlistAddBar
        activeSetlist={activeSetlist}
        songs={songs}
        sortedSongsByAlbumAndOrder={sortedSongsByAlbumAndOrder}
        selectedSetlistItemId={selectedSetlistItemId}
        setSelectedSetlistItemId={setSelectedSetlistItemId}
        handleAddItemToSetlist={handleAddItemToSetlist}
        setIsAddSongsModalOpen={setIsAddSongsModalOpen}
        setEditingShowItem={setEditingShowItem}
        setShowShowItemModal={setShowShowItemModal}
        customShortcuts={customShortcuts}
        handleUseCustomShortcut={handleUseCustomShortcut}
        handleDeleteShortcut={handleDeleteShortcut}
        isAddingShortcut={isAddingShortcut}
        setIsAddingShortcut={setIsAddingShortcut}
        newShortcutIcon={newShortcutIcon}
        setNewShortcutIcon={setNewShortcutIcon}
        newShortcutLabel={newShortcutLabel}
        setNewShortcutLabel={setNewShortcutLabel}
        newShortcutMinutes={newShortcutMinutes}
        setNewShortcutMinutes={setNewShortcutMinutes}
        handleCreateShortcut={handleCreateShortcut}
      />

      {/* ITEMS LIST WITH DRAG & DROP AND SELECTION */}
      {activeSetlist && (
        <SetlistItemsList
          activeSetlist={activeSetlist}
          songs={songs}
          selectedSetlistItemId={selectedSetlistItemId}
          setSelectedSetlistItemId={setSelectedSetlistItemId}
          expandedSetlistItemIds={expandedSetlistItemIds}
          setExpandedSetlistItemIds={setExpandedSetlistItemIds}
          draggedItemIndex={draggedItemIndex}
          setDraggedItemIndex={setDraggedItemIndex}
          dragOverItemIndex={dragOverItemIndex}
          setDragOverItemIndex={setDragOverItemIndex}
          handleDropItem={handleDropItem}
          activePlayerSong={activePlayerSong}
          isPlayerPlaying={isPlayerPlaying}
          selectPlayerSongWithQueue={selectPlayerSongWithQueue}
          editingKeyItemId={editingKeyItemId}
          setEditingKeyItemId={setEditingKeyItemId}
          keyPopoverPos={keyPopoverPos}
          setKeyPopoverPos={setKeyPopoverPos}
          handleSetTonalidadDeseada={handleSetTonalidadDeseada}
          editingEnergyItemId={editingEnergyItemId}
          setEditingEnergyItemId={setEditingEnergyItemId}
          energyPopoverPos={energyPopoverPos}
          setEnergyPopoverPos={setEnergyPopoverPos}
          savingEnergyItemId={savingEnergyItemId}
          handleSetEnergiaManual={handleSetEnergiaManual}
          handleOpenTransitionPreview={handleOpenTransitionPreview}
          handleRemoveSetlistItem={handleRemoveSetlistItem}
          handleUpdateItemNote={handleUpdateItemNote}
          onEditSong={(song) => {
            setEditingSong(song);
            setShowSongModal(true);
          }}
          onOpenStudio={(song) => handleOpenStudioModal(song)}
          onOpenMemberNotes={(song) => setActiveMemberNotesSong(song)}
          onOpenChords={(song) => setActiveChordsSong(song)}
          currentUser={currentUser}
          handleUpdateSongFromStudio={handleUpdateSongFromStudio}
          onUpdateShowItemTitle={(itemId, val) => {
            setSetlists((prev) =>
              prev.map((s) =>
                s.id === activeSetlist.id
                  ? {
                      ...s,
                      items: s.items.map((x) =>
                        x.id === itemId ? { ...x, tituloCustom: val } : x,
                      ),
                    }
                  : s,
              ),
            );
          }}
          onEditShowItem={(it) => {
            setEditingShowItem(it);
            setShowShowItemModal(true);
          }}
          transparentDragImage={transparentDragImage}
        />
      )}
    </div>
  );
};
