import { useEffect } from 'react';

/**
 * Bloquea el scroll del body mientras `active` es true (p. ej. un modal abierto). Fija el body
 * en su posición de scroll actual en vez de solo poner overflow:hidden — es lo que evita que
 * Safari/Chrome en iOS "arrastren" el fondo o desplacen un position:fixed recién montado
 * durante el gesto de scroll que llevó al usuario hasta el botón que abrió el modal.
 */
export function useScrollLock(active:boolean) {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevLeft = body.style.left;
    const prevRight = body.style.right;
    const prevWidth = body.style.width;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    return () => {
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.left = prevLeft;
      body.style.right = prevRight;
      body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
