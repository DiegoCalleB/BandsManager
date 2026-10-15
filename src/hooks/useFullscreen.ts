import { useCallback, useEffect, useState, type RefObject } from 'react';

/**
 * Pantalla completa del contenedor. El estado es optimista (iOS no soporta fullscreen de
 * elementos y el layout "a pantalla completa" debe funcionar igualmente) y se resincroniza con
 * `fullscreenchange`, así salir con Esc o el gesto del sistema también apaga el estado.
 */
export function useFullscreen(contenedor: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const alCambiar = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      contenedor.current?.requestFullscreen?.().catch(() => { /* el navegador rechaza la pantalla completa (sin gesto o no soportada): se sigue en ventana */ });
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => { /* el navegador rechaza la pantalla completa (sin gesto o no soportada): se sigue en ventana */ });
    }
  }, [isFullscreen, contenedor]);

  return { isFullscreen, toggleFullscreen };
}
