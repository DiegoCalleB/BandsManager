import React, { useState } from 'react';
import { 
 Music, Layers, Disc3, Plus, ImagePlus, ChevronDown, 
 Check, HelpCircle
} from 'lucide-react';
import { ThemeColors, Setlist } from '../../types';
import { ModuleTutorialTrigger } from '../common/ModuleTutorialTrigger';

interface RepertorioNavBarProps {
 colors: ThemeColors
 activeTab:'catalogo' |'setlists';
 setActiveTab: (tab:'catalogo' |'setlists') => void;
 catalogoViewMode:'albumes' |'canciones';
 setCatalogoViewMode: (mode:'albumes' |'canciones') => void;
 setlists: Setlist[];
 activeSetlistId: string;
 onSelectSetlist: (id: string) => void;
 onCreateSetlist: () => void;
 onImportSetlist: () => void;
 onOpenNewSongModal: () => void;
 onOpenNewAlbumModal: () => void;
 songCount: number;
 albumCount: number;
 onOpenTutorial?: () => void;
}

export const RepertorioNavBar: React.FC<RepertorioNavBarProps> = ({
 colors,
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
 onOpenTutorial
}) => {
 const [showSetlistDropdown, setShowSetlistDropdown] = useState(false);
 const activeSetlist = setlists.find(s => s.id === activeSetlistId) || setlists[0];

 return (
 <header className={`px-3 py-2.5 sm:px-4 sm:py-3.5 rounded-[var(--r-l)] ${'bg-[var(--surface)]'} space-y-2.5`}>
 {/* Top Row: Title + 2 Main Pillars (Setlists vs Discografía) */}
 <div className="flex items-center justify-between gap-2">
 {/* Module Title */}
 <div className="flex items-center gap-2.5 min-w-0">
 <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--r-m)] flex items-center justify-center font-bold shrink-0 ${
' bg-[var(--acc)]/15 text-[var(--acc)]'
 }`}>
 <Music className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
 </div>
 <div className="min-w-0">
 <h1 className={`text-base sm:text-lg font-bold tracking-tight leading-none truncate ${'text-[var(--ink)]'}`}>
 Repertorios
 </h1>
 <p className="text-xs text-[var(--ink-2)] mt-1 hidden sm:block truncate font-normal">
 {activeTab ==='setlists' && `${setlists.length} setlists de directo`}
 {activeTab ==='catalogo' && `${songCount} canciones · ${albumCount} álbumes y EPs`}
 </p>
 </div>
 </div>

 {/* 2-Pill Segmented View Switcher & Tutorial Trigger */}
 <div className="flex items-center gap-1.5 shrink-0">
 {onOpenTutorial && (
 <div className="hidden xs:block">
 <ModuleTutorialTrigger
 moduleId="repertorio"
 onClick={onOpenTutorial}
 variant="compact"
 label="Guía"
 />
 </div>
 )}

 <nav aria-label="Vistas principales de repertorio" className={`p-1 rounded-[var(--r-m)] flex items-center gap-1 ${'bg-[var(--sunken)]'}`}>
 <button
 id="tab-btn-setlists"
 type="button"
 onClick={() => setActiveTab('setlists')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
 activeTab ==='setlists'
 ?' bg-[var(--acc)] text-[var(--on-acc)] font-bold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] font-medium'
 }`}
 >
 <Layers className="w-3.5 h-3.5" />
 <span>Setlists</span>
 <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
 activeTab ==='setlists' && !'bg-[var(--acc-ink)]/20 text-[var(--acc-ink)]'
 }`}>
 {setlists.length}
 </span>
 </button>

 <button
 id="tab-btn-catalogo"
 type="button"
 onClick={() => setActiveTab('catalogo')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
 activeTab ==='catalogo'
 ?' bg-[var(--acc)] text-[var(--on-acc)] font-bold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] font-medium'
 }`}
 >
 <Disc3 className="w-3.5 h-3.5" />
 <span>Discografía</span>
 <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
 activeTab ==='catalogo' && !'bg-[var(--acc-ink)]/20 text-[var(--acc-ink)]'
 }`}>
 {songCount}
 </span>
 </button>
 </nav>
 </div>
 </div>

 {/* Sub Row: Contextual Quick Actions */}
 <div className={`flex items-center justify-between gap-2 pt-1.5 ${''}`}>
 {activeTab ==='setlists' && (
 <>
 {/* Quick Setlist Switcher (Dropdown for 1-click change) */}
 <div className="relative flex-1 min-w-0 max-w-md">
 <button
 type="button"
 onClick={() => setShowSetlistDropdown(v => !v)}
 className={`w-full px-3 py-1.5 rounded-[var(--r-m)] text-left flex items-center justify-between gap-2 text-xs font-medium transition-all cursor-pointer ${
 'bg-[var(--surface)] text-[var(--ink)] hover:'
 }`}
 >
 <div className="flex items-center gap-2 min-w-0">
 <span className="text-[var(--acc)] font-bold shrink-0">📋</span>
 <span className="font-semibold truncate text-[var(--ink)]">
 {activeSetlist ? activeSetlist.nombre :'Seleccionar repertorio'}
 </span>
 {activeSetlist && (
 <span className="text-[11px] text-[var(--ink-2)] shrink-0 hidden sm:inline">
 ({activeSetlist.items.filter(i => i.tipoItem ==='cancion').length} temas)
 </span>
 )}
 </div>
 <ChevronDown className={`w-3.5 h-3.5 text-[var(--ink-2)] shrink-0 transition-transform ${showSetlistDropdown ?'rotate-180' :''}`} />
 </button>

 {/* Setlist Dropdown List */}
 {showSetlistDropdown && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setShowSetlistDropdown(false)} />
 <div className={`absolute left-0 top-full mt-1.5 z-50 w-full sm:w-80 max-h-72 overflow-y-auto rounded-[var(--r-m)] p-1.5 space-y-1 text-xs ${
 'bg-[var(--surface)] text-[var(--ink)]'
 }`}>
 <div className="px-2.5 py-1.5 text-[11px] tracking-wider text-[var(--ink-2)] font-semibold flex items-center justify-between">
 <span>Tus Setlists ({setlists.length})</span>
 <button
 type="button"
 onClick={() => {
 setShowSetlistDropdown(false);
 onCreateSetlist();
 }}
 className="text-[var(--acc)] hover:text-[var(--acc)]/70 flex items-center gap-1 cursor-pointer font-bold"
 >
 <Plus className="w-3 h-3" /> Nuevo
 </button>
 </div>

 {setlists.map((sl) => {
 const isSelected = sl.id === activeSetlistId;
 const songItems = sl.items.filter(i => i.tipoItem ==='cancion');
 return (
 <button
 key={sl.id}
 type="button"
 onClick={() => {
 onSelectSetlist(sl.id);
 setShowSetlistDropdown(false);
 }}
 className={`w-full text-left px-2.5 py-2 rounded-[var(--r-s)] flex items-center justify-between gap-2 transition cursor-pointer ${
 isSelected
 ?'bg-[var(--acc)]/15 text-[var(--acc)]/70 font-semibold'
 : 'text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 }`}
 >
 <div className="min-w-0 truncate">
 <span className="truncate">{sl.nombre}</span>
 <div className="text-[11px] opacity-65 font-normal mt-0.5">
 {songItems.length} temas {sl.tipoFormato ? `• ${sl.tipoFormato.replace('_','')}` :''}
 </div>
 </div>
 {isSelected && <Check className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />}
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
 id="btn-create-setlist"
 type="button"
 onClick={onCreateSetlist}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
 title="Crear un nuevo setlist de concierto"
 >
 <Plus className="w-3.5 h-3.5" />
 <span className="hidden xs:inline">Nuevo Setlist</span>
 </button>

 <button
 type="button"
 onClick={onImportSetlist}
 className={`p-1.5 rounded-[var(--r-m)] transition cursor-pointer ${
 'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}
 title="Importar repertorio desde foto o PDF impreso"
 >
 <ImagePlus className="w-4 h-4" />
 </button>
 </div>
 </>
 )}

 {activeTab ==='catalogo' && (
 <div className="flex items-center justify-between w-full gap-2">
 {/* Sub-view switcher inside Catálogo */}
 <div className={`hidden md:flex items-center gap-1 p-0.5 rounded-[var(--r-m)] shrink-0 ${
 'bg-[var(--sunken)]'
 }`}>
 <button
 id="btn-subtab-albumes"
 type="button"
 onClick={() => setCatalogoViewMode('albumes')}
 className={`px-3 py-1 rounded-[var(--r-s)] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
 catalogoViewMode ==='albumes'
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 font-bold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Disc3 className="w-3.5 h-3.5" />
 <span>Por Álbumes / EPs ({albumCount})</span>
 </button>
 <button
 id="btn-subtab-canciones"
 type="button"
 onClick={() => setCatalogoViewMode('canciones')}
 className={`px-3 py-1 rounded-[var(--r-s)] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
 catalogoViewMode ==='canciones'
 ?'bg-[var(--ok)]/20 text-[var(--ink-2)] font-bold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Music className="w-3.5 h-3.5" />
 <span>Todas las Canciones ({songCount})</span>
 </button>
 </div>

 {/* Mobile indicator for quick context */}
 <div className="md:hidden text-xs text-[var(--ink-2)] truncate">
 <span>{songCount} temas</span>
 <span className="opacity-50 mx-1">·</span>
 <span>{albumCount} discos</span>
 </div>

 {/* Quick Actions for Catálogo */}
 <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
 <button
 id="btn-add-song"
 type="button"
 onClick={onOpenNewSongModal}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
 >
 <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
 <span>Nueva Canción</span>
 </button>
 <button
 id="btn-add-album"
 type="button"
 onClick={onOpenNewAlbumModal}
 className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shrink-0 ${
 'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}
 >
 <Disc3 className="w-3.5 h-3.5 stroke-[2.5]" />
 <span className="hidden xs:inline">Nuevo Álbum</span>
 </button>
 </div>
 </div>
 )}
 </div>
 </header>
 );
};
