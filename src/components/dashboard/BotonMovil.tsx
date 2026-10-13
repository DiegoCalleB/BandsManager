import React from 'react';
import { Smartphone } from 'lucide-react';

/** Interruptor «se ve en el móvil» de la barra de edición de un widget. */
export function BotonMovil({ activo, onClick }: { activo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={activo ? 'Se ve en el móvil' : 'No se ve en el móvil'}
      aria-label="Mostrar en el móvil"
      aria-pressed={activo}
      className={`p-1.5 rounded-[var(--r-s)] transition-ui cursor-pointer flex items-center justify-center ${
        activo ? 'bg-[var(--acc)] text-[var(--on-acc)]' : 'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--sunken)]'
      }`}
    >
      <Smartphone className="w-3.5 h-3.5" />
    </button>
  );
}
