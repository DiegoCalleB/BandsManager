import { useCallback, useEffect, useState } from 'react';
import { sanearEstrategia, type EstrategiaMarketing } from '../../../utils/asesor/estrategia';
import { guardarEstrategia, obtenerHoyAsesor, sugerirEstrategia, type EstadoAsesor } from '../../../utils/asesorApi';

const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);

/**
 * Estado de la pantalla del asesor: el plan de hoy (lo decide el servidor sin IA) y la estrategia
 * de la banda. Guardar la estrategia recalcula el plan, porque cambia lo que toca hoy.
 */
export function useAsesor() {
  const [estado, setEstado] = useState<EstadoAsesor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [sugiriendo, setSugiriendo] = useState(false);

  const recargar = useCallback(async () => {
    setError(null);
    try {
      setEstado(await obtenerHoyAsesor());
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo preparar el plan de hoy.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let vigente = true;
    obtenerHoyAsesor()
      .then((e) => { if (vigente) setEstado(e); })
      .catch((e) => { if (vigente) setError(mensajeDe(e, 'No se pudo preparar el plan de hoy.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => {
      vigente = false;
    };
  }, []);

  const guardar = useCallback(async (estrategia: EstrategiaMarketing): Promise<boolean> => {
    setGuardando(true);
    setError(null);
    try {
      await guardarEstrategia({ ...estrategia, revisada: true });
      await recargar();
      return true;
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo guardar la estrategia.'));
      return false;
    } finally {
      setGuardando(false);
    }
  }, [recargar]);

  /** Borrador de la IA: no se guarda, solo rellena el formulario para que la banda lo corrija. */
  const proponer = useCallback(async (): Promise<EstrategiaMarketing | null> => {
    setSugiriendo(true);
    setError(null);
    try {
      return sanearEstrategia((await sugerirEstrategia()).estrategia);
    } catch (e) {
      setError(mensajeDe(e, 'La IA no está disponible ahora mismo. Puedes rellenarla a mano.'));
      return null;
    } finally {
      setSugiriendo(false);
    }
  }, []);

  return { estado, cargando, error, guardando, sugiriendo, guardar, proponer, recargar };
}
