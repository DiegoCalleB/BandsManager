import React from 'react';
import { MoveDiagonal2 } from 'lucide-react';

interface TiradorWidgetProps {
  titulo: string;
  onPointerDown: (e: React.PointerEvent) => void;
  /** Teclado: izquierda/derecha cambian el ancho; arriba/abajo, el alto. */
  onPaso: (eje: 'ancho' | 'alto', dir: -1 | 1) => void;
}

/** Tirador de la esquina inferior derecha de un widget en modo edición (solo en pantallas con rejilla). */
export function TiradorWidget({ titulo, onPointerDown, onPaso }: TiradorWidgetProps) {
  const alTeclado = (e: React.KeyboardEvent) => {
    const paso: Record<string, ['ancho' | 'alto', -1 | 1]> = {
      ArrowLeft: ['ancho', -1],
      ArrowRight: ['ancho', 1],
      ArrowUp: ['alto', -1],
      ArrowDown: ['alto', 1],
    };
    const accion = paso[e.key];
    if (!accion) return;
    e.preventDefault();
    onPaso(accion[0], accion[1]);
  };

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onKeyDown={alTeclado}
      aria-label={`Cambiar el tamaño de ${titulo}. Con el teclado: flechas izquierda y derecha para el ancho, arriba y abajo para el alto.`}
      title="Arrastra para cambiar el tamaño"
      className="absolute bottom-2 right-2 z-10 hidden md:flex h-7 w-7 items-center justify-center rounded-[var(--r-s)] bg-[var(--acc)] text-[var(--on-acc)] cursor-nwse-resize touch-none select-none"
    >
      <MoveDiagonal2 className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}
