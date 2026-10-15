import React from 'react';
import { Button } from '../ui';
import { TODAS } from '../../utils/cartel/datos';

interface Props {
  bandas: string[];
  onElegir: (cabeza: string) => void;
}

/**
 * Bolo compartido: un toque para decir quién encabeza. No se adivina: si sois teloneros,
 * poneros arriba queda fatal. Mientras no se elija, el cartel las pone todas al mismo tamaño.
 */
export function PreguntaCabeza({ bandas, onElegir }: Props) {
  return (
    <div className="grid gap-2.5 rounded-[var(--r-m)] bg-[var(--acc-soft)] p-3">
      <p className="text-sm font-semibold text-[var(--acc-ink)]">Bolo compartido. ¿Quién encabeza?</p>
      <div className="flex flex-wrap gap-1.5">
        {bandas.map((b) => (
          <Button key={b} size="sm" variant="raised" onClick={() => onElegir(b)}>
            {b}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => onElegir(TODAS)}>
          Todas igual
        </Button>
      </div>
    </div>
  );
}
