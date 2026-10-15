/**
 * Validadores mínimos para campos de JSON generados por un LLM, que pueden llegar con cualquier tipo.
 * Devuelven `undefined` si el valor no es utilizable, para encadenar con `??` / `||`.
 */

/** Número finito (rechaza NaN, Infinity y números en texto). */
export function numeroFinito(valor: unknown): number | undefined {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : undefined;
}

/** Texto con contenido (tras recortar espacios). */
export function textoNoVacio(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim() ? valor : undefined;
}

/** Lista de textos: descarta los elementos que no sean string; `undefined` si no es array o queda vacía. */
export function listaDeTextos(valor: unknown): string[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  const textos = valor.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  return textos.length > 0 ? textos : undefined;
}

/** Devuelve `valor` si es uno de los `permitidos`; si no, `undefined`. */
export function unoDe<T extends string>(valor: unknown, permitidos: readonly T[]): T | undefined {
  return permitidos.find((p) => p === valor);
}
