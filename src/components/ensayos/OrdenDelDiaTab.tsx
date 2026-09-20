import React, { useState, useMemo } from 'react';
import { 
  Plus, Disc3, Clock, CheckSquare, Square, Trash2, ArrowUp, ArrowDown, 
  Sparkles, Coffee, Play, Music, Flame, Edit3, CheckCircle2, AlertCircle, X,
  Layers, Volume2, ListOrdered, GripVertical, Search, Star, Undo2, FolderInput,
  FlameKindling
} from 'lucide-react';
import { Rehearsal, RehearsalAgendaItem, RehearsalObjective, Song, Setlist, Concert, ThemeColors } from '../../types';
import { formatSongTitle } from '../../utils/formatSongTitle';
import { formatSecondsToMmSs } from '../../utils/repertorioUtils';
import { ModalPortal } from '../common/ModalPortal';

interface OrdenDelDiaTabProps {
  rehearsal: Rehearsal;
  onUpdateRehearsal: (updated: Partial<Rehearsal>) => void;
  songs: Song[];
  setlists: Setlist[];
  nextConcert?: Concert | null;
  colors?: ThemeColors;
  onGoToLiveMode: () => void;
}

const BLOCK_TYPES: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  cancion: { label: 'Canción de Repertorio', icon: '🎵', bg: 'bg-amber-500/10', text: 'text-amber-400', border: '/20' },
  calentamiento: { label: 'Calentamiento / Sonido', icon: '🔥', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  pausa: { label: 'Pausa / Descanso / Birra', icon: '☕', bg: 'bg-neutral-800', text: 'text-text-[var(--ink-3)]', border: '' },
  seccion_especifica: { label: 'Sección Específica (Solo, Coros, Intro)', icon: '🎯', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  improvisacion: { label: 'Jam / Improvisación / Riff', icon: '🎸', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  outro: { label: 'Repaso Final / Feedback', icon: '🏁', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
};

// 1x1 transparent drag ghost image
const TRANSPARENT_DRAG_IMAGE = typeof window !== 'undefined' ? new window.Image() : null;
if (TRANSPARENT_DRAG_IMAGE) {
  TRANSPARENT_DRAG_IMAGE.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';
}

export function OrdenDelDiaTab({
  rehearsal,
  onUpdateRehearsal,
  songs = [],
  setlists = [],
  nextConcert,
  colors,
  onGoToLiveMode
}: OrdenDelDiaTabProps) {
  const agenda = rehearsal.agenda || [];
  const objetivos = rehearsal.objetivos || [];

  // Modales
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showImportSetlistModal, setShowImportSetlistModal] = useState(false);

  // Multi-song selection state
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [searchSongQuery, setSearchSongQuery] = useState('');
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Drag and drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
  const [historyStack, setHistoryStack] = useState<RehearsalAgendaItem[][]>([]);

  // Custom block form state
  const [blockTipo, setBlockTipo] = useState<RehearsalAgendaItem['tipo']>('calentamiento');
  const [blockTitulo, setBlockTitulo] = useState('');
  const [blockDuracion, setBlockDuracion] = useState(15);
  const [blockEnfoque, setBlockEnfoque] = useState('');

  // Nuevo objetivo rápido
  const [nuevoObjTexto, setNuevoObjTexto] = useState('');

  // Estadísticas del orden del día
  const totalMinutosEstimados = agenda.reduce((acc, item) => acc + (item.duracionEstimadaMin || 0), 0);
  const cancionesCount = agenda.filter(item => item.tipo === 'cancion').length;
  const pausasCount = agenda.filter(item => item.tipo === 'pausa').length;

  // Lista de álbumes para el filtro del modal
  const albumsList = useMemo(() => {
    const set = new Set<string>();
    songs.forEach(s => {
      const alb = s.albumDisco || s.album;
      set.add(alb || 'Singles / Sin Disco');
    });
    return ['todos', ...Array.from(set)];
  }, [songs]);

  // Existing songs in agenda
  const existingSongIdsInAgenda = useMemo(() => {
    return new Set(agenda.filter(a => a.tipo === 'cancion' && a.songId).map(a => a.songId!));
  }, [agenda]);

  // Canciones filtradas en el modal
  const filteredSongs = useMemo(() => {
    return songs.filter(s => {
      const matchSearch = searchSongQuery === '' ||
        s.titulo.toLowerCase().includes(searchSongQuery.toLowerCase()) ||
        (s.tonalidad && s.tonalidad.toLowerCase().includes(searchSongQuery.toLowerCase())) ||
        (s.genero && s.genero.toLowerCase().includes(searchSongQuery.toLowerCase()));
      const matchFav = !onlyFavorites || !!s.favoritoGeneral;
      const alb = s.albumDisco || s.album || 'Singles / Sin Disco';
      const matchAlbum = selectedAlbumFilter === 'todos' || alb === selectedAlbumFilter;
      return matchSearch && matchFav && matchAlbum;
    });
  }, [songs, searchSongQuery, onlyFavorites, selectedAlbumFilter]);

  // Toggle canción en la selección múltiple (conservando orden de click)
  const toggleSongSelection = (id: string) => {
    setSelectedSongIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllFiltered = () => {
    setSelectedSongIds(prev => {
      const next = [...prev];
      filteredSongs.forEach(s => {
        if (!next.includes(s.id)) {
          next.push(s.id);
        }
      });
      return next;
    });
  };

  const clearSelection = () => setSelectedSongIds([]);

  // Duración total de canciones seleccionadas
  const selectedDurationSeconds = useMemo(() => {
    const set = new Set(selectedSongIds);
    return songs
      .filter(s => set.has(s.id))
      .reduce((acc, s) => acc + (s.duracionSegundos || 210), 0);
  }, [selectedSongIds, songs]);

  // Toggle objetivo
  const handleToggleObjetivo = (id: string) => {
    const updated = objetivos.map(o => (o.id === id ? { ...o, completado: !o.completado } : o));
    onUpdateRehearsal({ objetivos: updated });
  };

  const handleAddObjetivo = () => {
    if (!nuevoObjTexto.trim()) return;
    const nuevo: RehearsalObjective = {
      id: `obj-${Date.now()}`,
      texto: nuevoObjTexto.trim(),
      completado: false
    };
    onUpdateRehearsal({ objetivos: [...objetivos, nuevo] });
    setNuevoObjTexto('');
  };

  const handleDeleteObjetivo = (id: string) => {
    onUpdateRehearsal({ objetivos: objetivos.filter(o => o.id !== id) });
  };

  // Agenda mutations
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= agenda.length) return;
    
    setHistoryStack(prev => [...prev, agenda]);
    const newAgenda = [...agenda];
    const [moved] = newAgenda.splice(index, 1);
    newAgenda.splice(targetIndex, 0, moved);
    onUpdateRehearsal({ agenda: newAgenda });
  };

  // Drag and Drop Handler
  const handleDropItem = (targetIndex: number) => {
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) {
      setDraggedItemIndex(null);
      setDragOverItemIndex(null);
      return;
    }

    setHistoryStack(prev => [...prev, agenda]);
    const newAgenda = [...agenda];
    const [moved] = newAgenda.splice(draggedItemIndex, 1);
    newAgenda.splice(targetIndex, 0, moved);
    
    onUpdateRehearsal({ agenda: newAgenda });
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleUndoReorder = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, prev.length - 1));
    onUpdateRehearsal({ agenda: previous });
  };

  const handleDeleteAgendaItem = (id: string) => {
    setHistoryStack(prev => [...prev, agenda]);
    onUpdateRehearsal({ agenda: agenda.filter(a => a.id !== id) });
  };

  const handleUpdateAgendaItem = (id: string, updates: Partial<RehearsalAgendaItem>) => {
    const updated = agenda.map(a => (a.id === id ? { ...a, ...updates } : a));
    onUpdateRehearsal({ agenda: updated });
  };

  // Add Songs from Catalog in EXACT selection order
  const handleConfirmAddSongs = () => {
    if (selectedSongIds.length === 0) return;
    setHistoryStack(prev => [...prev, agenda]);

    const newItems: RehearsalAgendaItem[] = selectedSongIds.map(sId => {
      const s = songs.find(item => item.id === sId);
      const estMin = s?.duracionSegundos ? Math.ceil(s.duracionSegundos / 60) + 3 : 7;
      return {
        id: `ag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tipo: 'cancion',
        titulo: s?.titulo || 'Canción',
        songId: sId,
        duracionEstimadaMin: estMin,
        prioridad: 'media',
        enfoque: s?.tonalidad ? `Tonalidad: ${s.tonalidad} • BPM: ${s.bpm || '--'}` : ''
      };
    });

    onUpdateRehearsal({ agenda: [...agenda, ...newItems] });
    setSelectedSongIds([]);
    setShowAddSongModal(false);
  };

  // Add Custom Block
  const handleConfirmAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    setHistoryStack(prev => [...prev, agenda]);
    const titulo = blockTitulo.trim() || BLOCK_TYPES[blockTipo]?.label || 'Bloque';
    const newItem: RehearsalAgendaItem = {
      id: `ag-${Date.now()}`,
      tipo: blockTipo,
      titulo,
      duracionEstimadaMin: Number(blockDuracion) || 15,
      enfoque: blockEnfoque.trim() || undefined,
      prioridad: 'media'
    };
    onUpdateRehearsal({ agenda: [...agenda, newItem] });
    setBlockTitulo('');
    setBlockEnfoque('');
    setShowAddBlockModal(false);
  };

  // Import any Setlist from Band
  const handleImportSetlist = (setlist: Setlist, replace: boolean = false) => {
    if (!setlist.items || setlist.items.length === 0) {
      alert('El repertorio seleccionado no tiene temas.');
      return;
    }

    setHistoryStack(prev => [...prev, agenda]);

    const items: RehearsalAgendaItem[] = [];

    if (replace || agenda.length === 0) {
      items.push({
        id: `ag-warmup-${Date.now()}`,
        tipo: 'calentamiento',
        titulo: 'Calentamiento & Prueba de Sonido',
        duracionEstimadaMin: 15,
        enfoque: 'Chequeo de afinación y niveles de monitores'
      });
    }

    setlist.items.forEach((it, idx) => {
      if (it.tipoItem === 'cancion' || it.songId) {
        const s = songs.find(x => x.id === it.songId);
        items.push({
          id: `ag-st-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tipo: 'cancion',
          titulo: s?.titulo || it.tituloCustom || 'Canción',
          songId: it.songId,
          duracionEstimadaMin: s?.duracionSegundos ? Math.ceil(s.duracionSegundos / 60) + 3 : 7,
          enfoque: `Repertorio: ${setlist.nombre}`,
          prioridad: 'media'
        });
      } else {
        items.push({
          id: `ag-pausa-${idx}-${Date.now()}`,
          tipo: 'pausa',
          titulo: it.tituloCustom || 'Pausa / Intermedio',
          duracionEstimadaMin: 10
        });
      }
    });

    if (replace || agenda.length === 0) {
      items.push({
        id: `ag-outro-${Date.now()}`,
        tipo: 'outro',
        titulo: 'Repaso Final & Valoración',
        duracionEstimadaMin: 10
      });
    }

    onUpdateRehearsal({ agenda: replace ? items : [...agenda, ...items] });
    setShowImportSetlistModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Run-of-Show Stats & Direct Live Launch */}
      <div className="p-4 sm:p-5 rounded-[var(--r-l)] bg-gradient-to-r from-[var(--surface)] via-[#141413] to-[#1a1917] border border-[#2a2825] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[var(--r-s)] bg-amber-400/15 text-amber-400">
              <ListOrdered className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
              Orden del Día & Objetivos
            </h3>
          </div>
          <p className="text-xs text-text-[var(--ink-2)]">
            Añade temas en orden, reorganiza arrastrando y planifica los minutos exactos del ensayo.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)] text-amber-300 font-bold border border-[#2e2d2a]">
              ⏱ {totalMinutosEstimados} min estimados
            </span>
            <span className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)] text-zinc-300 border border-[#2e2d2a]">
              🎵 {cancionesCount} canciones
            </span>
            {pausasCount > 0 && (
              <span className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)] text-text-[var(--ink-2)] border border-[#2e2d2a]">
                ☕ {pausasCount} descansos
              </span>
            )}
            {historyStack.length > 0 && (
              <button
                type="button"
                onClick={handleUndoReorder}
                className="px-2.5 py-1 rounded-[var(--r-s)] bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border /30 transition-colors flex items-center gap-1 cursor-pointer"
                title="Deshacer el último cambio de orden o añadido"
              >
                <Undo2 className="w-3 h-3" />
                <span>Deshacer</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {setlists.length > 0 && (
            <button
              onClick={() => setShowImportSetlistModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[var(--r-m)] bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all text-xs font-mono font-bold cursor-pointer"
              title="Importar temas directamente de un repertorio o setlist de la banda"
            >
              <FolderInput className="w-3.5 h-3.5 text-purple-400" />
              <span>Cargar Repertorio</span>
            </button>
          )}

          <button
            onClick={onGoToLiveMode}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--r-m)] bg-gradient-to-r from-amber-400 to-amber-500 text-bg-[var(--surface)] font-mono font-black text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Modo Local en Vivo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Objectives & Quick Tips */}
        <div className="space-y-4">
          <div className="p-4 rounded-[var(--r-l)] bg-[#141413] border border-[#262522] shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-wider">
                  Objetivos del Ensayo
                </h4>
              </div>
              <span className="text-[10px] font-mono text-text-[var(--ink-2)]">
                {objetivos.filter(o => o.completado).length}/{objetivos.length}
              </span>
            </div>

            {/* List */}
            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
              {objetivos.length === 0 ? (
                <p className="text-xs text-neutral-500 italic py-2">
                  No hay objetivos marcados para esta sesión. Añade uno abajo.
                </p>
              ) : (
                objetivos.map(obj => (
                  <div
                    key={obj.id}
                    className={`flex items-start justify-between gap-2 p-2.5 rounded-[var(--r-m)] border transition-all ${
                      obj.completado
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-[var(--surface)] border-[var(--surface)] text-zinc-200 hover:'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleObjetivo(obj.id)}
                      className="flex items-start gap-2 text-left flex-1 cursor-pointer"
                    >
                      {obj.completado ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${obj.completado ? 'line-through opacity-70' : ''}`}>
                        {obj.texto}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteObjetivo(obj.id)}
                      className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Input to add objective */}
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Nuevo objetivo..."
                value={nuevoObjTexto}
                onChange={e => setNuevoObjTexto(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddObjetivo();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-[var(--r-m)] bg-[#1a1918] border border-[#2a2825] text-xs text-zinc-100 outline-none focus:"
              />
              <button
                type="button"
                onClick={handleAddObjetivo}
                className="px-3 py-1.5 rounded-[var(--r-m)] bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick tips */}
          <div className="p-4 rounded-[var(--r-l)] bg-[#141413] border border-[#262522] space-y-2">
            <h5 className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              💡 Consejos de Productividad
            </h5>
            <ul className="text-xs text-text-[var(--ink-2)] space-y-1.5 pl-4 list-disc font-sans">
              <li>Arrastra cualquier tema por el icono <GripVertical className="w-3 h-3 inline text-neutral-500" /> para cambiar el orden en 1 segundo.</li>
              <li>Al añadir canciones múltiples, pulsa en el orden deseado para insertarlas tal cual.</li>
              <li>Marca descansos de 5-10 min para oxigenar el oído y repasar detalles técnicos.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Run of Show Timeline with Drag & Drop */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-amber-400" />
              <span>Bloques y Canciones de la Sesión ({agenda.length})</span>
            </h4>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddBlockModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] bg-neutral-800 hover:bg-neutral-700 text-bg-[var(--sunken)] text-xs font-mono font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-text-[var(--ink-2)]" />
                <span>+ Bloque / Pausa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSongIds([]);
                  setShowAddSongModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-m)] bg-amber-400 text-bg-[var(--surface)] hover:bg-amber-300 text-xs font-mono font-bold shadow-sm shadow-amber-400/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Añadir Canciones</span>
              </button>
            </div>
          </div>

          {/* Agenda List with Drag and Drop */}
          {agenda.length === 0 ? (
            <div className="p-8 rounded-[var(--r-l)] bg-[#141413] border border-dashed border-[#2a2825] text-center space-y-3">
              <Disc3 className="w-10 h-10 text-neutral-600 mx-auto animate-spin-slow" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-300">El orden del día está vacío</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Añade canciones en el orden que quieras ensayar o carga un setlist completo con 1-clic.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSongIds([]);
                    setShowAddSongModal(true);
                  }}
                  className="px-4 py-2 rounded-[var(--r-m)] bg-amber-400 text-bg-[var(--surface)] text-xs font-mono font-bold hover:bg-amber-300 cursor-pointer shadow-md"
                >
                  + Añadir Canciones del Repertorio
                </button>
                {setlists.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowImportSetlistModal(true)}
                    className="px-4 py-2 rounded-[var(--r-m)] bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold hover:bg-purple-500/30 cursor-pointer"
                  >
                    ⚡ Cargar Repertorio Completo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {agenda.map((item, idx) => {
                const bType = BLOCK_TYPES[item.tipo] || BLOCK_TYPES.cancion;
                const isDragging = draggedItemIndex === idx;
                const isDragOver = dragOverItemIndex === idx;
                const matchedSong = item.songId ? songs.find(s => s.id === item.songId) : null;

                return (
                  <div
                    key={item.id}
                    draggable={true}
                    onDragStart={(e) => {
                      if (TRANSPARENT_DRAG_IMAGE) {
                        e.dataTransfer.setDragImage(TRANSPARENT_DRAG_IMAGE, 0, 0);
                      }
                      setDraggedItemIndex(idx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverItemIndex(idx);
                    }}
                    onDragLeave={() => {
                      if (dragOverItemIndex === idx) setDragOverItemIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropItem(idx);
                    }}
                    onDragEnd={() => {
                      setDraggedItemIndex(null);
                      setDragOverItemIndex(null);
                    }}
                    className={`p-3 sm:p-4 rounded-[var(--r-m)] border transition-all ${
                      isDragging
                        ? 'opacity-30 scale-[0.98]'
                        : isDragOver
                        ? ' border-2 scale-[1.01] bg-amber-500/10 shadow-lg'
                        : item.evaluacion === 'bordada'
                        ? 'bg-[#141915] border-emerald-500/30 hover:border-emerald-500/50'
                        : item.evaluacion === 'repetir'
                        ? 'bg-[#1a1414] border-rose-500/30 hover:border-rose-500/50'
                        : 'bg-[#141413] border-[#262522] hover:'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Drag Handle, Number & Info */}
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-amber-400 transition-colors shrink-0 pt-1"
                          title="Arrastra para reordenar"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Number / Index */}
                        <div className="w-6 h-6 rounded-[var(--r-s)] bg-[#1a1918] border border-[#2a2825] flex items-center justify-center font-mono font-bold text-xs text-text-[var(--ink-2)] shrink-0">
                          {idx + 1}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold font-sans text-zinc-100 truncate">
                              {formatSongTitle(item.titulo)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold ${bType.bg} ${bType.text} border ${bType.border}`}>
                              {bType.icon} {bType.label}
                            </span>

                            {/* Song state info from catalog */}
                            {matchedSong?.tonalidad && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-amber-300/90 border ">
                                {matchedSong.tonalidad}
                              </span>
                            )}
                            {matchedSong?.bpm && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-text-[var(--ink-3)] border ">
                                {matchedSong.bpm} BPM
                              </span>
                            )}

                            {/* Evaluation badge if set */}
                            {item.evaluacion === 'bordada' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                🟢 Bordada
                              </span>
                            )}
                            {item.evaluacion === 'regular' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border /40">
                                🟡 Regular
                              </span>
                            )}
                            {item.evaluacion === 'repetir' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                🔴 Repetir
                              </span>
                            )}
                          </div>

                          {/* Focus Notes / Enfoque */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enfoque: ej. solo de guitarra, compenetrar coros, dinamismo..."
                              value={item.enfoque || ''}
                              onChange={e => handleUpdateAgendaItem(item.id, { enfoque: e.target.value })}
                              className="w-full text-xs font-mono text-text-[var(--ink-2)] bg-transparent border-b border-transparent hover: focus: outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Duration, Controls & Move */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-[#1a1918] border border-[#2a2825] px-2 py-1 rounded-[var(--r-s)]" title="Duración estimada en minutos">
                          <Clock className="w-3 h-3 text-text-[var(--ink-2)]" />
                          <input
                            type="number"
                            min="1"
                            max="180"
                            value={item.duracionEstimadaMin}
                            onChange={e =>
                              handleUpdateAgendaItem(item.id, {
                                duracionEstimadaMin: Math.max(1, Number(e.target.value))
                              })
                            }
                            className="w-8 text-xs font-mono font-bold text-amber-400 bg-transparent text-center outline-none"
                          />
                          <span className="text-[10px] font-mono text-neutral-500">m</span>
                        </div>

                        {/* Move Up / Down Buttons */}
                        <div className="flex items-center">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveItem(idx, 'up')}
                            className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-500 cursor-pointer"
                            title="Subir posición"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === agenda.length - 1}
                            onClick={() => handleMoveItem(idx, 'down')}
                            className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-500 cursor-pointer"
                            title="Bajar posición"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteAgendaItem(item.id)}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-[var(--r-s)] transition-colors cursor-pointer"
                          title="Eliminar de la agenda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: AÑADIR CANCIONES MÚLTIPLES EN EL ORDEN DE SELECCIÓN */}
      {showAddSongModal && (
        <ModalPortal isOpen={showAddSongModal} onClose={() => setShowAddSongModal(false)}>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fade-in">
            <div className="w-full max-w-2xl p-5 rounded-[var(--r-l)] shadow-2xl my-auto max-h-[92vh] flex flex-col border border-[#2a2825] bg-[#141413] text-white">
              <div className="flex justify-between items-center pb-3 border-b border-[var(--surface)]">
                <div className="flex items-center gap-2">
                  <Disc3 className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold font-mono uppercase text-white">
                      Añadir Canciones al Orden del Día
                    </h3>
                    <p className="text-[11px] text-text-[var(--ink-2)] font-mono">
                      Pulsa sobre las canciones en el orden en que quieras ensayarlas (#1, #2, #3...).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSongModal(false)}
                  className="p-1 rounded-[var(--r-s)] text-text-[var(--ink-2)] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-3 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={searchSongQuery}
                    onChange={(e) => setSearchSongQuery(e.target.value)}
                    placeholder="Buscar por título, tonalidad, género..."
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-[var(--r-m)] border border-[#2a2825] bg-[#1a1918] text-white focus:outline-none focus:"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedAlbumFilter}
                    onChange={(e) => setSelectedAlbumFilter(e.target.value)}
                    className="text-[10px] font-mono py-1.5 px-2.5 rounded-[var(--r-s)] focus:outline-none cursor-pointer border border-[#2a2825] bg-[#1a1918] text-amber-300 font-bold"
                  >
                    {albumsList.map(alb => (
                      <option key={alb} value={alb}>{alb === 'todos' ? 'Todos los álbumes' : alb}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setOnlyFavorites(p => !p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                      onlyFavorites
                        ? 'bg-amber-500/20 text-amber-300 border /40'
                        : 'bg-[#1a1918] text-text-[var(--ink-2)] border border-[#2a2825] hover:text-white'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span>Solo Favoritos</span>
                  </button>

                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="px-2.5 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold cursor-pointer bg-[#1a1918] text-text-[var(--ink-3)] border border-[#2a2825] hover:text-white transition-colors"
                  >
                    Seleccionar todo ({filteredSongs.length})
                  </button>

                  {selectedSongIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-2.5 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold cursor-pointer bg-[#1a1918] text-text-[var(--ink-2)] border border-[#2a2825] hover:text-white transition-colors"
                    >
                      Vaciar selección
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1 max-h-[50vh]">
                {filteredSongs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-500 font-mono">
                    No hay canciones que coincidan con el filtro.
                  </div>
                ) : (
                  filteredSongs.map(s => {
                    const selectedIndex = selectedSongIds.indexOf(s.id);
                    const isSelected = selectedIndex !== -1;
                    const alreadyInAgenda = existingSongIdsInAgenda.has(s.id);

                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSongSelection(s.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-[var(--r-m)] border text-left cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-400/15 /50 text-amber-300'
                            : 'bg-[var(--surface)] border-[var(--surface)] hover:bg-[#1e1d1b] hover:'
                        }`}
                      >
                        {/* Number in selection order */}
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 font-mono text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-amber-400  text-bg-[var(--surface)] shadow-sm scale-105'
                            : ' text-neutral-500'
                        }`}>
                          {isSelected ? (selectedIndex + 1) : null}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{formatSongTitle(s.titulo)}</span>
                            {s.favoritoGeneral && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                            {alreadyInAgenda && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-text-[var(--ink-2)] shrink-0">
                                Ya en agenda
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-extrabold shrink-0 ml-auto border /40">
                                #{selectedIndex + 1} en orden
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-text-[var(--ink-2)] font-mono truncate">
                            {(s.albumDisco || s.album || 'Sin álbum')} · {s.tonalidad || '—'} · {s.bpm ? `${s.bpm} BPM · ` : ''}{formatSecondsToMmSs(s.duracionSegundos || 0)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 mt-2 border-t border-[var(--surface)] flex items-center justify-between gap-3 shrink-0 bg-[#141413]">
                <span className="text-[10px] font-mono text-text-[var(--ink-2)]">
                  {selectedSongIds.length > 0
                    ? `${selectedSongIds.length} temas seleccionados en orden · ~${Math.ceil(selectedDurationSeconds / 60)} min`
                    : 'Ninguna canción seleccionada'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSongModal(false)}
                    className="px-4 py-2 rounded-[var(--r-m)] text-xs text-text-[var(--ink-2)] hover:text-white transition-colors font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={selectedSongIds.length === 0}
                    onClick={handleConfirmAddSongs}
                    className="px-5 py-2 rounded-[var(--r-m)] text-xs font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-bg-[var(--surface)] transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Añadir {selectedSongIds.length > 0 ? `${selectedSongIds.length} Canciones en Orden` : 'Canciones'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: CARGAR SETLIST COMPLETO */}
      {showImportSetlistModal && (
        <ModalPortal isOpen={showImportSetlistModal} onClose={() => setShowImportSetlistModal(false)}>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fade-in">
            <div className="w-full max-w-lg p-5 rounded-[var(--r-l)] shadow-2xl my-auto flex flex-col border border-[#2a2825] bg-[#141413] text-white">
              <div className="flex justify-between items-center pb-3 border-b border-[var(--surface)]">
                <div className="flex items-center gap-2">
                  <FolderInput className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold font-mono uppercase text-white">
                    Cargar Repertorio al Ensayo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportSetlistModal(false)}
                  className="p-1 rounded-[var(--r-s)] text-text-[var(--ink-2)] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <p className="text-xs text-text-[var(--ink-2)]">
                  Selecciona uno de los repertorios de la banda para volcar todas sus canciones y pausas automáticamente:
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {setlists.map(st => {
                    const count = st.items?.filter(it => it.tipoItem === 'cancion' || it.songId).length || 0;
                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-[var(--r-m)] border border-[#2a2825] bg-[var(--surface)] flex items-center justify-between gap-3 hover: transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-zinc-100">{st.nombre}</p>
                          <p className="text-[10px] font-mono text-text-[var(--ink-2)]">
                            {count} canciones · {st.tipoFormato || 'Repertorio'}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleImportSetlist(st, false)}
                            className="px-2.5 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-bg-[var(--sunken)] border  transition-colors cursor-pointer"
                            title="Añade las canciones al final de lo que ya tienes"
                          >
                            + Añadir al final
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImportSetlist(st, true)}
                            className="px-2.5 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors cursor-pointer"
                            title="Reemplaza el orden del día completo con este setlist"
                          >
                            Reemplazar todo
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[var(--surface)]">
                <button
                  type="button"
                  onClick={() => setShowImportSetlistModal(false)}
                  className="px-4 py-1.5 rounded-[var(--r-m)] text-xs font-mono text-text-[var(--ink-2)] hover:text-white"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal: Add Custom Block */}
      {showAddBlockModal && (
        <ModalPortal isOpen={showAddBlockModal} onClose={() => setShowAddBlockModal(false)}>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <form onSubmit={handleConfirmAddBlock} className="bg-[#141413] border border-[#2a2825] w-full max-w-md rounded-[var(--r-l)] shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-[var(--surface)]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-mono font-bold text-zinc-100 uppercase">
                    Añadir Bloque de Sesión
                  </h4>
                </div>
                <button type="button" onClick={() => setShowAddBlockModal(false)} className="text-text-[var(--ink-2)] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-mono font-bold text-text-[var(--ink-3)] uppercase mb-1">
                    Tipo de Bloque
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(BLOCK_TYPES).filter(([k]) => k !== 'cancion').map(([key, def]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setBlockTipo(key as any);
                          if (!blockTitulo) setBlockTitulo(def.label);
                        }}
                        className={`p-2.5 rounded-[var(--r-m)] border text-left flex items-center gap-2 text-xs font-mono transition-all cursor-pointer ${
                          blockTipo === key
                            ? 'bg-amber-400/20 /40 text-amber-300 font-bold'
                            : 'bg-[var(--surface)] border-[var(--surface)] text-text-[var(--ink-2)] hover:'
                        }`}
                      >
                        <span>{def.icon}</span>
                        <span className="truncate">{def.label.split('(')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-text-[var(--ink-3)] uppercase mb-1">
                    Título del Bloque
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Calentamiento & Sonido, Pausa café..."
                    value={blockTitulo}
                    onChange={e => setBlockTitulo(e.target.value)}
                    className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[#1a1918] border border-[#2a2825] text-xs text-zinc-100 outline-none focus:"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-text-[var(--ink-3)] uppercase mb-1">
                    Duración Estimada (Minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={blockDuracion}
                    onChange={e => setBlockDuracion(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[#1a1918] border border-[#2a2825] text-xs font-mono text-zinc-100 outline-none focus:"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-text-[var(--ink-3)] uppercase mb-1">
                    Enfoque / Instrucciones
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Ajustar retorno de monitores y afinación..."
                    value={blockEnfoque}
                    onChange={e => setBlockEnfoque(e.target.value)}
                    className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[#1a1918] border border-[#2a2825] text-xs text-zinc-100 outline-none focus:"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--surface)] bg-[#10100f]">
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono text-text-[var(--ink-2)] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold bg-amber-400 text-bg-[var(--surface)] hover:bg-amber-300 cursor-pointer shadow-md"
                >
                  Añadir Bloque
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
