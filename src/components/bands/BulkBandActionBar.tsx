import React, { useState } from'react';
import { BandRelationshipStatus } from'../../types';
import { ModalPortal } from'../common/ModalPortal';
import { 
 CheckSquare, MinusSquare, Square, X, ChevronDown, Sparkles, Download, 
 Trash2, Star, CheckCircle2, Repeat, Clock, ArrowRight, 
 Users, ShieldAlert
} from'lucide-react';

interface BulkBandActionBarProps {
 selectedCount: number;
 totalFilteredCount: number;
 isAllSelected: boolean;
 onSelectAll: () => void;
 onDeselectAll: () => void;
 onBulkStatusChange: (status: BandRelationshipStatus) => void;
 onBulkGeneratePitch: () => void;
 onBulkToggleFavorite: (isFav: boolean) => void;
 onBulkExportCsv: () => void;
 onBulkDelete: () => void;
 isStitchLight?: boolean;
}

const BAND_STATUS_OPTIONS: { status: BandRelationshipStatus; label: string; color: string; icon: any }[] = [
 { status:'sin_contactar', label:'Sin Contactar', color:'bg-zinc-700/40 text-[var(--ink-2)] border-[var(--hair)]600', icon: Clock },
 { status:'intercambio_propuesto', label:'Intercambio Propuesto', color:'bg-sky-500/20 text-sky-300 border-sky-500/40', icon: Repeat },
 { status:'pendiente_respuesta', label:'Pendiente Respuesta', color:'bg-[var(--acc)]/20 text-[var(--acc)]/70 /40', icon: Clock },
 { status:'concierto_agendado', label:'Concierto / Bolo Agendado', color:'bg-emerald-500/30 text-[var(--ink)] border-emerald-400', icon: CheckCircle2 },
 { status:'colegas_aliados', label:'Colegas / Aliados de Gira', color:'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Users },
 { status:'no_disponible', label:'No Disponible / Descartado', color:'bg-rose-500/20 text-[var(--ink-2)] border-rose-500/40', icon: ShieldAlert },
];

export const BulkBandActionBar: React.FC<BulkBandActionBarProps> = ({
 selectedCount,
 totalFilteredCount,
 isAllSelected,
 onSelectAll,
 onDeselectAll,
 onBulkStatusChange,
 onBulkGeneratePitch,
 onBulkToggleFavorite,
 onBulkExportCsv,
 onBulkDelete,
 isStitchLight = false,
}) => {
 const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
 const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

 if (selectedCount === 0) return null;

 return (
 <>
 {/* Gmail-Style Sticky Top Actions Toolbar for Bands */}
 <div 
 id="bulk-band-action-bar"
 className={`sticky top-2 z-30 w-full mb-3 rounded-[var(--r-l)] shadow-xl backdrop-blur-md p-2.5 sm:p-3 transition-all animate-slide-up ${
 isStitchLight
 ?'bg-white/95 /60 text-[var(--ink)] shadow-slate-300/60'
 :'bg-[var(--surface)]/95 border-[var(--acc)]/50 text-[var(--ink)] shadow-black/80'
 }`}
 >
 <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
 
 {/* Left section: Checkbox toggle, counter badge and quick select */}
 <div className="flex items-center justify-between w-full md:w-auto gap-2.5">
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={isAllSelected ? onDeselectAll : onSelectAll}
 className={`p-1.5 rounded-[var(--r-s)] transition-colors cursor-pointer shrink-0 ${
 isStitchLight ?'hover:bg-[var(--sunken)] text-amber-700' :'hover:bg-zinc-800 text-[var(--acc)]'
 }`}
 title={isAllSelected ?'Deseleccionar todo' : `Seleccionar las ${totalFilteredCount} bandas`}
 >
 {isAllSelected ? (
 <CheckSquare className="w-5 h-5" />
 ) : selectedCount > 0 ? (
 <MinusSquare className="w-5 h-5" />
 ) : (
 <Square className="w-5 h-5 text-[var(--ink-2)]" />
 )}
 </button>

 <div className="flex items-center gap-2">
 <span className="w-6 h-6 rounded-[var(--r-s)] bg-[var(--acc)] text-black font-bold flex items-center justify-center text-xs shadow-xs font-mono shrink-0">
 {selectedCount}
 </span>
 <div className="leading-tight">
 <div className="text-xs font-bold font-display flex items-center gap-1.5 flex-wrap">
 <span>{selectedCount} {selectedCount === 1 ?'banda seleccionada' :'bandas seleccionadas'}</span>
 {!isAllSelected && totalFilteredCount > selectedCount && (
 <button
 type="button"
 onClick={onSelectAll}
 className="text-[11px] text-[var(--acc)] hover:underline font-mono cursor-pointer font-semibold underline-offset-2"
 title={`Seleccionar las ${totalFilteredCount} bandas`}
 >
 (Seleccionar las {totalFilteredCount})
 </button>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Quick close on mobile */}
 <button
 type="button"
 onClick={onDeselectAll}
 className={`md:hidden p-1.5 rounded-[var(--r-s)] transition-colors cursor-pointer ${
 isStitchLight ?'text-[var(--ink-3)] hover:bg-[var(--sunken)]' :'text-[var(--ink-2)] hover:bg-zinc-800 hover:text-[var(--ink)]'
 }`}
 title="Cerrar selección"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Right section: Gmail-Style Action Buttons */}
 <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full md:w-auto">
 
 {/* Status Change Dropdown */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
 className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
 isStitchLight
 ?'bg-amber-100 hover:bg-amber-200 text-amber-900'
 :'bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 /50 text-[var(--ink)]'
 }`}
 title="Cambiar estado de relación de las bandas seleccionadas"
 >
 <CheckCircle2 className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Estado</span>
 <ChevronDown className={`w-3.5 h-3.5 text-[var(--acc)] transition-transform ${isStatusDropdownOpen ?'rotate-180' :''}`} />
 </button>

 {/* Status Dropdown Menu (Opens downwards) */}
 {isStatusDropdownOpen && (
 <>
 <div
 className="fixed inset-0 z-40"
 onClick={() => setIsStatusDropdownOpen(false)}
 />
 <div className={`absolute top-full mt-2 right-0 z-50 w-60 rounded-[var(--r-l)] shadow-2xl p-2 space-y-1 animate-scale-up max-h-72 overflow-y-auto ${
 isStitchLight
 ?'bg-white shadow-slate-400/50'
 :'bg-[var(--surface)] border-[var(--hair)]700 shadow-black/90'
 }`}>
 <div className={`px-2 py-1 text-[10px] font-mono uppercase font-bold border-b ${
 isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)] border-[var(--hair)]800'
 }`}>
 Mover {selectedCount} bandas a:
 </div>
 {BAND_STATUS_OPTIONS.map((opt) => {
 const Icon = opt.icon;
 return (
 <button
 key={opt.status}
 type="button"
 onClick={() => {
 onBulkStatusChange(opt.status);
 setIsStatusDropdownOpen(false);
 }}
 className={`w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
 isStitchLight ?'hover:bg-[var(--sunken)]' :'hover:bg-zinc-800'
 } ${opt.color}`}
 >
 <Icon className="w-3.5 h-3.5 shrink-0" />
 <span className="truncate">{opt.label}</span>
 </button>
 );
 })}
 </div>
 </>
 )}
 </div>

 {/* AI Date Swap Generator */}
 <button
 type="button"
 onClick={onBulkGeneratePitch}
 className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
 isStitchLight
 ?'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-900'
 :'bg-gradient-to-r from-purple-950/80 to-purple-900/80 hover:from-purple-900 hover:to-purple-800 border-purple-500/50 text-purple-200'
 }`}
 title="Redactar propuestas de intercambio (Date Swaps) con IA"
 >
 <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
 <span className="hidden sm:inline">Swaps IA</span>
 <span className="sm:hidden">Swaps</span>
 </button>

 {/* Favorite toggle */}
 <button
 type="button"
 onClick={() => onBulkToggleFavorite(true)}
 className={`p-1.5 rounded-[var(--r-m)] text-xs transition-all cursor-pointer ${
 isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-amber-600'
 :'bg-zinc-800 hover:bg-zinc-700 border-[var(--hair)]700 text-[var(--acc)]/70'
 }`}
 title="Marcar bandas como favoritas"
 >
 <Star className="w-4 h-4 fill-amber-400/30 text-[var(--acc)]" />
 </button>

 {/* Export CSV */}
 <button
 type="button"
 onClick={onBulkExportCsv}
 className={`px-2.5 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer ${
 isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'
 :'bg-zinc-800 hover:bg-zinc-700 border-[var(--hair)]700 text-[var(--ink)]'
 }`}
 title="Exportar bandas seleccionadas a CSV"
 >
 <Download className="w-3.5 h-3.5" />
 <span className="hidden lg:inline">CSV</span>
 </button>

 {/* Delete button */}
 <button
 type="button"
 onClick={() => setIsConfirmDeleteOpen(true)}
 className="p-1.5 bg-[var(--alert-soft)] hover:bg-[var(--alert-soft)] text-[var(--ink-2)] rounded-[var(--r-m)] transition-all cursor-pointer"
 title={`Eliminar ${selectedCount} bandas`}
 >
 <Trash2 className="w-4 h-4 text-rose-400" />
 </button>

 {/* Deselect Close Button (Desktop) */}
 <button
 type="button"
 onClick={onDeselectAll}
 className={`hidden md:flex p-1.5 rounded-[var(--r-m)] transition-colors cursor-pointer ${
 isStitchLight ?'text-[var(--ink-3)] hover:bg-[var(--sunken)]' :'text-[var(--ink-2)] hover:bg-zinc-800 hover:text-[var(--ink)]'
 }`}
 title="Deseleccionar todo"
 >
 <X className="w-4 h-4" />
 </button>

 </div>
 </div>
 </div>

 {/* Confirmation Modal for Bulk Deletion */}
 <ModalPortal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)}>
 <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in">
 <div className="w-full max-w-md bg-[var(--surface)] rounded-[var(--r-l)] shadow-2xl p-5 space-y-4 my-auto">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-[var(--r-m)] bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
 <Trash2 className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold text-[var(--ink)] font-display">
 ¿Eliminar {selectedCount} bandas?
 </h3>
 <p className="text-xs text-[var(--ink-2)] font-mono">
 Esta acción eliminará los contactos de las bandas seleccionadas.
 </p>
 </div>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert-soft)] text-xs text-[var(--ink)] font-mono">
 ⚠️ Se borrarán definitivamente {selectedCount} bandas aliadas.
 </div>

 <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--hair)]800/80">
 <button
 type="button"
 onClick={() => setIsConfirmDeleteOpen(false)}
 className="px-3.5 py-2 rounded-[var(--r-m)] text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-[var(--ink-2)] transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={() => {
 setIsConfirmDeleteOpen(false);
 onBulkDelete();
 }}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-[var(--ink)] shadow-md transition-colors cursor-pointer"
 >
 Sí, eliminar {selectedCount}
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 </>
 );
};
