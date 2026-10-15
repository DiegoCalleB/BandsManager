import { useCallback, useEffect, useRef, useState } from 'react';
import { anchoDesdePixeles, altoDesdeDelta, type Alto, type Ancho } from '../../../utils/redimensionarWidget';

export interface PreviaTamano {
  id: string;
  wSpan: Ancho;
  hSpan: Alto;
}

interface WidgetTamano {
  id: string;
  wSpan: number;
  hSpan?: Alto;
}

/**
 * Redimensionar un widget arrastrando su tirador (ratón, dedo o lápiz). Mientras se arrastra
 * devuelve una `previa` para que el panel se reorganice en vivo; al soltar llama a `alSoltar` UNA
 * vez (un solo guardado) y solo si el tamaño ha cambiado. Escape cancela sin guardar.
 */
export function useRedimensionar(alSoltar: (id: string, cambios: { wSpan: Ancho; hSpan: Alto }) => void) {
  const [previa, setPrevia] = useState<PreviaTamano | null>(null);
  const limpiarRef = useRef<(() => void) | null>(null);

  const iniciar = useCallback(
    (e: React.PointerEvent, widget: WidgetTamano, rejilla: HTMLElement | null, tarjeta: HTMLElement | null) => {
      if (!rejilla || !tarjeta || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      e.stopPropagation();
      limpiarRef.current?.();

      const inicioX = e.clientX;
      const inicioY = e.clientY;
      const anchoInicial = tarjeta.getBoundingClientRect().width;
      const anchoRejilla = rejilla.getBoundingClientRect().width;
      const altoInicial: Alto = widget.hSpan ?? 'normal';
      let ultimo = { wSpan: widget.wSpan as Ancho, hSpan: altoInicial };

      const mover = (ev: PointerEvent) => {
        ultimo = {
          wSpan: anchoDesdePixeles(anchoInicial + ev.clientX - inicioX, anchoRejilla),
          hSpan: altoDesdeDelta(altoInicial, ev.clientY - inicioY),
        };
        setPrevia({ id: widget.id, ...ultimo });
      };
      const limpiar = () => {
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', soltar);
        window.removeEventListener('pointercancel', cancelar);
        window.removeEventListener('keydown', tecla);
        limpiarRef.current = null;
        setPrevia(null);
      };
      const soltar = () => {
        limpiar();
        if (ultimo.wSpan !== widget.wSpan || ultimo.hSpan !== altoInicial) alSoltar(widget.id, ultimo);
      };
      const cancelar = () => limpiar();
      const tecla = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') limpiar();
      };

      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
      window.addEventListener('pointercancel', cancelar);
      window.addEventListener('keydown', tecla);
      limpiarRef.current = limpiar;
    },
    [alSoltar],
  );

  useEffect(() => () => limpiarRef.current?.(), []);

  return { previa, iniciar };
}
