import React from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { EPKBlockMeta } from './epkBlocks';
import { Button } from '../ui';

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
  isAllView = false,
}) => {
  const Icon = meta.icon;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* CABECERA DEL BLOQUE: visible en escritorio o cuando es vista continua'todo' */}
      <div className={`${isAllView ? 'flex' : 'hidden sm:flex'} items-center justify-between pb-3 flex-wrap gap-2`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--ink)] shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {meta.number && (
                <span className="text-micro font-sans font-bold text-[var(--ink)] bg-[var(--acc)]/10 px-1.5 py-0.5 rounded">
                  Bloque {meta.number} de 8
                </span>
              )}
              <h3 className="text-base font-bold text-[var(--ink)] font-sans">{meta.label}</h3>
            </div>
            <p className="text-xs text-[var(--ink-2)] mt-0.5">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* CONTENIDO DEL BLOQUE */}
      <div>{children}</div>

      {/* NAVEGACIÓN INFERIOR (SOLO CUANDO NO ES VISTA CONTINUA'TODO') */}
      {!isAllView && onNavigate && (
        <div className="flex items-center justify-between pt-4 sm:pt-5/80 gap-2 sm:gap-3">
          {prevBlock ? (
            <button
              type="button"
              onClick={() => {
                onNavigate(prevBlock.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 sm:px-3.5 py-2 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/60 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-pill)] text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition cursor-pointer shrink-0"
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
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={onSave}
                className="items-center gap-1.5 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guardar cambios</span>
                <span className="sm:hidden">Guardar</span>
              </Button>
            )}

            {nextBlock && (
              <button
                type="button"
                onClick={() => {
                  onNavigate(nextBlock.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-2.5 sm:px-3.5 py-2 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/60 text-[var(--acc)] hover:text-[var(--acc)]/70 rounded-[var(--r-pill)] text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition cursor-pointer shrink-0"
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
