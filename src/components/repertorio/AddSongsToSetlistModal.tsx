import React, { useMemo, useState } from "react";
import { X, Search, Check, ListPlus, Star } from "lucide-react";
import { Song, ThemeColors } from "../../types";
import { ModalPortal } from "../common/ModalPortal";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { formatSecondsToMmSs } from "../../utils/repertorioUtils";
import { formatSongTitle } from "../../utils/formatSongTitle";
import { Input, Select } from '../ui';

interface AddSongsToSetlistModalProps {
  isOpen: boolean;
  songs: Song[];
  existingSongIds: string[];
  colors: ThemeColors;
  onClose: () => void;
  onAddSongs: (songIds: string[]) => void;
}

export function AddSongsToSetlistModal({
  isOpen,
  songs,
  existingSongIds,
  colors,
  onClose,
  onAddSongs,
}: AddSongsToSetlistModalProps) {
  const [search, setSearch] = useState("");
  const [onlyFavoritos, setOnlyFavoritos] = useState(false);
  const [albumFilter, setAlbumFilter] = useState("todos");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const existingSet = useMemo(
    () => new Set(existingSongIds),
    [existingSongIds],
  );

  const albumsList = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => {
      const alb = s.albumDisco || s.album;
      set.add(alb || "Singles / Sin Disco");
    });
    return ["todos", ...Array.from(set)];
  }, [songs]);

  if (!isOpen) return null;

  const filteredSongs = songs.filter((s) => {
    const matchSearch =
      search === "" ||
      s.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (s.tonalidad && s.tonalidad.toLowerCase().includes(search.toLowerCase()));
    const matchFav = !onlyFavoritos || s.favoritoGeneral;
    const alb = s.albumDisco || s.album || "Singles / Sin Disco";
    const matchAlbum = albumFilter === "todos" || alb === albumFilter;
    return matchSearch && matchFav && matchAlbum;
  });

  const toggleSong = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = [...prev];
      filteredSongs.forEach((s) => {
        if (!next.includes(s.id)) {
          next.push(s.id);
        }
      });
      return next;
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const selectedSet = new Set(selectedIds);

  const selectedDurationSeconds = songs
    .filter((s) => selectedSet.has(s.id))
    .reduce((acc, s) => acc + (s.duracionSegundos || 0), 0);

  const handleSubmit = () => {
    if (selectedIds.length === 0) return;
    onAddSongs(selectedIds);
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain">
        <div
          className={`w-full max-w-2xl p-5 rounded-[var(--r-l)] my-auto max-h-[92vh] flex flex-col ${colors.card} text-[var(--ink)]`}
        >
          <div className="flex justify-between items-center pb-3">
            <div className="flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-[var(--ok)]" />
              <h3 className="text-sm font-bold font-sans text-[var(--ink)]">
                Añadir varias canciones al repertorio
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="pt-3 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)]" />
              <Input
                size="sm"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título o tonalidad…"
                className="w-full pl-8 pr-3"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                size="sm"
                value={albumFilter}
                onChange={(e) => setAlbumFilter(e.target.value)}
                
              >
                {albumsList.map((alb) => (
                  <option key={alb} value={alb}>
                    {alb === "todos" ? "Todos los álbumes" : alb}
                  </option>
                ))}
              </Select>

              <button
                type="button"
                onClick={() => setOnlyFavoritos((p) => !p)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold cursor-pointer transition-colors ${
                  onlyFavoritos
                    ? "bg-[var(--acc)]/20 text-[var(--acc-ink)]"
                    : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                <Star
                  className={`w-3 h-3 ${onlyFavoritos ? "fill-[var(--acc)]" : ""}`}
                />
                <span>Solo favoritos</span>
              </button>

              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-2.5 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold cursor-pointer bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
              >
                Seleccionar todo lo filtrado ({filteredSongs.length})
              </button>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1.5 rounded-[var(--r-pill)] text-micro font-sans font-bold cursor-pointer bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                >
                  Vaciar selección
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1">
            {filteredSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <PublicoSilhouette opacity={0.12} size="small" />
                <p className="mt-4 font-medium text-[var(--ink)] text-xs">
                  No queda ninguna canción por añadir
                </p>
                <p className="mt-1.5 text-[var(--ink-2)] text-xs max-w-xs">
                  Ajusta los filtros o crea nuevas canciones en tu repertorio.
                </p>
              </div>
            ) : (
              filteredSongs.map((s) => {
                const selectedIndex = selectedIds.indexOf(s.id);
                const isSelected = selectedIndex !== -1;
                const alreadyInSetlist = existingSet.has(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSong(s.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-[var(--r-m)] text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[var(--surface)]/50"
                        : "bg-[var(--surface)] hover:bg-[var(--surface)]/80"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-[var(--r-s)] flex items-center justify-center shrink-0 font-sans text-xs font-bold transition-ui ${
                        isSelected
                          ? "bg-[var(--sunken)] text-[var(--ink)] scale-105"
                          : "text-[var(--ink-2)]"
                      }`}
                    >
                      {isSelected ? selectedIndex + 1 : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--ink)] truncate">
                          {formatSongTitle(s.titulo)}
                        </span>
                        {s.favoritoGeneral && (
                          <Star className="w-3 h-3 text-[var(--acc)] fill-[var(--acc)] shrink-0" />
                        )}
                        {alreadyInSetlist && (
                          <span className="text-micro font-sans px-1.5 py-0.5 rounded bg-[var(--surface)]/70 text-[var(--ink-2)] shrink-0">
                            Ya en el repertorio
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-micro font-sans px-1.5 py-0.5 rounded bg-[var(--surface)]/20 text-[var(--ok)] font-extrabold shrink-0 ml-auto/40">
                            #{selectedIndex + 1} en orden
                          </span>
                        )}
                      </div>
                      <div className="text-micro text-[var(--ink-2)] font-sans truncate">
                        {s.albumDisco || s.album || "Sin álbum"} ·{" "}
                        {s.tonalidad || "—"} ·{" "}
                        {formatSecondsToMmSs(s.duracionSegundos || 0)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-3 mt-2 flex items-center justify-between gap-3 shrink-0">
            <span className="text-micro font-sans text-[var(--ink-2)]">
              {selectedIds.length > 0
                ? `${selectedIds.length} seleccionadas (en orden 1..${selectedIds.length}) · ${formatSecondsToMmSs(selectedDurationSeconds)}`
                : "Ninguna canción seleccionada"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-[var(--r-pill)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface)]/80 transition-colors font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={handleSubmit}
                className="px-5 py-2 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--surface)] hover:bg-[var(--surface)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--ink)] transition-transform active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
              >
                <ListPlus className="w-4 h-4 stroke-[3]" />
                <span>
                  Añadir{" "}
                  {selectedIds.length > 0
                    ? `${selectedIds.length} Canciones en Orden`
                    : "Canciones"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
