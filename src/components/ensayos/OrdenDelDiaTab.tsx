import React, { useState, useMemo } from "react";
import {
  Plus,
  Disc3,
  Clock,
  CheckSquare,
  Square,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Coffee,
  Play,
  Music,
  Flame,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Volume2,
  ListOrdered,
  GripVertical,
  Search,
  Star,
  Undo2,
  FolderInput,
  FlameKindling,
} from "lucide-react";
import {
  Rehearsal,
  RehearsalAgendaItem,
  RehearsalObjective,
  Song,
  Setlist,
  Concert,
  ThemeColors,
} from "../../types";
import { formatSongTitle } from "../../utils/formatSongTitle";
import { formatSecondsToMmSs } from "../../utils/repertorioUtils";
import { ModalPortal } from "../common/ModalPortal";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";

interface OrdenDelDiaTabProps {
  rehearsal: Rehearsal;
  onUpdateRehearsal: (updated: Partial<Rehearsal>) => void;
  songs: Song[];
  setlists: Setlist[];
  nextConcert?: Concert | null;
  colors?: ThemeColors;
  onGoToLiveMode: () => void;
}

const BLOCK_TYPES: Record<
  string,
  { label: string; icon: string; bg: string; text: string }
> = {
  cancion: {
    label: "Canción de Repertorio",
    icon: "🎵",
    bg: "bg-[var(--acc)]/10",
    text: "text-[var(--acc)]",
  },
  calentamiento: {
    label: "Calentamiento / Sonido",
    icon: "🔥",
    bg: "bg-[var(--acc)]/10",
    text: "text-[var(--acc)]/80",
  },
  pausa: {
    label: "Pausa / Descanso / Birra",
    icon: "☕",
    bg: "bg-[var(--surface)]/80",
    text: "text-[var(--ink-2)]",
  },
  seccion_especifica: {
    label: "Sección Específica (Solo, Coros, Intro)",
    icon: "🎯",
    bg: "bg-[var(--tentative)]/10",
    text: "text-[var(--acc)]",
  },
  improvisacion: {
    label: "Jam / Improvisación / Riff",
    icon: "🎸",
    bg: "bg-[var(--ok)]/10",
    text: "text-[var(--ok)]",
  },
  outro: {
    label: "Repaso Final / Feedback",
    icon: "🏁",
    bg: "bg-[var(--acc)]/10",
    text: "text-[var(--ink-2)]",
  },
};

// 1x1 transparent drag ghost image
const TRANSPARENT_DRAG_IMAGE =
  typeof window !== "undefined" ? new window.Image() : null;
if (TRANSPARENT_DRAG_IMAGE) {
  TRANSPARENT_DRAG_IMAGE.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7";
}

