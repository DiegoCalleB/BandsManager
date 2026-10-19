/**
 * Qué idioma conviene mostrar según los idiomas preferidos del navegador (`navigator.languages`, por orden).
 * Español y lenguas de España (catalán, gallego, euskera) → español; cualquier otro idioma → inglés; sin información → español.
 *
 * Función pura y SIN dependencias: el servidor la incrusta tal cual en las páginas públicas de SEO
 * (`Function.prototype.toString`), así que la app y esas páginas deciden igual. No uses aquí imports ni helpers.
 */
export type IdiomaSugerido = 'es' | 'en';

export function idiomaSugerido(preferidos: readonly string[]): IdiomaSugerido {
  const primero = String(preferidos && preferidos[0] ? preferidos[0] : '').toLowerCase().slice(0, 2);
  if (!primero) return 'es';
  return primero === 'es' || primero === 'ca' || primero === 'gl' || primero === 'eu' ? 'es' : 'en';
}
