import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardWidgetConfig } from '../../../types/dashboardWidgets';
import { api } from '../../../services/api';
import { leerUsuarioDeSesion } from '../../../services/sesionLocal';

/** Espera tras el último cambio antes de mandar el panel: mover y redimensionar dispara muchos seguidos. */
export const ESPERA_GUARDADO_MS = 600;

/**
 * Guarda el panel de widgets en el servidor sin una petición por clic y sin pisar guardados.
 *  · Agrupa los cambios seguidos (solo se manda el último estado).
 *  · Nunca hay dos envíos a la vez: si llega un cambio durante un envío, va después del actual.
 *  · Al salir de la pantalla o ocultar la pestaña manda lo pendiente en vez de perderlo.
 *  · `error` también es true si el servidor lo recibió pero no pudo guardarlo en la base de datos.
 */
export function useGuardadoPanel() {
  const [error, setError] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const pendienteRef = useRef<DashboardWidgetConfig[] | null>(null);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enviandoRef = useRef(false);
  /** En cuanto el usuario toca algo en este montaje, lo local manda sobre una sesión refrescada. */
  const haGuardadoRef = useRef(false);

  const enviar = useCallback(async () => {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    try {
      // Un bucle y no una llamada recursiva: lo que llegue durante un envío va justo después.
      while (pendienteRef.current) {
        const panel = pendienteRef.current;
        pendienteRef.current = null;
        setError(false);
        try {
          const res = await api.saveUiPreferences({ dashboard_widgets: panel });
          if (res?.persistido === false) setError(true);
          const prefs = res?.ui_preferences ?? { dashboard_widgets: panel };
          try {
            const user = leerUsuarioDeSesion();
            if (user) {
              user.ui_preferences = { ...(user.ui_preferences || {}), ...prefs };
              localStorage.setItem('bandmanager_user', JSON.stringify(user));
            }
          } catch {
            /* sin localStorage: la copia del servidor sigue siendo la buena */
          }
          window.dispatchEvent(new CustomEvent('bm:ui-preferences-saved', { detail: prefs }));
          if (res?.persistido !== false) {
            setGuardado(true);
            setTimeout(() => setGuardado(false), 2000);
          }
        } catch (err) {
          console.error('Error al guardar disposición de widgets:', err);
          setError(true);
        }
      }
    } finally {
      enviandoRef.current = false;
    }
  }, []);

  const guardar = useCallback(
    (panel: DashboardWidgetConfig[], opciones?: { inmediato?: boolean }) => {
      haGuardadoRef.current = true;
      pendienteRef.current = panel;
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
      if (opciones?.inmediato) void enviar();
      else temporizadorRef.current = setTimeout(() => void enviar(), ESPERA_GUARDADO_MS);
    },
    [enviar],
  );

  /** Manda ya lo que esté esperando el temporizador. */
  const vaciar = useCallback(() => {
    if (temporizadorRef.current) {
      clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
    }
    void enviar();
  }, [enviar]);

  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === 'hidden') vaciar();
    };
    document.addEventListener('visibilitychange', alOcultar);
    window.addEventListener('pagehide', vaciar);
    return () => {
      document.removeEventListener('visibilitychange', alOcultar);
      window.removeEventListener('pagehide', vaciar);
      vaciar();
    };
  }, [vaciar]);

  /** ¿Hay algo por mandar o mandándose? Mientras sí, una sesión refrescada no debe deshacerlo. */
  const hayCambiosEnCurso = useCallback(
    () => haGuardadoRef.current && (enviandoRef.current || pendienteRef.current !== null || temporizadorRef.current !== null),
    [],
  );

  return { guardar, vaciar, error, guardado, haGuardado: () => haGuardadoRef.current, hayCambiosEnCurso };
}
