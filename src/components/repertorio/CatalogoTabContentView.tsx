import React from "react";
import { Song, Setlist, ThemeColors } from "../../types";
import { DiscografiaView } from "./DiscografiaView";
import { CatalogoGeneralView } from "./CatalogoGeneralView";

export interface CatalogoTabContentViewProps {
  catalogoViewMode: "albumes" | "canciones";
  songs: Song[];
  albumsList: string[];
  colors: ThemeColors;
  bName: string;
  bandLogoUrl?: string;
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>;
  handleToggleFavorite: (songId: string) => void;
  activePlayerSong: Song | null;
  isPlayerPlaying: boolean;
  selectPlayerSongWithQueue: (song: Song, autoPlay?: boolean, queue?: Song[] | null) => void;
  setDeleteAlbumData: (data: { albumName: string; songCount: number } | null) => void;
  setAssignSongsModalData: (data: { isOpen: boolean; albumName: string }) => void;
  setActiveMemberNotesSong: (song: Song | null) => void;
  setActiveChordsSong: (song: Song | null) => void;
  handleOpenStudioModal: (song: Song, opts?: any) => void;
  setEditingSong: (song: Song | null) => void;
  setShowSongModal: (val: boolean) => void;
  handleDeleteSong: (songId: string) => void;
  handleShareSong: (song: Song) => void;
  filteredSongs: Song[];
  catalogAlbumFilter: string;
  setCatalogAlbumFilter: (val: string) => void;
  catalogStatusFilter: string;
  setCatalogStatusFilter: (val: any) => void;
  catalogSearch: string;
  groupByAlbum: boolean;
  setGroupByAlbum: React.Dispatch<React.SetStateAction<boolean>>;
  showCatalogActionsMenu: boolean;
  setShowCatalogActionsMenu: React.Dispatch<React.SetStateAction<boolean>>;
  handleNormalizeCatalogTitles: () => void;
  selectedCatalogIds: Set<string>;
  setSelectedCatalogIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  clearCatalogSelection: () => void;
  toggleCatalogSelect: (id: string) => void;
  handleBulkAddSelectedToSetlist: (songIds: string[]) => void;
  handleBulkDeleteSongs: (songIds: string[]) => void;
  handleUpdateSongFromStudio: (song: Song) => void;
  draggedCatalogSongId: string | null;
  setDraggedCatalogSongId: (id: string | null) => void;
  dragOverCatalogSongId: string | null;
  setDragOverCatalogSongId: (id: string | null) => void;
  handleDropCatalogSong: (sourceSongId: string, targetSongId: string) => void;
}

/**
 * Componente que desacopla la vista completa del Tab 2 ("Catálogo & Discografía"),
 * conmutando limpiamente entre DiscografiaView y CatalogoGeneralView sin inflar el monolito principal.
 */
export const CatalogoTabContentView: React.FC<CatalogoTabContentViewProps> = ({
  catalogoViewMode,
  songs,
  albumsList,
  colors,
  bName,
  bandLogoUrl,
  setSongs,
  setSetlists,
  handleToggleFavorite,
  activePlayerSong,
  isPlayerPlaying,
  selectPlayerSongWithQueue,
  setDeleteAlbumData,
  setAssignSongsModalData,
  setActiveMemberNotesSong,
  setActiveChordsSong,
  handleOpenStudioModal,
  setEditingSong,
  setShowSongModal,
  handleDeleteSong,
  handleShareSong,
  filteredSongs,
  catalogAlbumFilter,
  setCatalogAlbumFilter,
  catalogStatusFilter,
  setCatalogStatusFilter,
  catalogSearch,
  groupByAlbum,
  setGroupByAlbum,
  showCatalogActionsMenu,
  setShowCatalogActionsMenu,
  handleNormalizeCatalogTitles,
  selectedCatalogIds,
  setSelectedCatalogIds,
  clearCatalogSelection,
  toggleCatalogSelect,
  handleBulkAddSelectedToSetlist,
  handleBulkDeleteSongs,
  handleUpdateSongFromStudio,
  draggedCatalogSongId,
  setDraggedCatalogSongId,
  dragOverCatalogSongId,
  setDragOverCatalogSongId,
  handleDropCatalogSong,
}) => {
  return (
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
  );
};
