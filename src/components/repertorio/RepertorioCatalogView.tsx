import type { CatalogoViewMode,RepertorioTab } from "../../hooks/useRepertorioTabs";
/**
 * Vista de Discografía y catálogo general de temas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
 
import { Dispatch,SetStateAction } from "react";
import { Setlist,Song,ThemeColors } from "../../types";
import { CatalogoGeneralView } from "./CatalogoGeneralView";
import { ConfirmDeleteAlbumData } from "./ConfirmDeleteAlbumModal";
import { DiscografiaView } from "./DiscografiaView";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface RepertorioCatalogViewProps {
  activeTab: RepertorioTab;
  catalogoViewMode: CatalogoViewMode;
  songs: Song[];
  albumsList: string[];
  colors: ThemeColors;
  bName: string;
  bandLogoUrl: string;
  setSongs: Dispatch<SetStateAction<Song[]>>;
  setSetlists: Dispatch<SetStateAction<Setlist[]>>;
  handleToggleFavorite: (songId: string) => void;
  activePlayerSong: Song;
  isPlayerPlaying: boolean;
  selectPlayerSongWithQueue: (song: Song, autoPlay?: boolean, queue?: Song[], transposeSemitones?: number) => void;
  setDeleteAlbumData: Dispatch<SetStateAction<ConfirmDeleteAlbumData>>;
  setAssignSongsModalData: Dispatch<SetStateAction<{ isOpen: boolean; albumName: string; }>>;
  setActiveMemberNotesSong: Dispatch<SetStateAction<Song>>;
  setActiveChordsSong: Dispatch<SetStateAction<Song>>;
  handleOpenStudioModal: (song: Song, opts?: { openIris?: boolean; }) => void;
  setEditingSong: Dispatch<SetStateAction<Song>>;
  setShowSongModal: Dispatch<SetStateAction<boolean>>;
  handleDeleteSong: (songId: string) => void;
  handleShareSong: (song: Song) => void;
  filteredSongs: Song[];
  catalogAlbumFilter: string;
  setCatalogAlbumFilter: Dispatch<SetStateAction<string>>;
  catalogStatusFilter: string;
  setCatalogStatusFilter: Dispatch<SetStateAction<string>>;
  catalogSearch: string;
  groupByAlbum: boolean;
  setGroupByAlbum: Dispatch<SetStateAction<boolean>>;
  showCatalogActionsMenu: boolean;
  setShowCatalogActionsMenu: Dispatch<SetStateAction<boolean>>;
  handleNormalizeCatalogTitles: () => Promise<void>;
  selectedCatalogIds: Set<string>;
  setSelectedCatalogIds: Dispatch<SetStateAction<Set<string>>>;
  clearCatalogSelection: () => void;
  toggleCatalogSelect: (songId: string) => void;
  handleBulkAddSelectedToSetlist: (songIds: string[]) => void;
  handleBulkDeleteSongs: (songIds: string[]) => void;
  handleUpdateSongFromStudio: (updatedSong: Song) => void;
  draggedCatalogSongId: string;
  setDraggedCatalogSongId: Dispatch<SetStateAction<string>>;
  dragOverCatalogSongId: string;
  setDragOverCatalogSongId: Dispatch<SetStateAction<string>>;
  handleDropCatalogSong: (sourceSongId: string, targetSongId: string) => void;
}

/**
 * Vista de Discografía y catálogo general de temas.
 * @param props Estado y callbacks del contenedor ({@link RepertorioCatalogViewProps}).
 * @returns Sección de interfaz.
 */
