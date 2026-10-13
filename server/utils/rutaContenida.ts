import path from 'path';

/**
 * Resuelve `partes` bajo `base` y devuelve la ruta absoluta solo si queda DENTRO de `base`
 * (sin `..`, sin rutas absolutas incrustadas, sin la propia base). Devuelve null en otro caso.
 * Úsalo siempre que un trozo de ruta venga de una URL o de datos del usuario.
 */
export function resolverDentroDe(base: string, ...partes: string[]): string | null {
  const raiz = path.resolve(base);
  const destino = path.resolve(raiz, ...partes.map((p) => p.replace(/^[/\\]+/, '')));
  return destino.startsWith(raiz + path.sep) ? destino : null;
}
