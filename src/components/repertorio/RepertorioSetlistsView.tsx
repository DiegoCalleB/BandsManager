import type { RepertorioTab } from "../../hooks/useRepertorioTabs";
import type { User } from "../../types";
import type { SetlistEnergyAnalysis } from "../../utils/energyPacingUtils";
import type { Analysis } from "./SetlistAIAnalysisModal";
import type { AddableItemKind } from "./setlistItemKind";
/**
 * Vista de setlists: editor del setlist activo, mapa de energía, barra de añadir y lista de items.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
 
import { Dispatch,SetStateAction } from "react";
import { TRANSPARENT_DRAG_IMAGE } from "../../config/defaultRepertoire";
import { Setlist,SetlistItem,SetlistShortcut,Song } from "../../types";
import { EvaluacionUnion,SugerenciaChapa } from "../../utils/setlistCompatibility";
import { titlesMatch } from "../../utils/songTitleMatch";
import { cacheActiveStageSetlist } from "../../utils/stageOfflineCache";
import { ActiveSetlistHeader } from "./ActiveSetlistHeader";
import { EnergyChartPoint } from "./EnergyChart";
import { EnergyMapCard } from "./EnergyMapCard";
import { PerfectSetlistPlan } from "./PerfectSetlistModal";
import { SetlistAddBar } from "./SetlistAddBar";
import { SetlistItemsList } from "./SetlistItemsList";
import { SetlistStatsSummaryBar } from "./SetlistStatsSummaryBar";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface RepertorioSetlistsViewProps {
  activeTab: RepertorioTab;
  activeSetlist: Setlist;
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  songs: Song[];
  bandId: string;
  setPerformanceInitialMode: Dispatch<SetStateAction<"directo" | "ensayo">>;
  setPerformanceSetlistId: Dispatch<SetStateAction<string>>;
  setShowAIAnalysisModal: Dispatch<SetStateAction<boolean>>;
  setPerfectSetlistPlan: Dispatch<SetStateAction<PerfectSetlistPlan>>;
  setPerfectSetlistError: Dispatch<SetStateAction<string>>;
  setShowPerfectSetlistModal: Dispatch<SetStateAction<boolean>>;
  aiAnalysisResult: Analysis | null;
  setShowPdfPreview: Dispatch<SetStateAction<boolean>>;
  handleShareSetlist: (setlist: Setlist) => void;
  setAssigningSetlist: Dispatch<SetStateAction<Setlist>>;
  handleDuplicateSetlist: (st: Setlist, nameSuffix?: string) => Setlist;
  setShowImportSetlistModal: Dispatch<SetStateAction<boolean>>;
  setSetlistModalData: Dispatch<SetStateAction<{ isOpen: boolean; setlistToEdit: Setlist; }>>;
  handleDeleteSetlist: (stId: string) => void;
  activeSetlistMetrics: { totalSeconds: number; formattedTime: string; songCount: number; eventCount: number; blockCount: number; avgBpm: number; };
  energyAnalysis: SetlistEnergyAnalysis;
  showSetlistStats: boolean;
  setShowSetlistStats: Dispatch<SetStateAction<boolean>>;
  chartData: { idx: number; xPos: number; id: string; songId: string; name: string; score: number; idealScore: number; range: [number, number]; color: string; icon: string; label: string; variance: number; isSong: boolean; isSpeechEvent: boolean; bpm: number; harmonyClash: boolean; tonalidad: string; transitionToNext: EvaluacionUnion; transitionFromPrev: EvaluacionUnion; }[];
  yDomain: [number, number];
  ZONAS_ENERGIA: { y1: number; y2: number; min: number; max: number; color: string; }[];
  canUndoReorder: boolean;
  undoLastReorder: () => void;
  showEnergyMap: boolean;
  setShowEnergyMap: Dispatch<SetStateAction<boolean>>;
  optimizeSetlistTransitions: () => void;
  suggestChapaSpot: () => void;
  showChartSettingsMenu: boolean;
  setShowChartSettingsMenu: Dispatch<SetStateAction<boolean>>;
  showIdealCurve: boolean;
  setShowIdealCurve: Dispatch<SetStateAction<boolean>>;
  showBpmLine: boolean;
  setShowBpmLine: Dispatch<SetStateAction<boolean>>;
  showTonalidad: boolean;
  setShowTonalidad: Dispatch<SetStateAction<boolean>>;
  chartZoom: boolean;
  setChartZoom: Dispatch<SetStateAction<boolean>>;
  showTransitionBadges: boolean;
  setShowTransitionBadges: Dispatch<SetStateAction<boolean>>;
  showConcertPlayer: boolean;
  setShowConcertPlayer: Dispatch<SetStateAction<boolean>>;
  optimizeSummary: string;
  chapaSuggestion: SugerenciaChapa;
  setChapaSuggestion: Dispatch<SetStateAction<SugerenciaChapa>>;
  insertSuggestedChapa: () => void;
  highlightedSongIds: string[];
  setHighlightedSongIds: Dispatch<SetStateAction<string[]>>;
  selectedSetlistItemId: string;
  setSelectedSetlistItemId: Dispatch<SetStateAction<string>>;
  playerCurrentSong: Song;
  handleOpenTransitionPreview: (idxA: number, idxB: number) => void;
  reorderSetlistItems: (fromIndex: number, toIndex: number, sourceKey?: string) => void;
  handleEnergyChartDrag: (point: EnergyChartPoint, newScore: number) => void;
  showHeuristicWarnings: boolean;
  setShowHeuristicWarnings: Dispatch<SetStateAction<boolean>>;
  sortedSongsByAlbumAndOrder: Song[];
  handleAddItemToSetlist: (songId?: string, tipoItem?: AddableItemKind, tituloCustom?: string, duracionEstimadaMinutos?: number, duracionEstimadaSegundos?: number, notaTema?: string, insertAfterId?: string) => void;
  setIsAddSongsModalOpen: Dispatch<SetStateAction<boolean>>;
  setEditingShowItem: Dispatch<SetStateAction<SetlistItem>>;
  setShowShowItemModal: Dispatch<SetStateAction<boolean>>;
  customShortcuts: SetlistShortcut[];
  handleUseCustomShortcut: (sc: SetlistShortcut) => void;
  handleDeleteShortcut: (id: string) => Promise<void>;
  isAddingShortcut: boolean;
  setIsAddingShortcut: Dispatch<SetStateAction<boolean>>;
  newShortcutIcon: string;
  setNewShortcutIcon: Dispatch<SetStateAction<string>>;
  newShortcutLabel: string;
  setNewShortcutLabel: Dispatch<SetStateAction<string>>;
  newShortcutMinutes: number;
  setNewShortcutMinutes: Dispatch<SetStateAction<number>>;
  handleCreateShortcut: () => Promise<void>;
  expandedSetlistItemIds: Set<string>;
  setExpandedSetlistItemIds: Dispatch<SetStateAction<Set<string>>>;
  draggedItemIndex: number;
  setDraggedItemIndex: Dispatch<SetStateAction<number>>;
  dragOverItemIndex: number;
  setDragOverItemIndex: Dispatch<SetStateAction<number>>;
  handleDropItem: (targetIndex: number) => void;
  activePlayerSong: Song;
  isPlayerPlaying: boolean;
  selectPlayerSongWithQueue: (song: Song, autoPlay?: boolean, queue?: Song[], transposeSemitones?: number) => void;
  editingKeyItemId: string;
  setEditingKeyItemId: Dispatch<SetStateAction<string>>;
  keyPopoverPos: { top: number; left: number; };
  setKeyPopoverPos: Dispatch<SetStateAction<{ top: number; left: number; }>>;
  handleSetTonalidadDeseada: (itemId: string, tonalidad: string) => void;
  editingEnergyItemId: string;
  setEditingEnergyItemId: Dispatch<SetStateAction<string>>;
  energyPopoverPos: { top: number; left: number; openUpward: boolean; };
  setEnergyPopoverPos: Dispatch<SetStateAction<{ top: number; left: number; openUpward: boolean; }>>;
  savingEnergyItemId: string;
  handleSetEnergiaManual: (song: Song, itemId: string, valor1a10: number) => Promise<void>;
  handleRemoveSetlistItem: (itemId: string) => void;
  handleUpdateItemNote: (itemId: string, note: string) => void;
  setEditingSong: Dispatch<SetStateAction<Song>>;
  setShowSongModal: Dispatch<SetStateAction<boolean>>;
  handleOpenStudioModal: (song: Song, opts?: { openIris?: boolean; }) => void;
  setActiveMemberNotesSong: Dispatch<SetStateAction<Song>>;
  setActiveChordsSong: Dispatch<SetStateAction<Song>>;
  currentUser: User | undefined;
  handleUpdateSongFromStudio: (updatedSong: Song) => void;
}

/**
 * Vista de setlists: editor del setlist activo, mapa de energía, barra de añadir y lista de items.
 * @param props Estado y callbacks del contenedor ({@link RepertorioSetlistsViewProps}).
 * @returns Sección de interfaz.
 */
