import React from "react";
import {
  Concert,
  Rehearsal,
  Setlist,
  SetlistItem,
  Song,
} from "../../types";
import { SongModal } from "./SongModal";
import { BandMemberOption } from "../../utils/repertorioUtils";
import { AssignSetlistModal } from "./AssignSetlistModal";
import { ShowItemModal } from "./ShowItemModal";
import { PdfExportModal } from "./PdfExportModal";
import SongStudioModal from "../SongStudioModal";
import { AssignSongsToAlbumModal } from "./AssignSongsToAlbumModal";
import { SetlistModal } from "./SetlistModal";
import { AddSongsToSetlistModal } from "./AddSongsToSetlistModal";
import { MemberNotesModal } from "./MemberNotesModal";
import { Atril } from "../Atril";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ConfirmDeleteAlbumModal } from "./ConfirmDeleteAlbumModal";
import { ShareModal } from "../ShareModal";
import { SpotifyDiscographyModal } from "./SpotifyDiscographyModal";
import { SetlistAIAnalysisModal } from "./SetlistAIAnalysisModal";
import { PerfectSetlistModal } from "./PerfectSetlistModal";
import { ImportSetlistModal } from "./ImportSetlistModal";
import { SetlistPerformanceView } from "../SetlistPerformanceView";
import { SongTransitionPreviewModal } from "./SongTransitionPreviewModal";
import { ModuleTutorialModal } from "../common/ModuleTutorialModal";

export interface RepertorioModalsContainerProps {
  // SongModal
  showSongModal: boolean;
  setShowSongModal: (show: boolean) => void;
  editingSong: Song | null;
  bandRosterMembers: BandMemberOption[];
  defaultAlbumForNewSong: string;
  albumsList: string[];
  colors: any;
  handleSaveSong: (e: React.FormEvent<HTMLFormElement>) => void;

  // AssignSetlistModal
  assigningSetlist: Setlist | null;
  setAssigningSetlist: (s: Setlist | null) => void;
  concerts: Concert[];
  rehearsals: Rehearsal[];
  selectedConcertToAssign: string;
  setSelectedConcertToAssign: (id: string) => void;
  handleAssignSetlistToConcert: () => void;

  // ShowItemModal
  showShowItemModal: boolean;
  setShowShowItemModal: (show: boolean) => void;
  editingShowItem: any;
  setEditingShowItem: (it: any) => void;
  handleSaveShowItem: (itemData: Partial<SetlistItem>) => void;

  // PdfExportModal
  showPdfPreview: boolean;
  setShowPdfPreview: (show: boolean) => void;
  bandLogoUrl?: string;
  activeSetlist: Setlist | null;
  activeSetlistMetrics: any;
  songs: Song[];
  bName: string;
  handleUpdateSongFromStudio: (song: Song) => void;

  // SongStudioModal
  activeStudioSong: Song | null;
  setActiveStudioSong: (s: Song | null) => void;
  activeStudioOpenIris: boolean;
  setActiveStudioOpenIris: (open: boolean) => void;
  currentUser: any;

  // AssignSongsToAlbumModal
  assignSongsModalData: { isOpen: boolean; albumName: string } | null;
  setAssignSongsModalData: (data: { isOpen: boolean; albumName: string } | null) => void;
  handleSaveAlbumSongs: (albumName: string, selectedSongIds: string[]) => void;

  // SetlistModal
  setlistModalData: any;
  setSetlistModalData: (data: any) => void;
  handleSaveSetlistModal: (data: Partial<Setlist>) => void;

  // AddSongsToSetlistModal
  isAddSongsModalOpen: boolean;
  setIsAddSongsModalOpen: (open: boolean) => void;
  handleAddMultipleSongsToSetlist: (songIds: string[]) => void;

  // MemberNotesModal
  activeMemberNotesSong: Song | null;
  setActiveMemberNotesSong: (s: Song | null) => void;

  // Atril
  activeChordsSong: Song | null;
  setActiveChordsSong: (s: Song | null) => void;
  handleUpdateSongFromChords: (s: Song) => void;

  // ConfirmDeleteModal
  confirmDeleteModal: any;
  setConfirmDeleteModal: (data: any) => void;

