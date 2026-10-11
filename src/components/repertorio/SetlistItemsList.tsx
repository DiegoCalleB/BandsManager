import React from "react";
import { Setlist, SetlistItem, Song } from "../../types";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { SetlistSongRow } from "./SetlistSongRow";
import { SetlistShowItemRow } from "./SetlistShowItemRow";
import { getSemitoneDifference } from "../../utils/chordUtils";
import {
  isSongMarkedForMember,
  withSongMarkedForMember,
} from "../../utils/repertorioUtils";

export interface SetlistItemsListProps {
  activeSetlist: Setlist;
  songs: Song[];
  selectedSetlistItemId: string | null;
  setSelectedSetlistItemId: (id: string | null) => void;
  expandedSetlistItemIds: Set<string>;
  setExpandedSetlistItemIds: (ids: Set<string>) => void;
  draggedItemIndex: number | null;
  setDraggedItemIndex: (idx: number | null) => void;
  dragOverItemIndex: number | null;
  setDragOverItemIndex: (idx: number | null) => void;
  handleDropItem: (targetIndex: number) => void;
  activePlayerSong: Song | null;
  isPlayerPlaying: boolean;
  selectPlayerSongWithQueue: (
    song: Song,
    autoPlay?: boolean,
    queue?: Song[] | null,
    transposeSemitones?: number,
  ) => void;
  editingKeyItemId: string | null;
  setEditingKeyItemId: (id: string | null) => void;
  keyPopoverPos: { top: number; left: number } | null;
  setKeyPopoverPos: (pos: { top: number; left: number } | null) => void;
  handleSetTonalidadDeseada: (itemId: string, note: string) => void;
  editingEnergyItemId: string | null;
  setEditingEnergyItemId: (id: string | null) => void;
  energyPopoverPos: { top: number; left: number; openUpward: boolean } | null;
  setEnergyPopoverPos: (
    pos: { top: number; left: number; openUpward: boolean } | null,
  ) => void;
  savingEnergyItemId: string | null;
  handleSetEnergiaManual: (song: Song, itemId: string, val: number) => void;
  handleOpenTransitionPreview: (idxA: number, idxB: number) => void;
  handleRemoveSetlistItem: (itemId: string) => void;
  handleUpdateItemNote: (itemId: string, note: string) => void;
  onEditSong: (song: Song) => void;
  onOpenStudio: (song: Song) => void;
  onOpenMemberNotes: (song: Song) => void;
  onOpenChords: (song: Song) => void;
  currentUser: any;
  handleUpdateSongFromStudio: (song: Song) => void;
  onUpdateShowItemTitle: (itemId: string, title: string) => void;
  onEditShowItem: (item: SetlistItem) => void;
  transparentDragImage?: HTMLImageElement | null;
}

/**
 * Listado interactivo de elementos del setlist con soporte drag & drop,
 * selección, edición de tono/energía en vivo y notas de músicos.
 */
