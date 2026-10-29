import { useCallback, useRef, useState } from 'react';
import type { AjustesBolo } from '../../../utils/cartel/config';
import type { FondoCartel } from '../../../utils/cartel/render';
import { HISTORIAL_VACIO, anotar, deshacer as deshacerH, rehacer as rehacerH, type Historial } from '../../../utils/cartel/historial';

/** Lo que deshacer/rehacer devuelve: los ajustes y el fondo elegido. */
export interface FotoDiseno {
  ajustes: AjustesBolo;
  fondo: FondoCartel;
}

/** Cambios seguidos del mismo tipo (teclear, arrastrar) cuentan como un solo paso. */
const AGRUPAR_MS = 800;

/** Deshacer y rehacer del diseño del cartel, una pila por bolo. */
export function useHistorialCartel(id: string, actual: FotoDiseno, aplicar: (f: FotoDiseno) => void) {
  const [historiales, setHistoriales] = useState<Record<string, Historial<FotoDiseno>>>({});
  const ultimoCambio = useRef({ clave: '', t: 0 });
  const historial = historiales[id] ?? HISTORIAL_VACIO;

  /** Llamar justo antes de cambiar algo: guarda cómo estaba. `clave` agrupa cambios seguidos del mismo tipo. */
  const anotarPaso = useCallback(
    (clave: string) => {
      if (!id) return;
      const ahora = Date.now();
      const { clave: antes, t } = ultimoCambio.current;
      ultimoCambio.current = { clave, t: ahora };
      if (clave === antes && ahora - t < AGRUPAR_MS) return;
      setHistoriales((p) => ({ ...p, [id]: anotar(p[id] ?? HISTORIAL_VACIO, actual) }));
    },
    [id, actual]
  );

  const mover = (r: { historial: Historial<FotoDiseno>; estado: FotoDiseno } | null) => {
    if (!r) return;
    setHistoriales((p) => ({ ...p, [id]: r.historial }));
    ultimoCambio.current = { clave: '', t: 0 };
    aplicar(r.estado);
  };

  return {
    anotarPaso,
    deshacer: () => mover(deshacerH(historial, actual)),
    rehacer: () => mover(rehacerH(historial, actual)),
    puedeDeshacer: historial.pasado.length > 0,
    puedeRehacer: historial.futuro.length > 0,
  };
}
