import React, { useState } from 'react';
import { 
  Plus, Zap, ListPlus, Check, X, ChevronDown, Sparkles 
} from 'lucide-react';
import { Song, Setlist, SetlistShortcut } from '../../types';

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
    notaTema?: string
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
  isStitchLight: boolean;
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
  isStitchLight
}) => {
  const [showEventMenu, setShowEventMenu] = useState(false);

  // Selected item title for insertion mode
  const selectedItemLabel = (() => {
    if (!selectedSetlistItemId) return null;
    const sel = activeSetlist.items.find(x => x.id === selectedSetlistItemId);
    if (!sel) return 'elemento seleccionado';
    if (sel.tipoItem === 'cancion' && sel.songId) {
      return songs.find(s => s.id === sel.songId)?.titulo || 'Canción seleccionada';
    }
    return sel.tituloCustom || 'Evento seleccionado';
  })();

  const QUICK_EVENTS = [
    { label: 'Presentación Banda', icon: '🎤', type: 'presentacion', desc: 'Saludo inicial o presentación del grupo' },
    { label: 'Solo Batería / Percusión', icon: '🥁', type: 'beatbox', desc: 'Performance o ritmo solista' },
    { label: 'Intro / Historia del Tema', icon: '🗣️', type: 'intro_tema', desc: 'Narración antes de empezar' },
    { label: 'Cambio Instrumento', icon: '🔧', type: 'cambio_instrumento', desc: 'Afinación o ajuste técnico' },
    { label: 'Chapa / Charla con Público', icon: '💬', type: 'chapa', desc: 'Interacción con los asistentes' },
    { label: 'BIS Final', icon: '💣', type: 'bis', desc: 'Parón pre-bis o tema sorpresa' },
  ];

  return (
    <div className="space-y-1.5 pt-0.5">
      {/* Insertion Mode Indicator */}
      {selectedSetlistItemId && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0 text-amber-400 font-bold">📌 Insertando debajo de:</span>
            <span className="truncate font-semibold text-white">"{selectedItemLabel}"</span>
          </div>
          <button
            onClick={() => setSelectedSetlistItemId(null)}
            className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[9px] font-mono whitespace-nowrap cursor-pointer transition-colors"
            title="Deseleccionar e insertar al final de la lista"
          >
            ✕ Deseleccionar
          </button>
        </div>
      )}

      {/* Main Single-Line Actions Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Left: Song Adding Controls */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Add Multiple Songs Button */}
          <button
            type="button"
            onClick={() => setIsAddSongsModalOpen(true)}
            className="px-2.5 py-1.5 text-[10px] font-mono rounded-lg bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/40 hover:bg-[#1db954]/30 whitespace-nowrap cursor-pointer font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            title="Seleccionar y añadir varias canciones del catálogo de una sola vez"
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>+ Añadir Temas</span>
          </button>

          {/* Single Song Select Dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddItemToSetlist(e.target.value, 'cancion');
                e.target.value = '';
              }
            }}
            defaultValue=""
            className={`text-[10px] font-mono py-1.5 px-2 rounded-lg focus:outline-none cursor-pointer border border-neutral-800 font-medium truncate max-w-[200px] sm:max-w-[260px] ${
              isStitchLight ? 'bg-white text-slate-800' : 'bg-neutral-900 text-[#d1b375]'
            }`}
          >
            <option value="">+ 1 Tema Individual...</option>
            {sortedSongsByAlbumAndOrder.map((s, idx) => {
              const albumLabel = s.albumDisco || s.album || 'Single';
              return (
                <option key={`${s.id}-${idx}`} value={s.id}>
                  [{albumLabel}] {s.titulo} ({s.tonalidad ? `${s.tonalidad} • ` : ''}{s.duracion || '0:00'})
                </option>
              );
            })}
          </select>
        </div>

        {/* Right: Quick Events & Blocks Menu */}
        <div className="relative shrink-0">
          <div className="flex items-center gap-1">
            {/* Quick Block Add */}
            <button
              type="button"
              onClick={() => handleAddItemToSetlist(undefined, 'bloque_header', '⚡ Bloque Nuevo')}
              className="px-2 py-1.5 text-[10px] font-mono rounded-lg bg-[#d1b375]/15 text-[#d1b375] border border-[#f2ca50]/30 hover:bg-[#d1b375]/25 whitespace-nowrap cursor-pointer font-bold flex items-center gap-1 transition-all"
              title="Añadir un encabezado de bloque para estructurar el concierto"
            >
              <span>⚡</span>
              <span className="hidden xs:inline">+ Bloque</span>
            </button>

            {/* Events Dropdown Toggle */}
            <button
              type="button"
              onClick={() => setShowEventMenu(v => !v)}
              className="px-2 py-1.5 text-[10px] font-mono rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 whitespace-nowrap cursor-pointer font-bold flex items-center gap-1 transition-all"
              title="Añadir saludos, presentaciones, descansos, bises o eventos personalizados"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Eventos & Shows</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showEventMenu ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Events Popover Menu */}
          {showEventMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowEventMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-50 w-72 max-h-[80vh] overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl p-2 space-y-2 text-[11px] font-mono">
                {/* Standard Preset Events */}
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 px-2 py-1 font-bold">
                    Eventos de Show
                  </div>
                  <div className="grid grid-cols-1 gap-0.5">
                    {QUICK_EVENTS.map(ev => (
                      <button
                        key={ev.type}
                        type="button"
                        onClick={() => {
                          setShowEventMenu(false);
                          handleAddItemToSetlist(undefined, ev.type);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 text-neutral-200 hover:text-white transition flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <span>{ev.icon}</span>
                          <span>{ev.label}</span>
                        </span>
                        <span className="text-[9px] text-neutral-500">Añadir</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Event Trigger */}
                <div className="pt-1 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventMenu(false);
                      setEditingShowItem(null);
                      setShowShowItemModal(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Evento a Medida (Nombre, Audio, Minutos)...</span>
                  </button>
                </div>

                {/* Custom Band Shortcuts */}
                <div className="pt-1 border-t border-neutral-800">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-teal-400 font-bold">
                      Accesos Rápidos de la Banda
                    </span>
                    {!isAddingShortcut && (
                      <button
                        type="button"
                        onClick={() => setIsAddingShortcut(true)}
                        className="text-[9px] text-teal-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Nuevo
                      </button>
                    )}
                  </div>

                  {/* New Shortcut Inline Creator */}
                  {isAddingShortcut && (
                    <div className="p-2 rounded-lg bg-neutral-800/80 border border-neutral-700 space-y-1.5 mb-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          value={newShortcutIcon}
                          onChange={(e) => setNewShortcutIcon(e.target.value)}
                          maxLength={2}
                          placeholder="⭐"
                          className="w-7 bg-neutral-900 border border-neutral-700 rounded p-1 text-center text-xs focus:outline-none"
                        />
                        <input
                          value={newShortcutLabel}
                          onChange={(e) => setNewShortcutLabel(e.target.value)}
                          placeholder="Nombre del acceso"
                          maxLength={30}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateShortcut();
                            if (e.key === 'Escape') setIsAddingShortcut(false);
                          }}
                          className="flex-1 min-w-0 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                          <span>Duración:</span>
                          <input
                            type="number"
                            min={0}
                            value={newShortcutMinutes}
                            onChange={(e) => setNewShortcutMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-10 bg-neutral-900 border border-neutral-700 rounded text-center text-xs py-0.5 focus:outline-none"
                          />
                          <span>min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleCreateShortcut}
                            disabled={!newShortcutLabel.trim()}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] disabled:opacity-40 cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingShortcut(false)}
                            className="px-2 py-0.5 rounded bg-neutral-700 text-neutral-300 text-[10px] cursor-pointer"
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
                      {customShortcuts.map(sc => (
                        <div
                          key={sc.id}
                          className="group/sc relative inline-flex items-center rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px]"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setShowEventMenu(false);
                              handleUseCustomShortcut(sc);
                            }}
                            className="px-2 py-1 hover:bg-teal-500/20 transition cursor-pointer flex items-center gap-1"
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
                            className="px-1.5 py-1 text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                            title="Eliminar este acceso rápido"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !isAddingShortcut && (
                      <p className="text-[10px] text-neutral-500 px-2 py-1 italic">
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