export const SetlistItemsList: React.FC<SetlistItemsListProps> = ({
  activeSetlist,
  songs,
  selectedSetlistItemId,
  setSelectedSetlistItemId,
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
  handleOpenTransitionPreview,
  handleRemoveSetlistItem,
  handleUpdateItemNote,
  onEditSong,
  onOpenStudio,
  onOpenMemberNotes,
  onOpenChords,
  currentUser,
  handleUpdateSongFromStudio,
  onUpdateShowItemTitle,
  onEditShowItem,
  transparentDragImage,
}) => {
  return (
    <div className="space-y-2 max-h-[calc(88vh-200px)] min-h-[480px] overflow-y-auto pr-1">
      {activeSetlist.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PublicoSilhouette opacity={0.12} size="medium" />
          <p className="mt-6 font-medium text-[var(--ink)] text-sm">
            Setlist vacío. Añade el primer tema.
          </p>
          <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs">
            Usa la barra superior para añadir temas o eventos.
          </p>
        </div>
      ) : (
        activeSetlist.items.map((it, index) => {
          const isSelected = selectedSetlistItemId === it.id;
          const isDragging = draggedItemIndex === index;
          const isDragOver = dragOverItemIndex === index;

          if (it.tipoItem === "cancion" && it.songId) {
            const song = songs.find((s) => s.id === it.songId);
            if (!song) return null;

            const isExpanded = expandedSetlistItemIds.has(it.id);
            const toggleExpand = () => {
              const newSet = new Set(expandedSetlistItemIds);
              if (newSet.has(it.id)) {
                newSet.delete(it.id);
              } else {
                newSet.add(it.id);
              }
              setExpandedSetlistItemIds(newSet);
            };

            const isPlayingThisRow =
              activePlayerSong?.id === song.id && isPlayerPlaying;
            const playThisSong = () => {
              const setlistSongs = activeSetlist.items
                .filter((i) => i.tipoItem === "cancion" && i.songId)
                .map((i) => songs.find((s) => s.id === i.songId))
                .filter((s): s is Song => !!s);
              const diffResult =
                song.tonalidad && it.tonalidadDeseada
                  ? getSemitoneDifference(song.tonalidad, it.tonalidadDeseada)
                  : null;
              const transposeSemitones = diffResult ?? 0;
              selectPlayerSongWithQueue(
                song,
                true,
                setlistSongs,
                transposeSemitones,
              );
            };

            const songIndex = activeSetlist.items
              .slice(0, index)
              .filter((i) => i.tipoItem === "cancion").length;

            const prevSong =
              index > 0 && activeSetlist.items[index - 1]?.songId
                ? songs.find(
                    (s) => s.id === activeSetlist.items[index - 1].songId,
                  )
                : undefined;

            return (
              <SetlistSongRow
                key={it.id}
                item={it}
                index={index}
                song={song}
                songIndex={songIndex}
                isDragging={isDragging}
                isDragOver={isDragOver}
                onDragStart={(e) => {
                  if (transparentDragImage)
                    e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
                  setDraggedItemIndex(index);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverItemIndex(index);
                }}
                onDragLeave={() => {
                  if (dragOverItemIndex === index) setDragOverItemIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropItem(index);
                }}
                onDragEnd={() => {
                  setDraggedItemIndex(null);
                  setDragOverItemIndex(null);
                }}
                isSelected={isSelected}
                onSelect={() => {
                  if (!isSelected && !isExpanded) {
                    setExpandedSetlistItemIds(
                      new Set(expandedSetlistItemIds).add(it.id),
                    );
                  }
                  setSelectedSetlistItemId(isSelected ? null : it.id);
                }}
                isExpanded={isExpanded}
                onToggleExpand={toggleExpand}
                isPlaying={isPlayingThisRow}
                onPlay={playThisSong}
                isEditingKey={editingKeyItemId === it.id}
                keyPopoverPos={keyPopoverPos}
                onToggleKeyPopover={(e) => {
                  e.stopPropagation();
                  if (editingKeyItemId === it.id) {
                    setEditingKeyItemId(null);
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  setKeyPopoverPos({
                    top: Math.min(rect.bottom + 4, window.innerHeight - 110 - 8),
                    left: Math.min(rect.left, window.innerWidth - 200 - 8),
                  });
                  setEditingKeyItemId(it.id);
                }}
                onSetTonalidadDeseada={(note) =>
                  handleSetTonalidadDeseada(it.id, note)
                }
                isEditingEnergy={editingEnergyItemId === it.id}
                energyPopoverPos={energyPopoverPos}
                isSavingEnergy={savingEnergyItemId === it.id}
                onToggleEnergyPopover={(e) => {
                  e.stopPropagation();
                  if (editingEnergyItemId === it.id) {
                    setEditingEnergyItemId(null);
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const openUpward = window.innerHeight - rect.bottom < 36 + 8;
                  setEnergyPopoverPos({
                    top: openUpward ? rect.top - 36 - 4 : rect.bottom + 4,
                    left: Math.min(rect.left, window.innerWidth - 220 - 8),
                    openUpward,
                  });
                  setEditingEnergyItemId(it.id);
                }}
                onSetEnergiaManual={(val) =>
                  handleSetEnergiaManual(song, it.id, val)
                }
                prevSong={prevSong}
                onOpenTransitionPreview={() =>
                  handleOpenTransitionPreview(index - 1, index)
                }
                onRemove={() => handleRemoveSetlistItem(it.id)}
                onUpdateNote={(note) => handleUpdateItemNote(it.id, note)}
                onEditSong={() => onEditSong(song)}
                onOpenStudio={() => onOpenStudio(song)}
                onOpenMemberNotes={() => onOpenMemberNotes(song)}
                onOpenChords={() => onOpenChords(song)}
                currentUser={currentUser}
                onToggleDuda={() => {
                  if (!currentUser?.name) return;
                  const dudaMarcada = isSongMarkedForMember(
                    song,
                    currentUser.id,
                    currentUser.name,
                  );
                  handleUpdateSongFromStudio(
                    withSongMarkedForMember(
                      song,
                      currentUser.id,
                      currentUser.name,
                      !dudaMarcada,
                    ),
                  );
                }}
              />
            );
          } else {
            return (
              <SetlistShowItemRow
                key={it.id}
                item={it}
                index={index}
                isSelected={isSelected}
                isDragging={isDragging}
                isDragOver={isDragOver}
                onDragStart={(e) => {
                  if (transparentDragImage)
                    e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
                  setDraggedItemIndex(index);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverItemIndex(index);
                }}
                onDragLeave={() => {
                  if (dragOverItemIndex === index) setDragOverItemIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropItem(index);
                }}
                onDragEnd={() => {
                  setDraggedItemIndex(null);
                  setDragOverItemIndex(null);
                }}
                onSelect={() =>
                  setSelectedSetlistItemId(isSelected ? null : it.id)
                }
                onUpdateTitle={(val) => onUpdateShowItemTitle(it.id, val)}
                onEdit={() => onEditShowItem(it)}
                onRemove={() => handleRemoveSetlistItem(it.id)}
              />
            );
          }
        })
      )}
    </div>
  );
};
