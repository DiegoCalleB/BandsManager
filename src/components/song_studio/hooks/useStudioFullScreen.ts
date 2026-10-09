/**
 * Pantalla completa de Song Studio: alternar, entrar/salir con la Fullscreen API y sincronizar el estado al salir con Escape
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useState } from "react";

/**
 * Pantalla completa de Song Studio: alternar, entrar/salir con la Fullscreen API y sincronizar el estado al salir con Escape
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useStudioFullScreen() {
  // Studio Fullscreen Mode State & Handler
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const toggleIsFullScreen = () => {
    setIsFullScreen((prev) => {
      const next = !prev;
      if (next) {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullScreen]);

  return { isFullScreen, toggleIsFullScreen };
}
