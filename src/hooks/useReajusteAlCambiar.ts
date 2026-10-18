import { useState } from 'react';

/**
 * "Ajustar estado durante el render" (https://react.dev/learn/you-might-not-need-an-effect):
 * ejecuta `reajustar` en el mismo render en que cambia alguna de las `deps` (y en el primero),
 * en lugar de hacerlo en un efecto que provocaría un segundo render ya pintado.
 *
 * `reajustar` solo debe llamar a `setState` del propio componente (nunca tener otros efectos).
 * Equivale a `useEffect(() => { reajustar() }, deps)` para estado derivado de props.
 */
export function useReajusteAlCambiar<T extends readonly unknown[]>(deps: T, reajustar: (deps: T) => void): void {
  const [previas, setPrevias] = useState<T | null>(null);
  if (previas === null || deps.some((d, i) => !Object.is(d, previas[i]))) {
    setPrevias(deps);
    reajustar(deps);
  }
}
