import React from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { EPKBlockMeta } from './epkBlocks';

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
    <div className="space-y-6">
      {/* CABECERA DEL BLOQUE */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {meta.number && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Bloque {meta.number} de 7
                </span>
              )}
              <h3 className="text-base font-bold text-white font-mono">
                {meta.label}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {meta.description}
            </p>
          </div>
        </div>
      </div>

      {/* CONTENIDO DEL BLOQUE */}
      <div>
        {children}
      </div>

      {/* NAVEGACIÓN INFERIOR (SOLO CUANDO NO ES VISTA CONTINUA 'TODO') */}
      {!isAllView && onNavigate && (
        <div className="flex items-center justify-between pt-5 border-t border-stone-800/80 gap-3 flex-wrap">
          {prevBlock ? (
            <button
              type="button"
              onClick={() => {
                onNavigate(prevBlock.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-stone-800 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior: {prevBlock.shortLabel}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            )}

            {nextBlock && (
              <button
                type="button"
                onClick={() => {
                  onNavigate(nextBlock.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-stone-800 cursor-pointer"
              >
                <span>Siguiente: {nextBlock.shortLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
