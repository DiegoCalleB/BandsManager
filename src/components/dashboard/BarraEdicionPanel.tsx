import React from "react";
import { Plus, RotateCcw, Check, LayoutGrid } from "lucide-react";
import { Button } from "../ui";

interface BarraEdicionPanelProps {
  visibles: number;
  total: number;
  /** El último guardado falló: se ofrece reintentarlo. */
  hayError: boolean;
  /** Guardado hecho hace un momento: se enseña la confirmación. */
  guardado: boolean;
  onReintentar: () => void;
  onAnadir: () => void;
  onRestablecer: () => void;
  onFinalizar: () => void;
}

/** Barra fija de «Editando tu panel»: estado del guardado y las tres acciones del panel. */
export function BarraEdicionPanel({ visibles, total, hayError, guardado, onReintentar, onAnadir, onRestablecer, onFinalizar }: BarraEdicionPanelProps) {
  return (
    <div className="sticky top-2 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-[var(--r-l)] bg-[var(--surface)] animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)]">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--ink)]">
              Editando tu panel
            </span>
            <span className="text-xs px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)] font-medium">
              Arrastra para reordenar
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)] mt-0.5">
            {visibles} de {total} módulos
            visibles · asa para mover, esquina para el tamaño · se guarda
            solo (en móvil se apila a 1 columna)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {hayError && (
          <Button
            variant="neutral"
            size="xs"
            type="button"
            onClick={onReintentar}
            className="items-center gap-1"
          >
            No se pudo guardar · Reintentar
          </Button>
        )}
        {guardado && (
          <span className="text-xs text-[var(--ok)] bg-[var(--ok-soft)] px-2.5 py-1 rounded-[var(--r-pill)] flex items-center gap-1 animate-fade-in">
            <Check className="w-3.5 h-3.5" /> Guardado
          </span>
        )}

        <Button
          variant="neutral"
          size="sm"
          type="button"
          onClick={onAnadir}
          className="items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir widget</span>
        </Button>

        <Button
          variant="neutral"
          size="sm"
          type="button"
          onClick={onRestablecer}
          className="items-center gap-1"
          title="Restablecer disposición por defecto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Por Defecto</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={onFinalizar}
          className="items-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Finalizar edición</span>
        </Button>
      </div>
    </div>
  );
}
