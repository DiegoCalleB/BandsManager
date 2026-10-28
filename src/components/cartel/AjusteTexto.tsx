import React, { useRef } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button, IconButton } from '../ui';
import { cn } from '../../utils/cn';
import { BLOQUES, ETIQUETA_BLOQUE, type AjusteBloque, type BloqueAjustable } from '../../utils/cartel/ajustesFinos';
import type { Rect } from '../../utils/cartel/layout';

interface PropsCapa {
  /** Cajas de los bloques, en píxeles del lienzo (`ancho` de ancho). */
  cajas: Partial<Record<BloqueAjustable, Rect>>;
  ancho: number;
  alto: number;
  ajustes: Partial<Record<BloqueAjustable, AjusteBloque>>;
  elegido: BloqueAjustable | null;
  onElegir: (b: BloqueAjustable) => void;
  onAjustar: (bloque: BloqueAjustable, cambio: Partial<AjusteBloque>) => void;
}

const PASO = 0.01;
const actualDe = (ajustes: Partial<Record<BloqueAjustable, AjusteBloque>>, b: BloqueAjustable): AjusteBloque => ajustes[b] ?? { dx: 0, dy: 0, escala: 1 };

/**
 * Capa sobre la vista previa para mover y escalar el texto a mano: cada bloque es un botón arrastrable (ratón o
 * dedo), solo con contorno para no tapar lo que se mueve. Las flechas y el tamaño están en `BarraAjusteTexto`.
 */
export function CapaAjusteTexto({ cajas, ancho, alto, ajustes, elegido, onElegir, onAjustar }: PropsCapa) {
  const arrastre = useRef<{ bloque: BloqueAjustable; x: number; y: number; dx: number; dy: number; anchoPx: number } | null>(null);

  const empezar = (e: React.PointerEvent<HTMLElement>, bloque: BloqueAjustable) => {
    const capa = e.currentTarget.parentElement!.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    onElegir(bloque);
    arrastre.current = { bloque, x: e.clientX, y: e.clientY, dx: actualDe(ajustes, bloque).dx, dy: actualDe(ajustes, bloque).dy, anchoPx: capa.width };
  };
  const mover = (e: React.PointerEvent<HTMLElement>) => {
    const a = arrastre.current;
    if (!a) return;
    // Píxeles de pantalla → fracción del ancho del cartel.
    onAjustar(a.bloque, { dx: a.dx + (e.clientX - a.x) / a.anchoPx, dy: a.dy + (e.clientY - a.y) / a.anchoPx });
  };
  const soltar = () => {
    arrastre.current = null;
  };

  return (
    <div className="absolute inset-0" aria-label="Ajustar el texto">
      {BLOQUES.filter((b) => cajas[b]).map((b) => {
        const r = cajas[b]!;
        return (
          <button
            key={b}
            type="button"
            aria-label={`Mover ${ETIQUETA_BLOQUE[b]}`}
            aria-pressed={elegido === b}
            onPointerDown={(e) => empezar(e, b)}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            onClick={() => onElegir(b)}
            className={cn('absolute cursor-grab touch-none rounded-[var(--r-s)] bg-transparent outline-none active:cursor-grabbing', elegido === b ? 'ring-2 ring-[var(--acc)]' : 'ring-1 ring-white/50 hover:ring-[var(--acc)]')}
            style={{ left: `${(r.x / ancho) * 100}%`, top: `${(r.y / alto) * 100}%`, width: `${(r.w / ancho) * 100}%`, height: `${(r.h / alto) * 100}%` }}
          />
        );
      })}
    </div>
  );
}

interface PropsBarra {
  elegido: BloqueAjustable | null;
  ajustes: Partial<Record<BloqueAjustable, AjusteBloque>>;
  onAjustar: (bloque: BloqueAjustable, cambio: Partial<AjusteBloque>) => void;
  onReiniciar: () => void;
  hayAjustes: boolean;
}

/** Tamaño y flechas del bloque elegido, y «Volver al automático»: se puede ajustar sin arrastrar. */
export function BarraAjusteTexto({ elegido, ajustes, onAjustar, onReiniciar, hayAjustes }: PropsBarra) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label={elegido ? `Ajustar ${ETIQUETA_BLOQUE[elegido]}` : 'Ajustar el texto'}>
      {elegido ? (
        <>
          <span className="px-1 text-xs font-medium text-[var(--ink-2)]">{ETIQUETA_BLOQUE[elegido]}</span>
          <IconButton label="Más pequeño" size="icon-xs" variant="raised" onClick={() => onAjustar(elegido, { escala: actualDe(ajustes, elegido).escala - 0.05 })}>
            <Minus className="size-3.5" aria-hidden />
          </IconButton>
          <IconButton label="Más grande" size="icon-xs" variant="raised" onClick={() => onAjustar(elegido, { escala: actualDe(ajustes, elegido).escala + 0.05 })}>
            <Plus className="size-3.5" aria-hidden />
          </IconButton>
          <Button size="xs" variant="raised" aria-label="Subir" onClick={() => onAjustar(elegido, { dy: actualDe(ajustes, elegido).dy - PASO })}>↑</Button>
          <Button size="xs" variant="raised" aria-label="Bajar" onClick={() => onAjustar(elegido, { dy: actualDe(ajustes, elegido).dy + PASO })}>↓</Button>
          <Button size="xs" variant="raised" aria-label="A la izquierda" onClick={() => onAjustar(elegido, { dx: actualDe(ajustes, elegido).dx - PASO })}>←</Button>
          <Button size="xs" variant="raised" aria-label="A la derecha" onClick={() => onAjustar(elegido, { dx: actualDe(ajustes, elegido).dx + PASO })}>→</Button>
        </>
      ) : (
        <span className="px-1 text-xs text-[var(--ink-2)]">Toca un texto para moverlo o cambiar su tamaño.</span>
      )}
      <Button size="xs" variant="raised" onClick={onReiniciar} disabled={!hayAjustes}>
        <RotateCcw className="size-3.5" aria-hidden />
        Volver al automático
      </Button>
    </div>
  );
}
