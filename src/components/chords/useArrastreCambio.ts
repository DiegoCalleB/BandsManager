import { useCallback, useEffect, useRef, useState } from 'react';

const PULSACION_LARGA_MS = 250;
const TOLERANCIA_PX = 8;

interface Gesto { origen: number; x: number; y: number; id: number; boton: HTMLElement; vivo: boolean; sobre: number; temporizador: number }

/**
 * Arrastrar el acorde de una casilla a otra. En pantalla táctil se activa con pulsación larga (para no
 * pelearse con el scroll); con ratón basta con empezar a mover. Las casillas se reconocen por
 * `data-t0`, el instante en que empiezan.
 * @param onSoltar Se llama al soltar sobre otra casilla distinta de la de origen.
 * @returns El arrastre en curso y los manejadores de cada casilla.
 */
export function useArrastreCambio(onSoltar?: (origen: number, destino: number) => void) {
  const [arrastre, setArrastre] = useState<{ origen: number; sobre: number } | null>(null);
  const gesto = useRef<Gesto | null>(null);
  const tapaClic = useRef(false);

  // Mientras se arrastra, el dedo no debe desplazar la página.
  useEffect(() => {
    if (!arrastre) return;
    const quieto = (e: TouchEvent) => e.preventDefault();
    window.addEventListener('touchmove', quieto, { passive: false });
    return () => window.removeEventListener('touchmove', quieto);
  }, [arrastre]);

  const arrancar = useCallback((g: Gesto) => {
    g.vivo = true;
    g.boton.setPointerCapture?.(g.id);
    navigator.vibrate?.(15);
    setArrastre({ origen: g.origen, sobre: g.origen });
  }, []);

  const terminar = useCallback((soltar: boolean) => {
    const g = gesto.current;
    if (!g) return;
    window.clearTimeout(g.temporizador);
    gesto.current = null;
    if (!g.vivo) return;
    setArrastre(null);
    // Un toque algo lento (>250 ms) sin mover el dedo sigue siendo un toque: no se traga el clic.
    if (g.sobre !== g.origen) {
      tapaClic.current = true;
      window.setTimeout(() => { tapaClic.current = false; }, 0);
      if (soltar) onSoltar?.(g.origen, g.sobre);
    }
  }, [onSoltar]);

  /** Manejadores de una casilla; sin `t0` (o sin onSoltar) no se arrastra. */
  const manejadores = useCallback((t0: number, cambia: boolean) => {
    if (!onSoltar || !cambia) return {};
    return {
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const boton = e.currentTarget;
        const g: Gesto = { origen: t0, x: e.clientX, y: e.clientY, id: e.pointerId, boton, vivo: false, sobre: t0, temporizador: 0 };
        g.temporizador = window.setTimeout(() => arrancar(g), PULSACION_LARGA_MS);
        gesto.current = g;
      },
      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
        const g = gesto.current;
        if (!g) return;
        if (!g.vivo) {
          if (Math.hypot(e.clientX - g.x, e.clientY - g.y) <= TOLERANCIA_PX) return;
          if (e.pointerType !== 'mouse') { window.clearTimeout(g.temporizador); gesto.current = null; return; }
          window.clearTimeout(g.temporizador);
          arrancar(g);
        }
        const casilla = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-t0]');
        const sobre = casilla ? Number(casilla.dataset.t0) : g.sobre;
        if (sobre !== g.sobre) { g.sobre = sobre; setArrastre({ origen: g.origen, sobre }); }
      },
      onPointerUp: () => terminar(true),
      onPointerCancel: () => terminar(false),
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    };
  }, [onSoltar, arrancar, terminar]);

  /** True justo tras soltar: ese clic no debe contar como pulsación. */
  const esClicDeArrastre = () => tapaClic.current;

  return { arrastre, manejadores, esClicDeArrastre };
}