  // ConfirmDeleteAlbumModal
  deleteAlbumData: any;
  setDeleteAlbumData: (data: any) => void;
  handleUnassignAlbumSongs: (albumName: string) => void;
  handleDeleteAlbumAndSongs: (albumName: string) => void;

  // ShareModal
  shareModalData: any;
  setShareModalData: React.Dispatch<React.SetStateAction<any>>;

  // SpotifyDiscographyModal
  isSpotifyModalOpen: boolean;
  setIsSpotifyModalOpen: (open: boolean) => void;
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;

  // StatusBanner
  statusBanner: { text: string; type: "success" | "error" | "warning" | "loading" } | null;

  // SetlistAIAnalysisModal
  showAIAnalysisModal: boolean;
  setShowAIAnalysisModal: (show: boolean) => void;
  setHighlightedSongIds: (ids: string[]) => void;
  highlightedSongIds: string[];
  aiAnalysisResult: any;
  setAiAnalysisResult: (res: any) => void;
  setAiAnalysisLoading: (loading: boolean) => void;
  chartData: any;
  yDomain: any;
  zonasEnergia: any;
  energyAnalysis: any;
  reorderSetlistItems: (idxA: number, idxB: number) => void;
  handleEnergyChartDrag: (point: any, newScore: number) => void;
  canUndoReorder: boolean;
  undoLastReorder: () => void;
  undoSourceKey: string | null;

  // PerfectSetlistModal
  showPerfectSetlistModal: boolean;
  setShowPerfectSetlistModal: (show: boolean) => void;
  perfectSetlistLoading: boolean;
  perfectSetlistPlan: any;
  perfectSetlistError: string | null;
  handleGeneratePerfectSetlist: () => void;
  applyPerfectSetlistAction: (action: any, sourceKey?: string) => void;

  // ImportSetlistModal
  showImportSetlistModal: boolean;
  setShowImportSetlistModal: (show: boolean) => void;
  handleSetlistImported: (setlist: Setlist, newSongs?: Song[]) => void;

  // SetlistPerformanceView
  performanceSetlistId: string | null;
  setPerformanceSetlistId: (id: string | null) => void;
  setlists: Setlist[];
  performanceInitialMode: "directo" | "ensayo";
  handleOpenStudioModal: (song: Song) => void;

  // SongTransitionPreviewModal
  transitionPreviewData: any;
  setTransitionPreviewData: React.Dispatch<React.SetStateAction<any>>;
  handleOpenTransitionPreview: (idxA: number, idxB: number) => void;
  handleAddItemToSetlist: (
    songId?: string,
    tipoItem?: any,
    customTitle?: string,
    duracionMin?: number,
    duracionSeg?: number,
    customNote?: string,
    targetPositionItemId?: string,
  ) => void;

  // ModuleTutorialModal
  isTutorialOpen: boolean;
  closeTutorial: () => void;
}

/**
 * Contenedor desacoplado de todos los modales auxiliares de la vista de Repertorio.
 * Descongestiona el componente principal agrupando la renderización condicional de diálogos.
 */