export function OrdenDelDiaTab({
  rehearsal,
  onUpdateRehearsal,
  songs = [],
  setlists = [],
  nextConcert,
  colors,
  onGoToLiveMode,
}: OrdenDelDiaTabProps) {
  const agenda = rehearsal.agenda || [];
  const objetivos = rehearsal.objetivos || [];

  // Modales
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showImportSetlistModal, setShowImportSetlistModal] = useState(false);

  // Multi-song selection state
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [searchSongQuery, setSearchSongQuery] = useState("");
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState("todos");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Drag and drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(
    null,
  );
  const [historyStack, setHistoryStack] = useState<RehearsalAgendaItem[][]>([]);

  // Custom block form state
  const [blockTipo, setBlockTipo] =
    useState<RehearsalAgendaItem["tipo"]>("calentamiento");
  const [blockTitulo, setBlockTitulo] = useState("");
  const [blockDuracion, setBlockDuracion] = useState(15);
  const [blockEnfoque, setBlockEnfoque] = useState("");

  // Nuevo objetivo rápido
  const [nuevoObjTexto, setNuevoObjTexto] = useState("");

  // Estadísticas del orden del día
  const totalMinutosEstimados = agenda.reduce(
    (acc, item) => acc + (item.duracionEstimadaMin || 0),
    0,
  );
  const cancionesCount = agenda.filter(
    (item) => item.tipo === "cancion",
  ).length;
  const pausasCount = agenda.filter((item) => item.tipo === "pausa").length;

  // Lista de álbumes para el filtro del modal
  const albumsList = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => {
      const alb = s.albumDisco || s.album;
      set.add(alb || "Singles / Sin Disco");
    });
    return ["todos", ...Array.from(set)];
  }, [songs]);

  // Existing songs in agenda
  const existingSongIdsInAgenda = useMemo(() => {
    return new Set(
      agenda
        .filter((a) => a.tipo === "cancion" && a.songId)
        .map((a) => a.songId!),
    );
  }, [agenda]);

  // Canciones filtradas en el modal
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      const matchSearch =
        searchSongQuery === "" ||
        s.titulo.toLowerCase().includes(searchSongQuery.toLowerCase()) ||
        (s.tonalidad &&
          s.tonalidad.toLowerCase().includes(searchSongQuery.toLowerCase())) ||
        (s.genero &&
          s.genero.toLowerCase().includes(searchSongQuery.toLowerCase()));
      const matchFav = !onlyFavorites || !!s.favoritoGeneral;
      const alb = s.albumDisco || s.album || "Singles / Sin Disco";
      const matchAlbum =
        selectedAlbumFilter === "todos" || alb === selectedAlbumFilter;
      return matchSearch && matchFav && matchAlbum;
    });
  }, [songs, searchSongQuery, onlyFavorites, selectedAlbumFilter]);

  // Toggle canción en la selección múltiple (conservando orden de click)
  const toggleSongSelection = (id: string) => {
    setSelectedSongIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllFiltered = () => {
    setSelectedSongIds((prev) => {
      const next = [...prev];
      filteredSongs.forEach((s) => {
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
      .filter((s) => set.has(s.id))
      .reduce((acc, s) => acc + (s.duracionSegundos || 210), 0);
  }, [selectedSongIds, songs]);

  // Toggle objetivo
  const handleToggleObjetivo = (id: string) => {
    const updated = objetivos.map((o) =>
      o.id === id ? { ...o, completado: !o.completado } : o,
    );
    onUpdateRehearsal({ objetivos: updated });
  };

  const handleAddObjetivo = () => {
    if (!nuevoObjTexto.trim()) return;
    const nuevo: RehearsalObjective = {
      id: `obj-${Date.now()}`,
      texto: nuevoObjTexto.trim(),
      completado: false,
    };
    onUpdateRehearsal({ objetivos: [...objetivos, nuevo] });
    setNuevoObjTexto("");
  };

  const handleDeleteObjetivo = (id: string) => {
    onUpdateRehearsal({ objetivos: objetivos.filter((o) => o.id !== id) });
  };

  // Agenda mutations
  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= agenda.length) return;

    setHistoryStack((prev) => [...prev, agenda]);
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

    setHistoryStack((prev) => [...prev, agenda]);
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
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    onUpdateRehearsal({ agenda: previous });
  };

  const handleDeleteAgendaItem = (id: string) => {
    setHistoryStack((prev) => [...prev, agenda]);
    onUpdateRehearsal({ agenda: agenda.filter((a) => a.id !== id) });
  };

  const handleUpdateAgendaItem = (
    id: string,
    updates: Partial<RehearsalAgendaItem>,
  ) => {
    const updated = agenda.map((a) => (a.id === id ? { ...a, ...updates } : a));
    onUpdateRehearsal({ agenda: updated });
  };

  // Add Songs from Catalog in EXACT selection order
  const handleConfirmAddSongs = () => {
    if (selectedSongIds.length === 0) return;
    setHistoryStack((prev) => [...prev, agenda]);

    const newItems: RehearsalAgendaItem[] = selectedSongIds.map((sId) => {
      const s = songs.find((item) => item.id === sId);
      const estMin = s?.duracionSegundos
        ? Math.ceil(s.duracionSegundos / 60) + 3
        : 7;
      return {
        id: `ag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tipo: "cancion",
        titulo: s?.titulo || "Canción",
        songId: sId,
        duracionEstimadaMin: estMin,
        prioridad: "media",
        enfoque: s?.tonalidad
          ? `Tonalidad: ${s.tonalidad} • BPM: ${s.bpm || "--"}`
          : "",
      };
    });

    onUpdateRehearsal({ agenda: [...agenda, ...newItems] });
    setSelectedSongIds([]);
    setShowAddSongModal(false);
  };

  // Add Custom Block
  const handleConfirmAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    setHistoryStack((prev) => [...prev, agenda]);
    const titulo =
      blockTitulo.trim() || BLOCK_TYPES[blockTipo]?.label || "Bloque";
    const newItem: RehearsalAgendaItem = {
      id: `ag-${Date.now()}`,
      tipo: blockTipo,
      titulo,
      duracionEstimadaMin: Number(blockDuracion) || 15,
      enfoque: blockEnfoque.trim() || undefined,
      prioridad: "media",
    };
    onUpdateRehearsal({ agenda: [...agenda, newItem] });
    setBlockTitulo("");
    setBlockEnfoque("");
    setShowAddBlockModal(false);
  };

  // Import any Setlist from Band
  const handleImportSetlist = (setlist: Setlist, replace: boolean = false) => {
    if (!setlist.items || setlist.items.length === 0) {
      alert("El repertorio seleccionado no tiene temas.");
      return;
    }

    setHistoryStack((prev) => [...prev, agenda]);

    const items: RehearsalAgendaItem[] = [];

    if (replace || agenda.length === 0) {
      items.push({
        id: `ag-warmup-${Date.now()}`,
        tipo: "calentamiento",
        titulo: "Calentamiento & Prueba de Sonido",
        duracionEstimadaMin: 15,
        enfoque: "Chequeo de afinación y niveles de monitores",
      });
    }

    setlist.items.forEach((it, idx) => {
      if (it.tipoItem === "cancion" || it.songId) {
        const s = songs.find((x) => x.id === it.songId);
        items.push({
          id: `ag-st-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tipo: "cancion",
          titulo: s?.titulo || it.tituloCustom || "Canción",
          songId: it.songId,
          duracionEstimadaMin: s?.duracionSegundos
            ? Math.ceil(s.duracionSegundos / 60) + 3
            : 7,
          enfoque: `Repertorio: ${setlist.nombre}`,
          prioridad: "media",
        });
      } else {
        items.push({
          id: `ag-pausa-${idx}-${Date.now()}`,
          tipo: "pausa",
          titulo: it.tituloCustom || "Pausa / Intermedio",
          duracionEstimadaMin: 10,
        });
      }
    });

    if (replace || agenda.length === 0) {
      items.push({
        id: `ag-outro-${Date.now()}`,
        tipo: "outro",
        titulo: "Repaso Final & Valoración",
        duracionEstimadaMin: 10,
      });
    }

    onUpdateRehearsal({ agenda: replace ? items : [...agenda, ...items] });
    setShowImportSetlistModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Run-of-Show Stats & Direct Live Launch */}
      <div className="p-4 sm:p-5 rounded-[var(--r-l)] bg-[var(--surface)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[var(--r-s)] bg-[var(--acc)]/60 text-[var(--acc)]">
              <ListOrdered className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-sans font-bold text-[var(--ink)]">
              Orden del Día & Objetivos
            </h3>
          </div>
          <p className="text-xs text-[var(--ink-2)]">
            Añade temas en orden, reorganiza arrastrando y planifica los minutos
            exactos del ensayo.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 font-sans text-xs">
            <span className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--acc)]/70 font-bold">
              ⏱ {totalMinutosEstimados} min estimados
            </span>
            <span className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink-2)]">
              🎵 {cancionesCount} canciones
            </span>
            {pausasCount > 0 && (
              <span className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink-2)]">
                ☕ {pausasCount} descansos
              </span>
            )}
            {historyStack.length > 0 && (
              <button
                type="button"
                onClick={handleUndoReorder}
                className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--acc)]/70 hover:bg-[var(--acc)]/25 transition-colors flex items-center gap-1 cursor-pointer"
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
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[var(--r-m)] bg-[var(--tentative)]/15 text-[var(--tentative)]/80 hover:bg-[var(--tentative)]/25 transition-ui text-xs font-sans font-bold cursor-pointer"
              title="Importar temas directamente de un repertorio o setlist de la banda"
            >
              <FolderInput className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Cargar Repertorio</span>
            </button>
          )}

          <button
            onClick={onGoToLiveMode}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)]  text-[var(--ink)] font-sans font-bold text-xs hover:brightness-110 transition-ui cursor-pointer active:scale-[0.97]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Modo Local en Vivo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Objectives & Quick Tips */}
        <div className="space-y-4">
          <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[var(--acc)]" />
                <h4 className="text-xs font-sans font-bold text-[var(--ink)]">
                  Objetivos del Ensayo
                </h4>
              </div>
              <span className="text-micro font-sans text-[var(--ink-2)]">
                {objetivos.filter((o) => o.completado).length}/
                {objetivos.length}
              </span>
            </div>

            {/* List */}
            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
              {objetivos.length === 0 ? (
                <p className="text-xs text-[var(--ink-2)] italic py-2">
                  No hay objetivos marcados para esta sesión. Añade uno abajo.
                </p>
              ) : (
                objetivos.map((obj) => (
                  <div
                    key={obj.id}
                    className={`flex items-start justify-between gap-2 p-2.5 rounded-[var(--r-m)] transition-ui ${
                      obj.completado
                        ? "bg-[var(--ok)]/10 text-[var(--ink-2)]"
                        : "bg-[var(--sunken)] text-[var(--ink)] hover:"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleObjetivo(obj.id)}
                      className="flex items-start gap-2 text-left flex-1 cursor-pointer"
                    >
                      {obj.completado ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-[var(--ink-2)] shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-xs ${obj.completado ? "line-through opacity-70" : ""}`}
                      >
                        {obj.texto}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteObjetivo(obj.id)}
                      className="text-[var(--ink-2)] hover:text-[var(--alert)] p-0.5 cursor-pointer"
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
                onChange={(e) => setNuevoObjTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddObjetivo();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs text-[var(--ink)] outline-none"
              />
              <button
                type="button"
                onClick={handleAddObjetivo}
                className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)]/60 hover:bg-[var(--acc)]/60 text-[var(--acc)]/70 text-xs font-sans font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick tips */}
          <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)] space-y-2">
            <h5 className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
              💡 Consejos de Productividad
            </h5>
            <ul className="text-xs text-[var(--ink-2)] space-y-1.5 pl-4 list-disc font-sans">
              <li>
                Arrastra cualquier tema por el icono{" "}
                <GripVertical className="w-3 h-3 inline text-[var(--ink-2)]" />{" "}
                para cambiar el orden en 1 segundo.
              </li>
              <li>
                Al añadir canciones múltiples, pulsa en el orden deseado para
                insertarlas tal cual.
              </li>
              <li>
                Marca descansos de 5-10 min para oxigenar el oído y repasar
                detalles técnicos.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Run of Show Timeline with Drag & Drop */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-[var(--acc)]" />
              <span>Bloques y Canciones de la Sesión ({agenda.length})</span>
            </h4>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddBlockModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] text-xs font-sans font-bold transition-ui cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                <span>+ Bloque / Pausa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSongIds([]);
                  setShowAddSongModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)]/60 text-[var(--ink)] hover:bg-[var(--acc)] text-xs font-sans font-bold transition-ui cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Añadir Canciones</span>
              </button>
            </div>
          </div>

          {/* Agenda List with Drag and Drop */}
          {agenda.length === 0 ? (
            <div className="p-8 rounded-[var(--r-l)] bg-[var(--surface)] text-center space-y-3">
              <Disc3 className="w-10 h-10 text-[var(--ink-2)] mx-auto animate-spin-slow" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--ink-2)]">
                  El orden del día está vacío
                </p>
                <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto">
                  Añade canciones en el orden que quieras ensayar o carga un
                  setlist completo con 1-clic.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSongIds([]);
                    setShowAddSongModal(true);
                  }}
                  className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--acc)]/60 text-[var(--ink)] text-xs font-sans font-bold hover:bg-[var(--acc)] cursor-pointer"
                >
                  + Añadir Canciones del Repertorio
                </button>
                {setlists.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowImportSetlistModal(true)}
                    className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--tentative)]/20 text-[var(--tentative)]/80 text-xs font-sans font-bold hover:bg-[var(--tentative)]/30 cursor-pointer"
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
                const matchedSong = item.songId
                  ? songs.find((s) => s.id === item.songId)
                  : null;

                return (
                  <div
                    key={item.id}
                    draggable={true}
                    onDragStart={(e) => {
                      if (TRANSPARENT_DRAG_IMAGE) {
                        e.dataTransfer.setDragImage(
                          TRANSPARENT_DRAG_IMAGE,
                          0,
                          0,
                        );
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
                    className={`p-3 sm:p-4 rounded-[var(--r-m)] transition-ui ${
                      isDragging
                        ? "opacity-30 scale-[0.98]"
                        : isDragOver
                          ? "scale-[1.01] bg-[var(--acc)]/10"
                          : item.evaluacion === "bordada"
                            ? "bg-[var(--surface)]/30 hover:bg-[var(--ok-soft)]"
                            : item.evaluacion === "repetir"
                              ? "bg-[var(--surface)]/30 hover:bg-[var(--alert)]/10"
                              : "bg-[var(--surface)] hover:"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Drag Handle, Number & Info */}
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors shrink-0 pt-1"
                          title="Arrastra para reordenar"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Number / Index */}
                        <div className="w-6 h-6 rounded-[var(--r-s)] bg-[var(--sunken)] flex items-center justify-center font-sans font-bold text-xs text-[var(--ink-2)] shrink-0">
                          {idx + 1}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold font-sans text-[var(--ink)] truncate">
                              {formatSongTitle(item.titulo)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold ${bType.bg} ${bType.text}`}
                            >
                              {bType.icon} {bType.label}
                            </span>

                            {/* Song state info from catalog */}
                            {matchedSong?.tonalidad && (
                              <span className="px-1.5 py-0.5 rounded text-micro font-sans bg-[var(--surface)]/80 text-[var(--acc)]/70">
                                {matchedSong.tonalidad}
                              </span>
                            )}
                            {matchedSong?.bpm && (
                              <span className="px-1.5 py-0.5 rounded text-micro font-sans bg-[var(--surface)]/80 text-[var(--ink-2)]">
                                {matchedSong.bpm} BPM
                              </span>
                            )}

                            {/* Evaluation badge if set */}
                            {item.evaluacion === "bordada" && (
                              <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--ok)]/20 text-[var(--ink-2)]">
                                🟢 Bordada
                              </span>
                            )}
                            {item.evaluacion === "regular" && (
                              <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70">
                                🟡 Regular
                              </span>
                            )}
                            {item.evaluacion === "repetir" && (
                              <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--alert)]/20 text-[var(--ink-2)]">
                                🔴 Repetir
                              </span>
                            )}
                          </div>

                          {/* Focus Notes / Enfoque */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enfoque: ej. solo de guitarra, compenetrar coros, dinamismo..."
                              value={item.enfoque || ""}
                              onChange={(e) =>
                                handleUpdateAgendaItem(item.id, {
                                  enfoque: e.target.value,
                                })
                              }
                              className="w-full text-xs font-sans text-[var(--ink-2)] bg-transparent hover:focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Duration, Controls & Move */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className="flex items-center gap-1 bg-[var(--sunken)] px-2 py-1 rounded-[var(--r-s)]"
                          title="Duración estimada en minutos"
                        >
                          <Clock className="w-3 h-3 text-[var(--ink-2)]" />
                          <input
                            type="number"
                            min="1"
                            max="180"
                            value={item.duracionEstimadaMin}
                            onChange={(e) =>
                              handleUpdateAgendaItem(item.id, {
                                duracionEstimadaMin: Math.max(
                                  1,
                                  Number(e.target.value),
                                ),
                              })
                            }
                            className="w-8 text-xs font-sans font-bold text-[var(--acc)] bg-transparent text-center outline-none"
                          />
                          <span className="text-micro font-sans text-[var(--ink-2)]">
                            m
                          </span>
                        </div>

                        {/* Move Up / Down Buttons */}
                        <div className="flex items-center">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveItem(idx, "up")}
                            className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-20 disabled:hover:text-[var(--ink-2)] cursor-pointer"
                            title="Subir posición"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === agenda.length - 1}
                            onClick={() => handleMoveItem(idx, "down")}
                            className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-20 disabled:hover:text-[var(--ink-2)] cursor-pointer"
                            title="Bajar posición"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteAgendaItem(item.id)}
                          className="p-1.5 text-[var(--ink-2)] hover:text-[var(--alert)] hover:bg-[var(--surface)]/80 rounded-[var(--r-s)] transition-colors cursor-pointer"
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
        <ModalPortal
          isOpen={showAddSongModal}
          onClose={() => setShowAddSongModal(false)}
        >
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-fade-in">
            <div className="w-full max-w-2xl p-5 rounded-[var(--r-l)] my-auto max-h-[92vh] flex flex-col bg-[var(--surface)] text-[var(--ink)]">
              <div className="flex justify-between items-center pb-3">
                <div className="flex items-center gap-2">
                  <Disc3 className="w-5 h-5 text-[var(--acc)]" />
                  <div>
                    <h3 className="text-sm font-bold font-sans text-[var(--ink)]">
                      Añadir Canciones al Orden del Día
                    </h3>
                    <p className="text-xs text-[var(--ink-2)] font-sans">
                      Pulsa sobre las canciones en el orden en que quieras
                      ensayarlas (#1, #2, #3...).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSongModal(false)}
                  className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-3 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)]" />
                  <input
                    type="text"
                    value={searchSongQuery}
                    onChange={(e) => setSearchSongQuery(e.target.value)}
                    placeholder="Buscar por título, tonalidad, género..."
                    className="w-full pl-8 pr-3 py-2 text-xs font-sans rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink)] focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedAlbumFilter}
                    onChange={(e) => setSelectedAlbumFilter(e.target.value)}
                    className="text-micro font-sans py-1.5 px-2.5 rounded-[var(--r-s)] focus:outline-none cursor-pointer bg-[var(--sunken)] text-[var(--acc)]/70 font-bold"
                  >
                    {albumsList.map((alb) => (
                      <option key={alb} value={alb}>
                        {alb === "todos" ? "Todos los álbumes" : alb}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setOnlyFavorites((p) => !p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-s)] text-micro font-sans font-bold cursor-pointer transition-colors ${
                      onlyFavorites
                        ? "bg-[var(--acc)]/20 text-[var(--acc)]/70"
                        : "bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <Star
                      className={`w-3 h-3 ${onlyFavorites ? "fill-[var(--acc)] text-[var(--acc)]" : ""}`}
                    />
                    <span>Solo Favoritos</span>
                  </button>

                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="px-2.5 py-1.5 rounded-[var(--r-s)] text-micro font-sans font-bold cursor-pointer bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                  >
                    Seleccionar todo ({filteredSongs.length})
                  </button>

                  {selectedSongIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-2.5 py-1.5 rounded-[var(--r-s)] text-micro font-sans font-bold cursor-pointer bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                    >
                      Vaciar selección
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1 max-h-[50vh]">
                {filteredSongs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <PublicoSilhouette opacity={0.12} size="small" />
                    <p className="mt-4 font-medium text-[var(--ink)] text-xs">
                      Sin canciones disponibles
                    </p>
                    <p className="mt-1.5 text-[var(--ink-2)] text-xs max-w-xs text-center">
                      Ajusta los filtros o añade canciones a tu repertorio.
                    </p>
                  </div>
                ) : (
                  filteredSongs.map((s) => {
                    const selectedIndex = selectedSongIds.indexOf(s.id);
                    const isSelected = selectedIndex !== -1;
                    const alreadyInAgenda = existingSongIdsInAgenda.has(s.id);

                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSongSelection(s.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-[var(--r-m)] text-left cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[var(--acc)]/60  text-[var(--acc)]/70"
                            : "bg-[var(--sunken)] hover:bg-[var(--surface)] hover:"
                        }`}
                      >
                        {/* Number in selection order */}
                        <div
                          className={`w-6 h-6 rounded-[var(--r-s)] flex items-center justify-center shrink-0 font-sans text-xs font-black transition-ui ${
                            isSelected
                              ? "bg-[var(--acc)]/60 text-[var(--ink)] scale-105"
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
                            {alreadyInAgenda && (
                              <span className="text-micro font-sans px-1.5 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--ink-2)] shrink-0">
                                Ya en agenda
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-micro font-sans px-1.5 py-0.5 rounded bg-[var(--acc)]/60 text-[var(--acc)]/70 font-extrabold shrink-0 ml-auto">
                                #{selectedIndex + 1} en orden
                              </span>
                            )}
                          </div>
                          <div className="text-micro text-[var(--ink-2)] font-sans truncate">
                            {s.albumDisco || s.album || "Sin álbum"} ·{" "}
                            {s.tonalidad || "—"} ·{" "}
                            {s.bpm ? `${s.bpm} BPM · ` : ""}
                            {formatSecondsToMmSs(s.duracionSegundos || 0)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 mt-2 flex items-center justify-between gap-3 shrink-0 bg-[var(--surface)]">
                <span className="text-micro font-sans text-[var(--ink-2)]">
                  {selectedSongIds.length > 0
                    ? `${selectedSongIds.length} temas seleccionados en orden · ~${Math.ceil(selectedDurationSeconds / 60)} min`
                    : "Ninguna canción seleccionada"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSongModal(false)}
                    className="px-4 py-2 rounded-[var(--r-m)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={selectedSongIds.length === 0}
                    onClick={handleConfirmAddSongs}
                    className="px-5 py-2 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)]/60 hover:bg-[var(--acc)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--ink)] transition-transform active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>
                      Añadir{" "}
                      {selectedSongIds.length > 0
                        ? `${selectedSongIds.length} Canciones en Orden`
                        : "Canciones"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: CARGAR SETLIST COMPLETO */}
      {showImportSetlistModal && (
        <ModalPortal
          isOpen={showImportSetlistModal}
          onClose={() => setShowImportSetlistModal(false)}
        >
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-fade-in">
            <div className="w-full max-w-lg p-5 rounded-[var(--r-l)] my-auto flex flex-col bg-[var(--surface)] text-[var(--ink)]">
              <div className="flex justify-between items-center pb-3">
                <div className="flex items-center gap-2">
                  <FolderInput className="w-5 h-5 text-[var(--acc)]" />
                  <h3 className="text-sm font-bold font-sans text-[var(--ink)]">
                    Cargar Repertorio al Ensayo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportSetlistModal(false)}
                  className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <p className="text-xs text-[var(--ink-2)]">
                  Selecciona uno de los repertorios de la banda para volcar
                  todas sus canciones y pausas automáticamente:
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {setlists.map((st) => {
                    const count =
                      st.items?.filter(
                        (it) => it.tipoItem === "cancion" || it.songId,
                      ).length || 0;
                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] flex items-center justify-between gap-3 hover:transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-[var(--ink)]">
                            {st.nombre}
                          </p>
                          <p className="text-micro font-sans text-[var(--ink-2)]">
                            {count} canciones · {st.tipoFormato || "Repertorio"}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleImportSetlist(st, false)}
                            className="px-2.5 py-1.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] transition-colors cursor-pointer"
                            title="Añade las canciones al final de lo que ya tienes"
                          >
                            + Añadir al final
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImportSetlist(st, true)}
                            className="px-2.5 py-1.5 rounded-[var(--r-s)] text-micro font-sans font-bold bg-[var(--tentative)]/20 hover:bg-[var(--tentative)]/30 text-[var(--tentative)]/80 transition-colors cursor-pointer"
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

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowImportSetlistModal(false)}
                  className="px-4 py-1.5 rounded-[var(--r-m)] text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)]"
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
        <ModalPortal
          isOpen={showAddBlockModal}
          onClose={() => setShowAddBlockModal(false)}
        >
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 animate-fade-in">
            <form
              onSubmit={handleConfirmAddBlock}
              className="bg-[var(--surface)] w-full max-w-md rounded-[var(--r-l)] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--acc)]" />
                  <h4 className="text-sm font-sans font-bold text-[var(--ink)]">
                    Añadir Bloque de Sesión
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="text-[var(--ink-2)] hover:text-[var(--ink)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                    Tipo de Bloque
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(BLOCK_TYPES)
                      .filter(([k]) => k !== "cancion")
                      .map(([key, def]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setBlockTipo(key as any);
                            if (!blockTitulo) setBlockTitulo(def.label);
                          }}
                          className={`p-2.5 rounded-[var(--r-m)] text-left flex items-center gap-2 text-xs font-sans transition-ui cursor-pointer ${
                            blockTipo === key
                              ? "bg-[var(--acc)]/60  text-[var(--acc)]/70 font-bold"
                              : "bg-[var(--sunken)] text-[var(--ink-2)] hover:"
                          }`}
                        >
                          <span>{def.icon}</span>
                          <span className="truncate">
                            {def.label.split("(")[0]}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                    Título del Bloque
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Calentamiento & Sonido, Pausa café..."
                    value={blockTitulo}
                    onChange={(e) => setBlockTitulo(e.target.value)}
                    className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs text-[var(--ink)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                    Duración Estimada (Minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={blockDuracion}
                    onChange={(e) => setBlockDuracion(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs font-sans text-[var(--ink)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-[var(--ink-2)] mb-1">
                    Enfoque / Instrucciones
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Ajustar retorno de monitores y afinación..."
                    value={blockEnfoque}
                    onChange={(e) => setBlockEnfoque(e.target.value)}
                    className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs text-[var(--ink)] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 bg-[var(--sunken)]">
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold bg-[var(--acc)]/60 text-[var(--ink)] hover:bg-[var(--acc)] cursor-pointer"
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
