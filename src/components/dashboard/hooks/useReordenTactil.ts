import { useCallback, useEffect, useRef } from 'react';

const BORDE_PX = 80;
const SCROLL_PX = 14;

/**
 * Reordenar widgets con el dedo o el lápiz desde el asa. El arrastre nativo del navegador (HTML5)
 * no se dispara con el tacto; el ratón sigue usándolo. Marca el widget de destino con `setSobre`,
 * llama a `alSoltar(origen, destino)` al soltar sobre otro widget y desplaza la página si se
 * acerca al borde de la pantalla. Escape cancela.
 */
export function useReordenTactil(opciones: {
  setArrastrado: (id: string | null) => void;
  setSobre: (id: string | null) => void;
  alSoltar: (origen: string, destino: string) => void;
}) {
  const { setArrastrado, setSobre, alSoltar } = opciones;
  const limpiarRef = useRef<(() => void) | null>(null);

  const iniciar = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (e.pointerType === 'mouse') return; // el ratón usa el arrastre nativo
      e.preventDefault();
      limpiarRef.current?.();
      let destino: string | null = null;
      setArrastrado(id);

      const mover = (ev: PointerEvent) => {
        const bajo = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>('[data-widget-id]');
        const encontrado = bajo?.dataset.widgetId ?? null;
        destino = encontrado && encontrado !== id ? encontrado : null;
        setSobre(destino);
        if (ev.clientY < BORDE_PX) window.scrollBy(0, -SCROLL_PX);
        else if (ev.clientY > window.innerHeight - BORDE_PX) window.scrollBy(0, SCROLL_PX);
      };
      const limpiar = () => {
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', soltar);
        window.removeEventListener('pointercancel', limpiar);
        window.removeEventListener('keydown', tecla);
        limpiarRef.current = null;
        setArrastrado(null);
        setSobre(null);
      };
      const soltar = () => {
        const final = destino;
        limpiar();
        if (final) alSoltar(id, final);
      };
      const tecla = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') limpiar();
      };

      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
      window.addEventListener('pointercancel', limpiar);
      window.addEventListener('keydown', tecla);
      limpiarRef.current = limpiar;
    },
    [setArrastrado, setSobre, alSoltar],
  );

  useEffect(() => () => limpiarRef.current?.(), []);

  return { iniciar };
}
