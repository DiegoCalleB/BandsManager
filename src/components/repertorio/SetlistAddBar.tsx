import React, { useState } from "react";
import {
  Plus,
  ListPlus,
  X,
  ChevronDown,
  Sparkles,
  Layers,
  Pin,
  Mic,
  Drum,
  MessageCircle,
  Wrench,
  Bomb,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../ui";
import { Song, Setlist, SetlistShortcut } from "../../types";
import { formatSongTitle } from "../../utils/formatSongTitle";

interface SetlistAddBarProps {
  activeSetlist: Setlist;
  songs: Song[];
  sortedSongsByAlbumAndOrder: Song[];
  selectedSetlistItemId: string | null;
  setSelectedSetlistItemId: (id: string | null) => void;
  handleAddItemToSetlist: (
    songId?: string,
    tipoItem?: string,
    tituloCustom?: string,
    duracionMinutos?: number,
    duracionSegundos?: number,
    notaTema?: string,
  ) => void;
  setIsAddSongsModalOpen: (open: boolean) => void;
  setEditingShowItem: (item: any) => void;
  setShowShowItemModal: (show: boolean) => void;
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
}

export const SetlistAddBar: React.FC<SetlistAddBarProps> = ({
  activeSetlist,
  songs,
  sortedSongsByAlbumAndOrder,
  selectedSetlistItemId,
  setSelectedSetlistItemId,
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
}) => {
  const [showEventMenu, setShowEventMenu] = useState(false);

  // Selected item title for insertion mode
  const selectedItemLabel = (() => {
    if (!selectedSetlistItemId) return null;
    const sel = activeSetlist.items.find((x) => x.id === selectedSetlistItemId);
    if (!sel) return "elemento seleccionado";
    if (sel.tipoItem === "cancion" && sel.songId) {
      const found = songs.find((s) => s.id === sel.songId);
      return found ? formatSongTitle(found.titulo) : "Canción seleccionada";
    }
    return sel.tituloCustom || "Evento seleccionado";
  })();

  const QUICK_EVENTS: { label: string; Icon: LucideIcon; type: string; desc: string }[] = [
    { label: "Presentación Banda", Icon: Mic, type: "presentacion", desc: "Saludo inicial o presentación del grupo" },
    { label: "Solo Batería / Percusión", Icon: Drum, type: "beatbox", desc: "Performance o ritmo solista" },
    { label: "Intro / Historia del Tema", Icon: Megaphone, type: "intro_tema", desc: "Narración antes de empezar" },
    { label: "Cambio Instrumento", Icon: Wrench, type: "cambio_instrumento", desc: "Afinación o ajuste técnico" },
    { label: "Chapa / Charla con Público", Icon: MessageCircle, type: "chapa", desc: "Interacción con los asistentes" },
    { label: "BIS Final", Icon: Bomb, type: "bis", desc: "Parón pre-bis o tema sorpresa" },
  ];

  return (
    <div className="space-y-2 pt-0.5">
      {/* Modo inserción: dónde caerá lo próximo que se añada */}
      {selectedSetlistItemId && (
        <div className="flex items-center justify-between gap-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] px-3 py-2 text-xs text-[var(--acc-ink)]">
          <div className="flex min-w-0 items-center gap-2">
            <Pin className="size-4 shrink-0" aria-hidden="true" />
            <span className="shrink-0 font-semibold">Insertando debajo de</span>
            <span className="truncate font-medium text-[var(--ink)]">{selectedItemLabel}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSetlistItemId(null)}
            title="Deseleccionar e insertar al final de la lista"
            aria-label="Deseleccionar"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Acciones de añadir: envuelven en móvil (antes se superponían) */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="soft"
          size="sm"
          onClick={() => setIsAddSongsModalOpen(true)}
          title="Seleccionar y añadir varias canciones del catálogo de una sola vez"
        >
          <ListPlus className="size-4" aria-hidden="true" />
          Añadir temas
        </Button>

        <select
          onChange={(e) => {
            if (e.target.value) {
              handleAddItemToSetlist(e.target.value, "cancion");
              e.target.value = "";
            }
          }}
          defaultValue=""
          aria-label="Añadir un tema del catálogo"
          className="h-9 min-w-0 flex-1 basis-40 cursor-pointer truncate rounded-[var(--r-pill)] bg-[var(--sunken)] px-3.5 text-xs font-medium text-[var(--ink)] transition-ui hover:brightness-95 sm:max-w-[16rem] sm:flex-none"
        >
          <option value="">Añadir un tema…</option>
          {sortedSongsByAlbumAndOrder.map((s, idx) => {
            const albumLabel = s.albumDisco || s.album || "Single";
            const cleanTitle = formatSongTitle(s.titulo);
            return (
              <option key={`${s.id}-${idx}`} value={s.id}>
                [{albumLabel}] {cleanTitle} ({s.tonalidad ? `${s.tonalidad} · ` : ""}
                {s.duracion || "0:00"})
              </option>
            );
          })}
        </select>

        <div className="relative ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => handleAddItemToSetlist(undefined, "bloque_header", "Bloque nuevo")}
            title="Añadir un encabezado de bloque para estructurar el concierto"
          >
            <Layers className="size-4" aria-hidden="true" />
            Bloque
          </Button>
          <Button
            variant="neutral"
            size="sm"
            onClick={() => setShowEventMenu((v) => !v)}
            aria-expanded={showEventMenu}
            title="Añadir saludos, presentaciones, descansos, bises o eventos personalizados"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Eventos
            <ChevronDown className={`size-3.5 transition-transform ${showEventMenu ? "rotate-180" : ""}`} aria-hidden="true" />
          </Button>

          {/* Events Popover Menu */}
          {showEventMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEventMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-50 w-72 max-h-[80vh] overflow-y-auto rounded-[var(--r-m)] bg-[var(--surface)]/95 p-2 space-y-2 text-xs">
                {/* Standard Preset Events */}
                <div>
                  <div className="text-micro text-[var(--ink-2)] px-2 py-1 font-semibold">
                    Eventos de Show
                  </div>
                  <div className="grid grid-cols-1 gap-0.5">
                    {QUICK_EVENTS.map((ev) => (
                      <button
                        key={ev.type}
                        type="button"
                        onClick={() => {
                          setShowEventMenu(false);
                          handleAddItemToSetlist(undefined, ev.type);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] transition flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <ev.Icon className="size-4 text-[var(--ink-2)]" aria-hidden="true" />
                          <span>{ev.label}</span>
                        </span>
                        <span className="text-micro text-[var(--ink-2)]">
                          Añadir
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Event Trigger */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventMenu(false);
                      setEditingShowItem(null);
                      setShowShowItemModal(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--ink-2)] hover:bg-[var(--acc)]/20 font-medium transition flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    <span>Evento a medida (nombre, audio, minutos)…</span>
                  </button>
                </div>

                {/* Custom Band Shortcuts */}
                <div className="pt-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-micro text-[var(--ok)] font-semibold">
                      Accesos Rápidos de la Banda
                    </span>
                    {!isAddingShortcut && (
                      <button
                        type="button"
                        onClick={() => setIsAddingShortcut(true)}
                        className="text-micro text-[var(--ok)] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Nuevo
                      </button>
                    )}
                  </div>

                  {/* New Shortcut Inline Creator */}
                  {isAddingShortcut && (
                    <div className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/90 space-y-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          value={newShortcutIcon}
                          onChange={(e) => setNewShortcutIcon(e.target.value)}
                          maxLength={2}
                          placeholder="Icono"
                          className="w-8 bg-[var(--sunken)] rounded-[var(--r-s)] p-1 text-center text-xs focus:outline-none"
                        />
                        <input
                          value={newShortcutLabel}
                          onChange={(e) => setNewShortcutLabel(e.target.value)}
                          placeholder="Nombre del acceso"
                          maxLength={30}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateShortcut();
                            if (e.key === "Escape") setIsAddingShortcut(false);
                          }}
                          className="flex-1 min-w-0 bg-[var(--sunken)] rounded-[var(--r-s)] px-2 py-1 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1 text-xs text-[var(--ink-2)]">
                          <span>Duración:</span>
                          <input
                            type="number"
                            min={0}
                            value={newShortcutMinutes}
                            onChange={(e) =>
                              setNewShortcutMinutes(
                                Math.max(0, parseInt(e.target.value, 10) || 0),
                              )
                            }
                            className="w-10 bg-[var(--sunken)] rounded text-center text-xs py-0.5 focus:outline-none"
                          />
                          <span>min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleCreateShortcut}
                            disabled={!newShortcutLabel.trim()}
                            className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] font-medium text-xs disabled:opacity-40 cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingShortcut(false)}
                            className="px-2 py-1 text-[var(--ink-2)] hover:text-[var(--ink-2)] text-xs cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shortcuts List */}
                  {customShortcuts.length > 0 ? (
                    <div className="flex flex-wrap gap-1 px-1">
                      {customShortcuts.map((sc) => (
                        <div
                          key={sc.id}
                          className="group/sc relative inline-flex items-center rounded-[var(--r-s)] bg-[var(--ok)]/10 text-[var(--ok)] text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setShowEventMenu(false);
                              handleUseCustomShortcut(sc);
                            }}
                            className="px-2 py-1 hover:bg-[var(--ok)]/20 transition cursor-pointer flex items-center gap-1.5"
                            title={sc.tituloCustom}
                          >
                            <span>{sc.icono}</span>
                            <span>{sc.etiqueta}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShortcut(sc.id);
                            }}
                            className="px-1.5 py-1 text-[var(--ink-2)] hover:text-[var(--alert)] transition cursor-pointer"
                            title="Eliminar este acceso rápido"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !isAddingShortcut && (
                      <p className="text-xs text-[var(--ink-2)] px-2 py-1 italic">
                        Crea botones para eventos recurrentes de tus conciertos.
                      </p>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
