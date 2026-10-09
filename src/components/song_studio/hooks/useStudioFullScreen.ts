/**
 * Pantalla completa de Song Studio: alternar, entrar/salir con la Fullscreen API y sincronizar el estado al salir con Escape
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/
import { useState, useEffect } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface StudioFullScreenParams {

}

/**
 * Pantalla completa de Song Studio: alternar, entrar/salir con la Fullscreen API y sincronizar el estado al salir con Escape
 * @param params Estado y callbacks del contenedor ({@link StudioFullScreenParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useStudioFullScreen({  }: StudioFullScreenParams) {
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
