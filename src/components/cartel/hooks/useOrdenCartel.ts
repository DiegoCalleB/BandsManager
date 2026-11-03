import { useState } from 'react';
import { ordenarCartel } from '../../../utils/promocionApi';
import { aplicarAcciones, planVacio } from '../../../utils/cartel/ordenes';
import { MAX_LIBRES } from '../../../utils/cartel/textosLibres';
import type { AjustesBolo } from '../../../utils/cartel/config';
import type { FormatoCartel } from '../../../utils/cartel/formatos';

export const MAX_ORDEN_UI = 400;

interface Params {
  ajustes: AjustesBolo;
  formato: FormatoCartel;
  cambiarAjustes: (c: Partial<AjustesBolo>) => void;
  /** Hay un fondo de IA elegido que se puede retocar. */
  puedeRetocar: boolean;
  retocarIa: (instruccion: string, modo: 'libre' | 'fiel') => Promise<boolean>;
  setError: (e: string | null) => void;
  mensajeDe: (e: unknown, defecto: string) => string;
}

export interface ResultadoOrden {
  /** Lo que se ha entendido, en una frase. */
  resumen: string;
  /** Cuántos cambios de capas se han aplicado. */
  capas: number;
  /** Se ha retocado la ilustración. */
  arte: boolean;
  /** Había un cambio de ilustración pero no hay un fondo de IA que retocar. */
  arteSinFondo: boolean;
}

/**
 * «Pídele cambios al cartel»: manda la frase, aplica las acciones de capas como UN solo cambio (un paso para
 * deshacer) y, si pide algo de la ilustración, lo retoca con la IA de imagen en modo libre.
 */
export function useOrdenCartel({ ajustes, formato, cambiarAjustes, puedeRetocar, retocarIa, setError, mensajeDe }: Params) {
  const [ordenando, setOrdenando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoOrden | null>(null);

  const ordenar = async (orden: string): Promise<boolean> => {
    const frase = orden.trim();
    if (!frase) return false;
    setOrdenando(true);
    setError(null);
    setResultado(null);
    try {
      const huecosLibres = Array.from({ length: MAX_LIBRES }, (_, i) => i).filter((i) => !ajustes.libres[i]?.trim());
      const { plan } = await ordenarCartel({ orden: frase, huecosLibres });
      if (planVacio(plan)) {
        setResultado({ resumen: plan.resumen || 'No he encontrado nada que pueda cambiar con eso. Prueba con otras palabras.', capas: 0, arte: false, arteSinFondo: false });
        return false;
      }
      if (plan.acciones.length) cambiarAjustes(aplicarAcciones(ajustes, formato, plan.acciones));
      let arte = false;
      if (plan.arte && puedeRetocar) arte = await retocarIa(plan.arte, 'libre');
      setResultado({ resumen: plan.resumen, capas: plan.acciones.length, arte, arteSinFondo: !!plan.arte && !puedeRetocar });
      return true;
    } catch (e) {
      console.warn('[Cartelería] Falló la orden:', e);
      setError(mensajeDe(e, 'No pudimos aplicar ese cambio. Prueba en un rato.'));
      return false;
    } finally {
      setOrdenando(false);
    }
  };

  return { ordenar, ordenando, resultado };
}
