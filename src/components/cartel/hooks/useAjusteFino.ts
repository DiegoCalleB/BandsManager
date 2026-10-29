import { useCallback } from 'react';
import type { AjustesBolo } from '../../../utils/cartel/config';
import type { FormatoCartel } from '../../../utils/cartel/formatos';
import { conAjusteDeBloque, sanearAjustesFinos, sinAjustesDeFormato, type AjusteBloque, type BloqueAjustable } from '../../../utils/cartel/ajustesFinos';

const SIN_AJUSTE: AjusteBloque = { dx: 0, dy: 0, escala: 1 };

/** Mover y escalar los bloques de texto del formato actual (los desplazamientos van en fracción del ancho). */
export function useAjusteFino(ajustesFinos: AjustesBolo['ajustesFinos'], formato: FormatoCartel, cambiarAjustes: (c: Partial<AjustesBolo>) => void) {
  const ajustarBloque = useCallback(
    (bloque: BloqueAjustable, cambio: Partial<AjusteBloque>) => {
      const actual = ajustesFinos[formato]?.[bloque] ?? SIN_AJUSTE;
      const siguiente = sanearAjustesFinos({ [formato]: { [bloque]: { ...actual, ...cambio } } })[formato]?.[bloque] ?? SIN_AJUSTE;
      cambiarAjustes({ ajustesFinos: conAjusteDeBloque(ajustesFinos, formato, bloque, siguiente) });
    },
    [ajustesFinos, formato, cambiarAjustes]
  );
  /** Vuelve al reparto automático en el formato actual. */
  const reiniciarAjustesFinos = useCallback(() => cambiarAjustes({ ajustesFinos: sinAjustesDeFormato(ajustesFinos, formato) }), [ajustesFinos, formato, cambiarAjustes]);
  return { ajustarBloque, reiniciarAjustesFinos };
}
