import { useCallback } from 'react';
import type { AjustesBolo } from '../../../utils/cartel/config';
import { MAX_LIBRES, MAX_TEXTO_LIBRE } from '../../../utils/cartel/textosLibres';
import type { FormatoCartel } from '../../../utils/cartel/formatos';
import { conAjusteDeBloque, conEstiloDeBloque, sanearAjustesFinos, sinAjustesDeFormato, type AjusteBloque, type BloqueAjustable, type EstiloBloque } from '../../../utils/cartel/ajustesFinos';

const SIN_AJUSTE: AjusteBloque = { dx: 0, dy: 0, escala: 1 };

/** Mover y escalar los bloques de texto del formato actual (los desplazamientos van en fracción del ancho). */
export function useAjusteFino(ajustes: Pick<AjustesBolo, 'ajustesFinos' | 'estilos' | 'libres'>, formato: FormatoCartel, cambiarAjustes: (c: Partial<AjustesBolo>) => void) {
  const { ajustesFinos, estilos, libres } = ajustes;
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
  /** Cambia la letra, el color o lo oculto de un bloque; un campo en `undefined` lo vuelve a automático. */
  const estilarBloque = useCallback(
    (bloque: BloqueAjustable, cambio: { [K in keyof EstiloBloque]?: EstiloBloque[K] | undefined }) => cambiarAjustes({ estilos: conEstiloDeBloque(estilos, bloque, cambio) }),
    [estilos, cambiarAjustes]
  );
  /** Escribe el texto suelto número `i` (0-2); vacío lo quita. */
  const editarLibre = useCallback(
    (i: number, texto: string) => {
      const siguiente = Array.from({ length: MAX_LIBRES }, (_, k) => libres[k] ?? '');
      siguiente[i] = texto.slice(0, MAX_TEXTO_LIBRE);
      cambiarAjustes({ libres: siguiente });
    },
    [libres, cambiarAjustes]
  );
  return { ajustarBloque, reiniciarAjustesFinos, estilarBloque, editarLibre };
}