export function RepertorioSetlistsView({ activeTab, activeSetlist, setSetlists, songs, bandId, setPerformanceInitialMode, setPerformanceSetlistId, setShowAIAnalysisModal, setPerfectSetlistPlan, setPerfectSetlistError, setShowPerfectSetlistModal, aiAnalysisResult, setShowPdfPreview, handleShareSetlist, setAssigningSetlist, handleDuplicateSetlist, setShowImportSetlistModal, setSetlistModalData, handleDeleteSetlist, activeSetlistMetrics, energyAnalysis, showSetlistStats, setShowSetlistStats, chartData, yDomain, ZONAS_ENERGIA, canUndoReorder, undoLastReorder, showEnergyMap, setShowEnergyMap, optimizeSetlistTransitions, suggestChapaSpot, showChartSettingsMenu, setShowChartSettingsMenu, showIdealCurve, setShowIdealCurve, showBpmLine, setShowBpmLine, showTonalidad, setShowTonalidad, chartZoom, setChartZoom, showTransitionBadges, setShowTransitionBadges, showConcertPlayer, setShowConcertPlayer, optimizeSummary, chapaSuggestion, setChapaSuggestion, insertSuggestedChapa, highlightedSongIds, setHighlightedSongIds, selectedSetlistItemId, setSelectedSetlistItemId, playerCurrentSong, handleOpenTransitionPreview, reorderSetlistItems, handleEnergyChartDrag, showHeuristicWarnings, setShowHeuristicWarnings, sortedSongsByAlbumAndOrder, handleAddItemToSetlist, setIsAddSongsModalOpen, setEditingShowItem, setShowShowItemModal, customShortcuts, handleUseCustomShortcut, handleDeleteShortcut, isAddingShortcut, setIsAddingShortcut, newShortcutIcon, setNewShortcutIcon, newShortcutLabel, setNewShortcutLabel, newShortcutMinutes, setNewShortcutMinutes, handleCreateShortcut, expandedSetlistItemIds, setExpandedSetlistItemIds, draggedItemIndex, setDraggedItemIndex, dragOverItemIndex, setDragOverItemIndex, handleDropItem, activePlayerSong, isPlayerPlaying, selectPlayerSongWithQueue, editingKeyItemId, setEditingKeyItemId, keyPopoverPos, setKeyPopoverPos, handleSetTonalidadDeseada, editingEnergyItemId, setEditingEnergyItemId, energyPopoverPos, setEnergyPopoverPos, savingEnergyItemId, handleSetEnergiaManual, handleRemoveSetlistItem, handleUpdateItemNote, setEditingSong, setShowSongModal, handleOpenStudioModal, setActiveMemberNotesSong, setActiveChordsSong, currentUser, handleUpdateSongFromStudio }: RepertorioSetlistsViewProps) {
  return (
    <>
{/* VIEW 1: SETLISTS & REPERTORIOS DE DIRECTO */}
      {activeTab === "setlists" && (
        <div className="w-full">
          {/* MAIN EDITOR FOR ACTIVE SETLIST */}
          <div
            className="w-full p-3 sm:p-6 rounded-[var(--r-l)] sm:rounded-[var(--r-l)] space-y-2 sm:space-y-4 bg-[var(--surface)] max-lg:sticky max-lg:top-[-0.75rem] max-lg:z-20"
          >
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
              onDuplicateSetlist={() => handleDuplicateSetlist(activeSetlist)}
              onImportSetlist={() => setShowImportSetlistModal(true)}
              onEditSetlistDetails={() =>
                setSetlistModalData({
                  isOpen: true,
                  setlistToEdit: activeSetlist,
                })
              }
              onDeleteSetlist={() => handleDeleteSetlist(activeSetlist.id)}
            />
          </div>

          {/* SETLIST VIEW MODES & SUMMARY BAR */}
          {(() => {
            return (
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
                    setlistKey={activeSetlist.id}
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
            );
          })()}

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
            transparentDragImage={TRANSPARENT_DRAG_IMAGE}
          />
        </div>
      )}
    </>
  );
}
