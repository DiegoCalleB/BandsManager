import { useEffect } from 'react';

/**
 * Mantiene la pantalla encendida mientras `activo`. iOS/Android sueltan el wake lock al cambiar
 * de pestaña o app: se vuelve a pedir al volver. Degrada en silencio si no hay soporte.
 */
export function useWakeLock(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    let sentinel: { release?: () => Promise<void> } | null = null;
    let cancelado = false;

    const soltar = () => {
      sentinel?.release?.().catch(() => {});
      sentinel = null;
    };
    const pedir = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (cancelado) lock.release?.().catch(() => {});
          else sentinel = lock;
        }
      } catch {
        // Rechazado o sin soporte: no es motivo para romper el modo en vivo.
      }
    };
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') void pedir();
      else soltar();
    };

    void pedir();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      cancelado = true;
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      soltar();
    };
  }, [activo]);
}
