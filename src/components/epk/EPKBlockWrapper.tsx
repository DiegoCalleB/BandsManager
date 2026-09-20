import React from'react';
import { ChevronLeft, ChevronRight, Save } from'lucide-react';
import { EPKBlockMeta } from'./epkBlocks';

interface EPKBlockWrapperProps {
 meta: EPKBlockMeta;
 children: React.ReactNode;
 prevBlock?: EPKBlockMeta | null;
 nextBlock?: EPKBlockMeta | null;
 onNavigate?: (blockId: any) => void;
 onSave?: () => void;
 isAllView?: boolean;
}

export const EPKBlockWrapper: React.FC<EPKBlockWrapperProps> = ({
 meta,
 children,
 prevBlock,
 nextBlock,
 onNavigate,
 onSave,
 isAllView = false
}) => {
 const Icon = meta.icon;

 return (
 <div className="space-y-4 sm:space-y-6">
 {/* CABECERA DEL BLOQUE: visible en escritorio o cuando es vista continua'todo' */}
 <div className={`${isAllView ?'flex' :'hidden sm:flex'} items-center justify-between pb-3 border-b border-stone-800 flex-wrap gap-2`}>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-[var(--r-m)] bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
 <Icon className="w-4 h-4" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 {meta.number && (
 <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
 Bloque {meta.number} de 8
 </span>
 )}
 <h3 className="text-base font-bold text-white font-mono">
 {meta.label}
 </h3>
 </div>
 <p className="text-xs text-[var(--ink-3)] mt-0.5">
 {meta.description}
 </p>
 </div>
 </div>
 </div>

 {/* CONTENIDO DEL BLOQUE */}
 <div>
 {children}
 </div>

 {/* NAVEGACIÓN INFERIOR (SOLO CUANDO NO ES VISTA CONTINUA'TODO') */}
 {!isAllView && onNavigate && (
 <div className="flex items-center justify-between pt-4 sm:pt-5 border-t border-stone-800/80 gap-2 sm:gap-3">
 {prevBlock ? (
 <button
 type="button"
 onClick={() => {
 onNavigate(prevBlock.id);
 window.scrollTo({ top: 0, behavior:'smooth' });
 }}
 className="px-2.5 sm:px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-[var(--r-m)] text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition border-stone-800 cursor-pointer shrink-0"
 title={`Ir al bloque anterior: ${prevBlock.label}`}
 >
 <ChevronLeft className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Anterior: {prevBlock.shortLabel}</span>
 <span className="sm:hidden">Anterior</span>
 </button>
 ) : (
 <div />
 )}

 <div className="flex items-center gap-1.5 sm:gap-2.5">
 {onSave && (
 <button
 type="button"
 onClick={onSave}
 className="px-3 sm:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-[var(--r-m)] text-xs flex items-center gap-1.5 shadow transition cursor-pointer shrink-0"
 >
 <Save className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Guardar Cambios</span>
 <span className="sm:hidden">Guardar</span>
 </button>
 )}

 {nextBlock && (
 <button
 type="button"
 onClick={() => {
 onNavigate(nextBlock.id);
 window.scrollTo({ top: 0, behavior:'smooth' });
 }}
 className="px-2.5 sm:px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 hover:text-amber-300 rounded-[var(--r-m)] text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition border-stone-800 cursor-pointer shrink-0"
 title={`Ir al bloque siguiente: ${nextBlock.label}`}
 >
 <span className="hidden sm:inline">Siguiente: {nextBlock.shortLabel}</span>
 <span className="sm:hidden">Siguiente</span>
 <ChevronRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>
 )}
 </div>
 );
};
