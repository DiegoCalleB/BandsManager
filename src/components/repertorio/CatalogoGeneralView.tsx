import React from "react";
import { Song, ThemeColors } from "../../types";
import { Button, IconButton, Select } from "../ui";
import { PopoverAncla } from "../ui/PopoverAncla";
import { AlbumCover } from "../AlbumCover";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { SongCardRow } from "./SongCardRow";
import { ShowIcon } from "../ui/ShowIcon";
import {
  Play,
  Pause,
  Plus,
  CheckCircle2,
  MoreHorizontal,
  Layers,
  Sparkles,
  ListPlus,
  Trash2,
} from "lucide-react";

export interface CatalogoGeneralViewProps {
  songs: Song[];
  filteredSongs: Song[];
  albumsList: string[];
  colors: ThemeColors;
  bName: string;
  catalogAlbumFilter: string;
  setCatalogAlbumFilter: (val: string) => void;
  catalogStatusFilter: string;
  setCatalogStatusFilter: (val: string) => void;
  catalogSearch: string;
  groupByAlbum: boolean;
  setGroupByAlbum: (val: boolean) => void;
  showCatalogActionsMenu: boolean;
  setShowCatalogActionsMenu: (val: boolean) => void;
  handleNormalizeCatalogTitles: () => void;
  selectedCatalogIds: Set<string>;
  setSelectedCatalogIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  clearCatalogSelection: () => void;
  toggleCatalogSelect: (id: string) => void;
  handleBulkAddSelectedToSetlist: (ids: string[]) => void;
  handleBulkDeleteSongs: (ids: string[]) => void;
  activePlayerSong: Song | null;
  isPlayerPlaying: boolean;
  selectPlayerSongWithQueue: (
    song: Song,
    autoPlay: boolean,
    queueOverride?: Song[] | null,
    transposeSemitones?: number,
  ) => void;
  onOpenNewSongModal: () => void;
  onEditSong: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onShareSong: (song: Song) => void;
  onOpenChords: (song: Song) => void;
  onOpenMemberNotes: (song: Song) => void;
  onOpenStudio: (song: Song, opts?: { openIris?: boolean }) => void;
  onUpdateSongFromStudio: (song: Song) => void;
  draggedCatalogSongId: string | null;
  setDraggedCatalogSongId: (id: string | null) => void;
  dragOverCatalogSongId: string | null;
  setDragOverCatalogSongId: (id: string | null) => void;
  handleDropCatalogSong: (sourceId: string, targetId: string) => void;
}

