import React, { useState } from 'react';
import { 
  Music, Layers, Disc3, Plus, ImagePlus, ChevronDown, 
  Check, SlidersHorizontal
} from 'lucide-react';
import { ThemeColors, Setlist } from '../../types';

interface RepertorioNavBarProps {
  colors: ThemeColors;
  isStitchLight: boolean;
  activeTab: 'catalogo' | 'setlists';
  setActiveTab: (tab: 'catalogo' | 'setlists') => void;
  catalogoViewMode: 'albumes' | 'canciones';
  setCatalogoViewMode: (mode: 'albumes' | 'canciones') => void;
  setlists: Setlist[];
  activeSetlistId: string;
  onSelectSetlist: (id: string) => void;
  onCreateSetlist: () => void;
  onImportSetlist: () => void;
  onOpenNewSongModal: () => void;
  onOpenNewAlbumModal: () => void;
  songCount: number;
  albumCount: number;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const RepertorioNavBar: React.FC<RepertorioNavBarProps> = ({
  colors,
  isStitchLight,
  activeTab,
  setActiveTab,
  catalogoViewMode,
  setCatalogoViewMode,
  setlists,
  activeSetlistId,
  onSelectSetlist,
  onCreateSetlist,
  onImportSetlist,
  onOpenNewSongModal,
  onOpenNewAlbumModal,
  songCount,
  albumCount,
  isSidebarCollapsed,
  onToggleSidebar
}) => {
  const [showSetlistDropdown, setShowSetlistDropdown] = useState(false);
  const activeSetlist = setlists.find(s => s.id === activeSetlistId) || setlists[0];

  return (
    <header className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${colors.card} border ${isStitchLight ? 'border-slate-200' : 'border-neutral-800'} space-y-2`}>
      {/* Top Row: Title + 2 Main Pillars (Setlists vs Catálogo & Discografía) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Module Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#d1b375]/15 text-[#d1b375] flex items-center justify-center font-bold">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h1 className={`text-base sm:text-lg font-display font-black tracking-tight leading-none ${isStitchLight ? 'text-slate-900' : 'text-zinc-100'}`}>
              Repertorios
            </h1>
            <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
              {activeTab === 'setlists' && `${setlists.length} setlists de directo`}
              {activeTab === 'catalogo' && `${songCount} canciones · ${albumCount} álbumes y EPs`}
            </p>
          </div>
        </div>

        {/* 2-Pill Segmented View Switcher */}
        <nav aria-label="Vistas principales de repertorio" className={`p-1 rounded-xl flex items-center gap-1 border ${isStitchLight ? 'bg-slate-100 border-slate-200' : 'bg-black/50 border-neutral-800'}`}>
          <button
            id="tab-btn-setlists"
            type="button"
            onClick={() => setActiveTab('setlists')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'setlists'
                ? isStitchLight
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'bg-neutral-800 text-[#f2ca50] shadow-md border border-[#f2ca50]/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Setlists</span>
            <span className="text-[10px] opacity-70 px-1 py-0.2 rounded bg-black/20">
              {setlists.length}
            </span>
          </button>

          <button
            id="tab-btn-catalogo"
            type="button"
            onClick={() => setActiveTab('catalogo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'catalogo'
                ? isStitchLight
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'bg-neutral-800 text-[#1db954] shadow-md border border-[#1db954]/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Discografía</span>
            <span className="text-[10px] opacity-70 px-1 py-0.2 rounded bg-black/20">
              {songCount}
            </span>
          </button>
        </nav>
      </div>

      {/* Sub Row: Contextual Quick Actions */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap sm:flex-nowrap">
        {activeTab === 'setlists' && (
          <>
            {/* Quick Setlist Switcher (Dropdown for 1-click change) */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-md">
              <button
                type="button"
                onClick={() => setShowSetlistDropdown(v => !v)}
                className={`w-full px-2.5 py-1.5 rounded-xl border text-left flex items-center justify-between gap-2 text-xs font-mono transition-all cursor-pointer ${
                  isStitchLight
                    ? 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                    : 'bg-neutral-900/90 border-neutral-700 text-neutral-200 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#d1b375] font-bold shrink-0">📋</span>
                  <span className="font-bold truncate text-white">
                    {activeSetlist ? activeSetlist.nombre : 'Seleccionar repertorio'}
                  </span>
                  {activeSetlist && (
                    <span className="text-[10px] text-neutral-400 shrink-0 hidden xs:inline">
                      ({activeSetlist.items.filter(i => i.tipoItem === 'cancion').length} temas)
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${showSetlistDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Setlist Dropdown List */}
              {showSetlistDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSetlistDropdown(false)} />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-full sm:w-80 max-h-72 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl p-1.5 space-y-1 text-xs font-mono">
                    <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
                      <span>Tus Setlists ({setlists.length})</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSetlistDropdown(false);
                          onCreateSetlist();
                        }}
                        className="text-[#d1b375] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Plus className="w-3 h-3" /> Nuevo
                      </button>
                    </div>

                    {setlists.map((sl) => {
                      const isSelected = sl.id === activeSetlistId;
                      const songItems = sl.items.filter(i => i.tipoItem === 'cancion');
                      return (
                        <button
                          key={sl.id}
                          type="button"
                          onClick={() => {
                            onSelectSetlist(sl.id);
                            setShowSetlistDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#d1b375]/20 text-[#f2ca50] border border-[#f2ca50]/30 font-bold'
                              : 'text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <div className="min-w-0 truncate">
                            <span className="truncate">{sl.nombre}</span>
                            <div className="text-[10px] opacity-60 font-normal">
                              {songItems.length} temas {sl.tipoFormato ? `• ${sl.tipoFormato.replace('_', ' ')}` : ''}
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#f2ca50] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Setlist Quick Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onCreateSetlist}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Crear un nuevo setlist de concierto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Nuevo Setlist</span>
              </button>

              <button
                type="button"
                onClick={onImportSetlist}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer"
                title="Importar repertorio desde foto o PDF impreso"
              >
                <ImagePlus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onToggleSidebar}
                className="hidden lg:flex items-center gap-1 p-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer text-xs font-mono"
                title={isSidebarCollapsed ? "Ver panel lateral de setlists" : "Ocultar panel lateral de setlists"}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[10px]">{isSidebarCollapsed ? 'Panel' : 'Cerrar'}</span>
              </button>
            </div>
          </>
        )}

        {activeTab === 'catalogo' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            {/* Sub-view switcher inside Catálogo */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-neutral-800 shrink-0">
              <button
                type="button"
                onClick={() => setCatalogoViewMode('albumes')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  catalogoViewMode === 'albumes'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Disc3 className="w-3.5 h-3.5" />
                <span>Por Álbumes / EPs ({albumCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setCatalogoViewMode('canciones')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  catalogoViewMode === 'canciones'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Todas las Canciones ({songCount})</span>
              </button>
            </div>

            {/* Quick Actions for Catálogo */}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onOpenNewSongModal}
                className="px-2.5 py-1.5 rounded-xl bg-[#1db954] hover:bg-[#1ed760] text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nueva Canción</span>
              </button>
              <button
                type="button"
                onClick={onOpenNewAlbumModal}
                className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Disc3 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">Nuevo Álbum / EP</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
