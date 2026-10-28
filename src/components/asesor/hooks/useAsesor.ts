import { useCallback, useEffect, useState } from 'react';
import { sanearEstrategia, type EstrategiaMarketing } from '../../../utils/asesor/estrategia';
import type { Pieza } from '../../../utils/asesor/pieza';
import {
  guardarEstrategia, marcarAccion, obtenerHoyAsesor, prepararPieza, sugerirEstrategia, type AccionAsesor, type EstadoAsesor,
} from '../../../utils/asesorApi';

const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);

/** Estado de una pieza que prepara la IA, por idea. */
export type EstadoPieza = { estado: 'cargando' } | { estado: 'lista'; pieza: Pieza } | { estado: 'error'; mensaje: string };

/**
 * Estado de la pantalla del asesor: el plan de hoy (lo decide el servidor sin IA), las piezas que
 * prepara la IA y la estrategia de la banda. Cualquier cambio (hecho, saltado, estrategia) recarga
 * el plan, porque cambia lo que toca hoy.
 */
export function useAsesor() {
  const [estado, setEstado] = useState<EstadoAsesor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [sugiriendo, setSugiriendo] = useState(false);
  /** Ideas con una acción en vuelo: sus botones se desactivan para no mandarla dos veces. */
  const [ocupadas, setOcupadas] = useState<ReadonlySet<string>>(new Set());
  // Las piezas se guardan por idea durante la sesión: volver a abrir una no vuelve a pagar la IA.
  const [piezas, setPiezas] = useState<Record<string, EstadoPieza>>({});

  const recargar = useCallback(async () => {
    try {
      setEstado(await obtenerHoyAsesor());
      setError(null);
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

  const preparar = useCallback(async (tarjetaId: string, otraVersion = false) => {
    if (!otraVersion && piezas[tarjetaId]?.estado === 'lista') return;
    setPiezas((p) => ({ ...p, [tarjetaId]: { estado: 'cargando' } }));
    try {
      const { pieza } = await prepararPieza(tarjetaId);
      setPiezas((p) => ({ ...p, [tarjetaId]: { estado: 'lista', pieza } }));
    } catch (e) {
      setPiezas((p) => ({ ...p, [tarjetaId]: { estado: 'error', mensaje: mensajeDe(e, 'La IA no ha podido preparar la pieza.') } }));
    }
  }, [piezas]);

  const accion = useCallback(async (tarjetaId: string, a: AccionAsesor): Promise<boolean> => {
    setOcupadas((s) => new Set(s).add(tarjetaId));
    try {
      await marcarAccion(tarjetaId, a);
      await recargar();
      return true;
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo guardar.'));
      return false;
    } finally {
      setOcupadas((s) => {
        const n = new Set(s);
        n.delete(tarjetaId);
        return n;
      });
    }
  }, [recargar]);

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

  return { estado, cargando, error, guardando, sugiriendo, ocupadas, piezas, recargar, preparar, accion, guardar, proponer };
}