export function RepertorioCatalogView({ activeTab, catalogoViewMode, songs, albumsList, colors, bName, bandLogoUrl, setSongs, setSetlists, handleToggleFavorite, activePlayerSong, isPlayerPlaying, selectPlayerSongWithQueue, setDeleteAlbumData, setAssignSongsModalData, setActiveMemberNotesSong, setActiveChordsSong, handleOpenStudioModal, setEditingSong, setShowSongModal, handleDeleteSong, handleShareSong, filteredSongs, catalogAlbumFilter, setCatalogAlbumFilter, catalogStatusFilter, setCatalogStatusFilter, catalogSearch, groupByAlbum, setGroupByAlbum, showCatalogActionsMenu, setShowCatalogActionsMenu, handleNormalizeCatalogTitles, selectedCatalogIds, setSelectedCatalogIds, clearCatalogSelection, toggleCatalogSelect, handleBulkAddSelectedToSetlist, handleBulkDeleteSongs, handleUpdateSongFromStudio, draggedCatalogSongId, setDraggedCatalogSongId, dragOverCatalogSongId, setDragOverCatalogSongId, handleDropCatalogSong }: RepertorioCatalogViewProps) {
  return (
    <>
{/* VIEW 2: DISCOGRAFÍA & CATÁLOGO GENERAL DE TEMAS (UNIFICADO) */}
      {activeTab === "catalogo" && (
        <div className="space-y-4" data-modulo="discografia">
          {catalogoViewMode === "albumes" ? (
            <DiscografiaView
              songs={songs}
              albumsList={albumsList}
              colors={colors}
              bandName={bName}
              bandLogoUrl={bandLogoUrl}
              setSongs={setSongs}
              setSetlists={setSetlists}
              toggleFavoriteSong={handleToggleFavorite}
              activePlayerSong={activePlayerSong}
              isPlayerPlaying={isPlayerPlaying}
              onSelectSong={(song, autoPlay, queue) =>
                selectPlayerSongWithQueue(song, autoPlay, queue || null)
              }
              onRequestDeleteAlbum={(albumName, songCount) =>
                setDeleteAlbumData({ albumName, songCount })
              }
              onEditAlbum={(albumName) =>
                setAssignSongsModalData({ isOpen: true, albumName })
              }
              onCreateAlbum={() =>
                setAssignSongsModalData({ isOpen: true, albumName: "" })
              }
              onOpenMemberNotes={(song) => setActiveMemberNotesSong(song)}
              onOpenChords={(song) => setActiveChordsSong(song)}
              onOpenStudio={(song) => handleOpenStudioModal(song)}
              onEditSong={(song) => {
                setEditingSong(song);
                setShowSongModal(true);
              }}
              onDeleteSong={(songId) => handleDeleteSong(songId)}
              onShareSong={(song) => handleShareSong(song)}
            />
          ) : (
            <CatalogoGeneralView
              songs={songs}
              filteredSongs={filteredSongs}
              albumsList={albumsList}
              colors={colors}
              bName={bName}
              catalogAlbumFilter={catalogAlbumFilter}
              setCatalogAlbumFilter={setCatalogAlbumFilter}
              catalogStatusFilter={catalogStatusFilter}
              setCatalogStatusFilter={setCatalogStatusFilter}
              catalogSearch={catalogSearch}
              groupByAlbum={groupByAlbum}
              setGroupByAlbum={setGroupByAlbum}
              showCatalogActionsMenu={showCatalogActionsMenu}
              setShowCatalogActionsMenu={setShowCatalogActionsMenu}
              handleNormalizeCatalogTitles={handleNormalizeCatalogTitles}
              selectedCatalogIds={selectedCatalogIds}
              setSelectedCatalogIds={setSelectedCatalogIds}
              clearCatalogSelection={clearCatalogSelection}
              toggleCatalogSelect={toggleCatalogSelect}
              handleBulkAddSelectedToSetlist={handleBulkAddSelectedToSetlist}
              handleBulkDeleteSongs={handleBulkDeleteSongs}
              activePlayerSong={activePlayerSong}
              isPlayerPlaying={isPlayerPlaying}
              selectPlayerSongWithQueue={selectPlayerSongWithQueue}
              onOpenNewSongModal={() => {
                setEditingSong(null);
                setShowSongModal(true);
              }}
              onEditSong={(song) => {
                setEditingSong(song);
                setShowSongModal(true);
              }}
              onDeleteSong={(songId) => handleDeleteSong(songId)}
              onShareSong={(song) => handleShareSong(song)}
              onOpenChords={(song) => setActiveChordsSong(song)}
              onOpenMemberNotes={(song) => setActiveMemberNotesSong(song)}
              onOpenStudio={(song, opts) => handleOpenStudioModal(song, opts)}
              onUpdateSongFromStudio={handleUpdateSongFromStudio}
              draggedCatalogSongId={draggedCatalogSongId}
              setDraggedCatalogSongId={setDraggedCatalogSongId}
              dragOverCatalogSongId={dragOverCatalogSongId}
              setDragOverCatalogSongId={setDragOverCatalogSongId}
              handleDropCatalogSong={handleDropCatalogSong}
            />
          )}
        </div>
      )}
    </>
  );
}