export const CatalogoGeneralView: React.FC<CatalogoGeneralViewProps> = ({
  songs,
  filteredSongs,
  albumsList,
  colors,
  bName,
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
  activePlayerSong,
  isPlayerPlaying,
  selectPlayerSongWithQueue,
  onOpenNewSongModal,
  onEditSong,
  onDeleteSong,
  onShareSong,
  onOpenChords,
  onOpenMemberNotes,
  onOpenStudio,
  onUpdateSongFromStudio,
  draggedCatalogSongId,
  setDraggedCatalogSongId,
  dragOverCatalogSongId,
  setDragOverCatalogSongId,
  handleDropCatalogSong,
}) => {
  return (
    <div className="space-y-4">
      {/* CATALOG HERO BANNER — Estilo Spotify: limpio y minimalista */}
      <div className="flex items-end gap-4 sm:gap-6 pb-6">
        {/* Album cover */}
        <div className="relative shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-[var(--r-m)] overflow-hidden flex items-center justify-center group">
          <AlbumCover
            title={`Repertorio ${bName}`}
            artist={bName}
            coverUrl={filteredSongs[0]?.portadaUrl}
            size={112}
            onPlay={() => {
              const first = filteredSongs[0];
              if (first) {
                selectPlayerSongWithQueue(first, true, null);
              }
            }}
            isPlaying={
              !!(
                activePlayerSong &&
                isPlayerPlaying &&
                filteredSongs.some((s) => s.id === activePlayerSong.id)
              )
            }
          />
          <div className="absolute inset-0 bg-[var(--scrim)]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-6 h-6 text-[var(--ink)] fill-[var(--surface)]" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pb-1">
          <div className="text-xs font-semibold text-[var(--ink-2)] mb-2">
            Repertorio
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight truncate">
            {bName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--ink-2)] mt-3">
            <span className="font-medium text-[var(--ink)]">
              {songs.length} temas
            </span>
            <span className="text-[var(--ink-2)]">•</span>
            <span>
              {Math.round(
                songs.reduce(
                  (acc, s) => acc + (s.duracionSegundos || 210),
                  0,
                ) / 60,
              )}{" "}
              min
            </span>
            <span className="text-[var(--ink-2)]">•</span>
            <span className="font-medium">
              {songs.filter((s) => s.favoritoGeneral).length} favoritos
            </span>
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={() => {
            if (filteredSongs.length > 0) {
              const first = filteredSongs[0];
              selectPlayerSongWithQueue(first, true, null);
            }
          }}
          className="shrink-0 w-12 h-12 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold flex items-center justify-center transition-ui cursor-pointer active:scale-[0.97]"
          title="Reproducir catálogo"
        >
          {activePlayerSong &&
          isPlayerPlaying &&
          filteredSongs.some((s) => s.id === activePlayerSong.id) ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* CATALOG FILTERS BAR — Limpio y minimalista */}
      <div className="flex items-center gap-3 py-4">
        {/* Album filter */}
        <Select
          size="sm"
          value={catalogAlbumFilter}
          onChange={(e) => setCatalogAlbumFilter(e.target.value)}
        >
          <option value="todos">Todos los discos</option>
          {albumsList
            .filter((a) => a !== "todos")
            .map((alb) => (
              <option key={alb} value={alb}>
                {alb}
              </option>
            ))}
        </Select>

        {/* Status filter toggle */}
        <button
          onClick={() =>
            setCatalogStatusFilter(
              catalogStatusFilter === "todos" ? "listo" : "todos",
            )
          }
          className={`px-3.5 py-2 rounded-[var(--r-pill)] text-sm font-medium transition-colors flex items-center gap-2 ${
            catalogStatusFilter === "listo"
              ? "bg-[var(--ink)] text-[var(--bg)]"
              : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Listos</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add song button */}
        <Button
          variant="primary"
          id="btn-add-song-filter"
          onClick={onOpenNewSongModal}
          className="items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tema</span>
        </Button>

        {/* More actions menu */}
        <IconButton
          label="Más opciones"
          type="button"
          onClick={() => setShowCatalogActionsMenu(!showCatalogActionsMenu)}
          className="relative"
        >
          <MoreHorizontal className="w-5 h-5" />
        </IconButton>

        {showCatalogActionsMenu && (
          <PopoverAncla className="absolute right-0 top-full mt-2 bg-[var(--surface)] rounded-[var(--r-m)] py-2 z-50 min-w-[200px]">
            <button
              onClick={() => {
                setGroupByAlbum(!groupByAlbum);
                setShowCatalogActionsMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--sunken)] transition-colors flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-[var(--ink-2)]" />
              <span>Agrupar por álbum</span>
            </button>
            <button
              id="btn-normalize-titles"
              type="button"
              onClick={() => {
                handleNormalizeCatalogTitles();
                setShowCatalogActionsMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--sunken)] transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[var(--acc)]" />
              <span>Nombres propios</span>
            </button>
          </PopoverAncla>
        )}
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedCatalogIds.size > 0 && (
        <div
          className={`p-3.5 rounded-[var(--r-l)] flex flex-wrap items-center justify-between gap-3 ${"bg-[var(--ok)]/20 text-[var(--ink)]"}`}
        >
          <span className="text-xs font-medium">
            {selectedCatalogIds.size} canciones seleccionadas
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={() =>
                handleBulkAddSelectedToSetlist(Array.from(selectedCatalogIds))
              }
              className="items-center gap-1.5"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Añadir a repertorio…</span>
            </Button>
            <button
              type="button"
              onClick={() =>
                handleBulkDeleteSongs(Array.from(selectedCatalogIds))
              }
              className="px-3.5 py-1.5 rounded-[var(--r-pill)] text-xs font-medium bg-[var(--alert)]/20 hover:bg-[var(--alert)]/30 text-[var(--ink)] cursor-pointer transition-ui flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar seleccionadas</span>
            </button>
            <button
              type="button"
              onClick={clearCatalogSelection}
              className="px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-medium bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] cursor-pointer transition-ui"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* UNIFIED TRACKLIST / CATÁLOGO DE TEMAS */}
      <div className="rounded-[var(--r-l)] sm:rounded-[var(--r-xl)] overflow-hidden bg-[var(--surface)] text-[var(--ink-2)]">
        <div className="p-4 bg-[var(--sunken)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <input
              type="checkbox"
              checked={
                filteredSongs.length > 0 &&
                filteredSongs.every((s) => selectedCatalogIds.has(s.id))
              }
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedCatalogIds(
                    new Set(filteredSongs.map((s) => s.id)),
                  );
                } else {
                  clearCatalogSelection();
                }
              }}
              className="w-3.5 h-3.5 cursor-pointer accent-indigo-600"
              title="Seleccionar todo lo filtrado"
            />
            <span className="font-semibold text-[var(--ink-2)]">
              {selectedCatalogIds.size > 0
                ? `${selectedCatalogIds.size} seleccionadas`
                : `${filteredSongs.length} temas`}
            </span>
            <span className="hidden md:inline text-xs opacity-60">
              • Tono · BPM · duración · estado
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[var(--ink-2)] mt-3">
            <span className="hidden lg:inline opacity-70">
              Acciones rápidas:
            </span>
            <span className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)]/15 text-[var(--ink)] font-medium">
              Acordes
            </span>
            <span className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)]/15 text-[var(--ink)] font-medium">
              Studio
            </span>
            <span className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] font-medium">
              Notas
            </span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--surface)] text-[var(--ink-2)] font-medium">
              Editar
            </span>
          </div>
        </div>
      </div>

      {/* Tracklist List */}
      <div className="p-2.5 space-y-1.5">
        {filteredSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <PublicoSilhouette opacity={0.12} size="small" />
            <p className="mt-4 font-medium text-[var(--ink)] text-xs">
              Sin canciones con esos filtros
            </p>
            <p className="mt-1.5 text-[var(--ink-2)] text-xs max-w-xs text-center">
              Ajusta los filtros o añade nuevas canciones a tu catálogo.
            </p>
          </div>
        ) : (
          filteredSongs.map((s, idx) => {
            const isPlayingCurrent = activePlayerSong?.id === s.id;
            const isSelected = selectedCatalogIds.has(s.id);
            const albumLabel =
              s.albumDisco || s.album || "Singles / Sin Disco";
            const prevAlbumLabel =
              idx > 0
                ? filteredSongs[idx - 1].albumDisco ||
                  filteredSongs[idx - 1].album ||
                  "Singles / Sin Disco"
                : null;
            const showAlbumHeader =
              groupByAlbum && albumLabel !== prevAlbumLabel;
            const isDraggableCatalog =
              filteredSongs.length > 1 &&
              !catalogSearch.trim() &&
              catalogAlbumFilter === "todos" &&
              catalogStatusFilter === "todos";
            const isDragging = draggedCatalogSongId === s.id;
            const isDragOver = dragOverCatalogSongId === s.id;

            return (
              <React.Fragment key={`${s.id}-${idx}`}>
                {showAlbumHeader && (
                  <div className="pt-3 pb-1 px-2 flex items-center gap-2 text-micro font-sans font-bold text-[var(--acc)]">
                    <span>
                      <ShowIcon inline emoji="💿" />
                      {albumLabel}
                    </span>
                    <div className={`h-px flex-1 ${"bg-[var(--sunken)]"}`} />
                  </div>
                )}

                <SongCardRow
                  song={s}
                  index={idx + 1}
                  isPlayingCurrent={isPlayingCurrent}
                  isPlayerPlaying={isPlayerPlaying}
                  onPlay={() => selectPlayerSongWithQueue(s, true, null)}
                  onSelect={() => onEditSong(s)}
                  onToggleFavorite={() =>
                    onUpdateSongFromStudio({
                      ...s,
                      favoritoGeneral: !s.favoritoGeneral,
                    })
                  }
                  showCheckbox={true}
                  isSelected={isSelected}
                  onToggleSelect={() => toggleCatalogSelect(s.id)}
                  onOpenChords={() => onOpenChords(s)}
                  onOpenMemberNotes={() => onOpenMemberNotes(s)}
                  onOpenStudio={() => onOpenStudio(s)}
                  onOpenIris={() => onOpenStudio(s, { openIris: true })}
                  onEditSong={() => onEditSong(s)}
                  onDeleteSong={() => onDeleteSong(s.id)}
                  onShareSong={() => onShareSong(s)}
                  externalLink={s.enlaceAcordes}
                  showAlbumBadge={!groupByAlbum}
                  draggable={isDraggableCatalog}
                  isDragging={isDragging}
                  isDragOver={isDragOver}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedCatalogSongId(s.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (
                      draggedCatalogSongId &&
                      dragOverCatalogSongId !== s.id
                    ) {
                      setDragOverCatalogSongId(s.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverCatalogSongId === s.id) {
                      setDragOverCatalogSongId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedCatalogSongId) {
                      handleDropCatalogSong(draggedCatalogSongId, s.id);
                    }
                    setDraggedCatalogSongId(null);
                    setDragOverCatalogSongId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedCatalogSongId(null);
                    setDragOverCatalogSongId(null);
                  }}
                  colors={colors}
                />
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