export const RepertorioModalsContainer: React.FC<RepertorioModalsContainerProps> = ({
  showSongModal,
  setShowSongModal,
  editingSong,
  bandRosterMembers,
  defaultAlbumForNewSong,
  albumsList,
  colors,
  handleSaveSong,
  assigningSetlist,
  setAssigningSetlist,
  concerts,
  rehearsals,
  selectedConcertToAssign,
  setSelectedConcertToAssign,
  handleAssignSetlistToConcert,
  showShowItemModal,
  setShowShowItemModal,
  editingShowItem,
  setEditingShowItem,
  handleSaveShowItem,
  showPdfPreview,
  setShowPdfPreview,
  bandLogoUrl,
  activeSetlist,
  activeSetlistMetrics,
  songs,
  bName,
  handleUpdateSongFromStudio,
  activeStudioSong,
  setActiveStudioSong,
  activeStudioOpenIris,
  setActiveStudioOpenIris,
  currentUser,
  assignSongsModalData,
  setAssignSongsModalData,
  handleSaveAlbumSongs,
  setlistModalData,
  setSetlistModalData,
  handleSaveSetlistModal,
  isAddSongsModalOpen,
  setIsAddSongsModalOpen,
  handleAddMultipleSongsToSetlist,
  activeMemberNotesSong,
  setActiveMemberNotesSong,
  activeChordsSong,
  setActiveChordsSong,
  handleUpdateSongFromChords,
  confirmDeleteModal,
  setConfirmDeleteModal,
  deleteAlbumData,
  setDeleteAlbumData,
  handleUnassignAlbumSongs,
  handleDeleteAlbumAndSongs,
  shareModalData,
  setShareModalData,
  isSpotifyModalOpen,
  setIsSpotifyModalOpen,
  setSongs,
  statusBanner,
  showAIAnalysisModal,
  setShowAIAnalysisModal,
  setHighlightedSongIds,
  highlightedSongIds,
  aiAnalysisResult,
  setAiAnalysisResult,
  setAiAnalysisLoading,
  chartData,
  yDomain,
  zonasEnergia,
  energyAnalysis,
  reorderSetlistItems,
  handleEnergyChartDrag,
  canUndoReorder,
  undoLastReorder,
  undoSourceKey,
  showPerfectSetlistModal,
  setShowPerfectSetlistModal,
  perfectSetlistLoading,
  perfectSetlistPlan,
  perfectSetlistError,
  handleGeneratePerfectSetlist,
  applyPerfectSetlistAction,
  showImportSetlistModal,
  setShowImportSetlistModal,
  handleSetlistImported,
  performanceSetlistId,
  setPerformanceSetlistId,
  setlists,
  performanceInitialMode,
  handleOpenStudioModal,
  transitionPreviewData,
  setTransitionPreviewData,
  handleOpenTransitionPreview,
  handleAddItemToSetlist,
  isTutorialOpen,
  closeTutorial,
}) => {
  return (
    <>
      {/* MODAL: ADD / EDIT SONG */}
      <SongModal
        key={showSongModal ? editingSong?.id || "new-song" : "closed"}
        isOpen={showSongModal}
        bandMembers={bandRosterMembers}
        editingSong={editingSong}
        defaultAlbumForNewSong={defaultAlbumForNewSong}
        albumsList={albumsList}
        colors={colors}
        onClose={() => setShowSongModal(false)}
        onSave={handleSaveSong}
      />

      {/* MODAL: ASSIGN SETLIST TO CONCERT OR REHEARSAL */}
      <AssignSetlistModal
        assigningSetlist={assigningSetlist}
        colors={colors}
        concerts={concerts}
        rehearsals={rehearsals}
        selectedConcertToAssign={selectedConcertToAssign}
        onSelectEvent={(id) => setSelectedConcertToAssign(id)}
        onClose={() => setAssigningSetlist(null)}
        onSave={handleAssignSetlistToConcert}
      />

      {/* MODAL: ADD OR EDIT NON-SONG SHOW ITEM OR BLOCK */}
      <ShowItemModal
        isOpen={showShowItemModal}
        onClose={() => setShowShowItemModal(false)}
        colors={colors}
        editingShowItem={editingShowItem}
        setEditingShowItem={setEditingShowItem}
        handleSaveShowItem={handleSaveShowItem}
      />

      {/* PDF Preview Modal */}
      <PdfExportModal
        bandMembers={bandRosterMembers}
        bandLogoUrl={bandLogoUrl || ""}
        isOpen={showPdfPreview}
        activeSetlist={activeSetlist}
        activeSetlistMetrics={activeSetlistMetrics}
        songs={songs}
        onClose={() => setShowPdfPreview(false)}
        bandName={bName}
        onUpdateSong={handleUpdateSongFromStudio}
      />

      {activeStudioSong && (
        <SongStudioModal
          song={activeStudioSong}
          colors={colors}
          onClose={() => {
            setActiveStudioSong(null);
            setActiveStudioOpenIris(false);
          }}
          onUpdateSong={handleUpdateSongFromStudio}
          currentUser={currentUser}
          currentUsername={currentUser?.name || currentUser?.username}
          initialOpenIrisModal={activeStudioOpenIris}
        />
      )}

      {assignSongsModalData && assignSongsModalData.isOpen && (
        <AssignSongsToAlbumModal
          isOpen={assignSongsModalData.isOpen}
          albumName={assignSongsModalData.albumName}
          songs={songs}
          colors={colors}
          onClose={() => setAssignSongsModalData(null)}
          onSaveAlbumSongs={handleSaveAlbumSongs}
        />
      )}

      {setlistModalData && setlistModalData.isOpen && (
        <SetlistModal
          isOpen={setlistModalData.isOpen}
          setlistToEdit={setlistModalData.setlistToEdit}
          colors={colors}
          onClose={() => setSetlistModalData(null)}
          onSave={handleSaveSetlistModal}
        />
      )}

      {isAddSongsModalOpen && activeSetlist && (
        <AddSongsToSetlistModal
          isOpen={isAddSongsModalOpen}
          songs={songs}
          existingSongIds={activeSetlist.items
            .map((it) => it.songId)
            .filter((id): id is string => Boolean(id))}
          colors={colors}
          onClose={() => setIsAddSongsModalOpen(false)}
          onAddSongs={handleAddMultipleSongsToSetlist}
        />
      )}

      {/* MEMBER NOTES MODAL */}
      {activeMemberNotesSong && (
        <MemberNotesModal
          isOpen={Boolean(activeMemberNotesSong)}
          song={activeMemberNotesSong}
          colors={colors}
          bandMembers={bandRosterMembers}
          onClose={() => setActiveMemberNotesSong(null)}
          onSaveSongNotes={handleUpdateSongFromStudio}
        />
      )}

      {/* ATRIL ACORDES */}
      {activeChordsSong && (
        <Atril
          cancion={activeChordsSong}
          modo="Estudiar"
          onClose={() => setActiveChordsSong(null)}
          onUpdateSong={handleUpdateSongFromChords}
        />
      )}

      {/* CONFIRM DELETE MODAL DIALOG */}
      <ConfirmDeleteModal
        data={confirmDeleteModal}
        onClose={() => setConfirmDeleteModal(null)}
      />

      {/* CONFIRM DELETE ALBUM MODAL DIALOG */}
      <ConfirmDeleteAlbumModal
        data={deleteAlbumData}
        onClose={() => setDeleteAlbumData(null)}
        onUnassignSongs={handleUnassignAlbumSongs}
        onDeleteAlbumAndSongs={handleDeleteAlbumAndSongs}
      />

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={shareModalData.isOpen}
        onClose={() =>
          setShareModalData((prev: any) => ({ ...prev, isOpen: false }))
        }
        title={shareModalData.title}
        subtitle={shareModalData.subtitle}
        initialText={shareModalData.text}
        itemType={shareModalData.itemType}
      />

      {/* SPOTIFY DISCOGRAPHY IMPORT MODAL */}
      <SpotifyDiscographyModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        bandName={bName}
        existingSongs={songs}
        colors={colors}
        onSongsImported={(updatedSongs) => {
          setSongs(updatedSongs);
        }}
      />

      {/* STATUS BANNER */}
      {statusBanner && (
        <div
          className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-[var(--r-l)] text-xs font-sans max-w-sm ${
            statusBanner.type === "success"
              ? "bg-[var(--ok-soft)]/60 text-[var(--ok)]"
              : statusBanner.type === "error"
                ? "bg-[var(--alert-soft)]/60 text-[var(--alert)]"
                : statusBanner.type === "warning"
                  ? "bg-[var(--acc-soft)]  text-[var(--acc)]"
                  : "bg-[var(--surface)] text-[var(--ink-2)]"
          }`}
        >
          {statusBanner.type === "loading" && (
            <span className="w-3.5 h-3.5 border-t-[var(--hair)] rounded-[var(--r-pill)] animate-spin shrink-0" />
          )}
          <span>{statusBanner.text}</span>
        </div>
      )}

      {/* AI SETLIST ANALYSIS MODAL */}
      <SetlistAIAnalysisModal
        isOpen={showAIAnalysisModal}
        onClose={() => {
          setShowAIAnalysisModal(false);
          setHighlightedSongIds([]);
        }}
        setlistId={activeSetlist?.id || ""}
        setlistName={activeSetlist?.nombre}
        initialAnalysis={aiAnalysisResult}
        onAnalysisComplete={(analysis) => {
          setAiAnalysisResult(analysis);
          setAiAnalysisLoading(false);
        }}
        onHighlightSongs={setHighlightedSongIds}
        highlightedSongIds={highlightedSongIds}
        chartData={chartData}
        yDomain={yDomain}
        zonasEnergia={zonasEnergia}
        warnings={energyAnalysis?.warnings}
        onReorder={reorderSetlistItems}
        onEnergyChange={handleEnergyChartDrag}
        canUndo={canUndoReorder}
        onUndo={undoLastReorder}
        undoSourceKey={undoSourceKey}
      />

      {/* PERFECT SETLIST PLAN MODAL */}
      <PerfectSetlistModal
        isOpen={showPerfectSetlistModal}
        onClose={() => setShowPerfectSetlistModal(false)}
        setlistName={activeSetlist?.nombre}
        loading={perfectSetlistLoading}
        plan={perfectSetlistPlan}
        error={perfectSetlistError}
        onGenerate={handleGeneratePerfectSetlist}
        onApplyAction={applyPerfectSetlistAction}
        canUndo={canUndoReorder}
        onUndo={undoLastReorder}
        undoSourceKey={undoSourceKey}
        chartData={chartData}
        yDomain={yDomain}
        zonasEnergia={zonasEnergia}
        onReorder={reorderSetlistItems}
        onEnergyChange={handleEnergyChartDrag}
      />

      {/* IMPORT SETLIST FROM PHOTO/PDF MODAL */}
      <ImportSetlistModal
        isOpen={showImportSetlistModal}
        onClose={() => setShowImportSetlistModal(false)}
        catalogSongs={songs}
        onCreated={handleSetlistImported}
      />

      {/* SETLIST PERFORMANCE VIEW (CONCIERTO EN VIVO O MODO ENSAYO) */}
      {performanceSetlistId && (
        <SetlistPerformanceView
          setlist={setlists.find((s) => s.id === performanceSetlistId)!}
          songs={songs}
          initialMode={performanceInitialMode}
          onClose={() => setPerformanceSetlistId(null)}
          onOpenStudioModal={(song) => handleOpenStudioModal(song)}
          onUpdateSong={handleUpdateSongFromStudio}
          currentUser={currentUser}
        />
      )}

      {/* SONG TRANSITION PREVIEW MODAL */}
      {transitionPreviewData?.isOpen &&
        transitionPreviewData.songA &&
        transitionPreviewData.songB && (
          <SongTransitionPreviewModal
            isOpen={transitionPreviewData.isOpen}
            onClose={() => setTransitionPreviewData(null)}
            songA={transitionPreviewData.songA}
            songB={transitionPreviewData.songB}
            itemA={transitionPreviewData.itemA}
            itemB={transitionPreviewData.itemB}
            indexA={transitionPreviewData.indexA}
            indexB={transitionPreviewData.indexB}
            totalItemsCount={activeSetlist?.items?.length || 0}
            onNavigateTransition={(newIdxA, newIdxB) => {
              handleOpenTransitionPreview(newIdxA, newIdxB);
            }}
            onSwapSongs={(idxA, idxB) => {
              reorderSetlistItems(idxA, idxB);
              setTransitionPreviewData((prev: any) =>
                prev
                  ? {
                      ...prev,
                      songA: prev.songB,
                      songB: prev.songA,
                      itemA: prev.itemB,
                      itemB: prev.itemA,
                    }
                  : null,
              );
            }}
            onInsertInterludio={(afterItemId) => {
              handleAddItemToSetlist(
                undefined,
                "chapa",
                "Charla / Interludio",
                1,
                60,
                "Transición hablada para modular tono o descanso",
                afterItemId,
              );
            }}
            onUpdateSong={handleUpdateSongFromStudio}
          />
        )}

      {/* Tutorial Interactivo Paso a Paso */}
      <ModuleTutorialModal
        moduleId="repertorio"
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
      />
    </>
  );
};
