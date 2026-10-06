import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { posicionMenu, type PosicionMenu } from '../../utils/posicionMenu';

// Clases de posicionamiento «a la antigua» (panel absoluto bajo el botón) que este componente
// sustituye por una posición calculada con el espacio real de la ventana.
const CLASES_DE_POSICION = /^(?:[a-z]+:)?(absolute|relative|top-full|bottom-full|right-0|left-0|right-auto|left-auto|mt-\S+|mb-\S+|z-\d+|origin-\S+)$/;

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> & {
  /** Alinear al borde izquierdo del botón (por defecto, al derecho). En ≥640 px si es `responsive`. */
  izquierda?: boolean | 'sm';
  style?: React.CSSProperties;
};

/**
 * Panel desplegable anclado al botón que lo abre, para sustituir a `absolute top-full right-0 …`.
 *
 * Un panel absoluto dentro de una tarjeta con `overflow-hidden`, o más alto que el hueco que queda
 * hasta el borde de la ventana, se recortaba o se salía de pantalla (en un portátil o con la ventana
 * baja el panel llegaba a empezar fuera de la vista). Este se pinta en un portal en `document.body`
 * con posición fija: se abre hacia el lado con más sitio, anclado por el borde pegado al botón, y si
 * no cabe entero hace scroll por dentro.
 *
 * Se usa como un hijo del contenedor `relative` que contiene el botón (el ancla es ese contenedor).
 * Cierra por sí solo al cambiar el tamaño de la ventana o al hacer scroll fuera del panel; el cierre
 * por clic fuera lo sigue haciendo el fondo que ya pintaba cada llamador.
 */
export function PopoverAncla({ className = '', izquierda, style, children, ...resto }: Props) {
  const marca = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<(PosicionMenu & { left?: number }) | null>(null);

  const alIzquierda = izquierda === 'sm' ? window.innerWidth >= 640 : !!izquierda;

  useLayoutEffect(() => {
    const ancla = marca.current?.parentElement;
    if (!ancla) return;
    const r = ancla.getBoundingClientRect();
    const base = posicionMenu(r, { ancho: window.innerWidth, alto: window.innerHeight });
    setPos(alIzquierda ? { ...base, left: Math.max(8, r.left) } : base);
  }, [alIzquierda]);

  useEffect(() => {
    const alScroll = (e: Event) => {
      if (panel.current?.contains(e.target as Node)) return;
      // Solo un scroll que mueve de verdad el ancla invalida la posición.
      const ancla = marca.current?.parentElement;
      if (!ancla) return;
      const r = ancla.getBoundingClientRect();
      const base = posicionMenu(r, { ancho: window.innerWidth, alto: window.innerHeight });
      setPos(alIzquierda ? { ...base, left: Math.max(8, r.left) } : base);
    };
    window.addEventListener('scroll', alScroll, true);
    window.addEventListener('resize', alScroll);
    return () => {
      window.removeEventListener('scroll', alScroll, true);
      window.removeEventListener('resize', alScroll);
    };
  }, [alIzquierda]);

  const visual = className.split(/\s+/).filter((c) => c && !CLASES_DE_POSICION.test(c)).join(' ');

  return (
    <>
      <span ref={marca} aria-hidden className="hidden" />
      {pos &&
        createPortal(
          <div
            ref={panel}
            {...resto}
            className={`${visual} z-[10001] overflow-y-auto`}
            style={{
              position: 'fixed',
              top: pos.top,
              bottom: pos.bottom,
              ...(alIzquierda ? { left: pos.left } : { right: pos.right }),
              maxHeight: pos.maxHeight,
              ...style,
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
