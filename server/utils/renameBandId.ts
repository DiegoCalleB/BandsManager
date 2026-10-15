/**
 * Reasignación de ids de banda: sustituye un id de banda por otro en cualquier estructura de datos
 * (valores y claves de objetos). Se usa desde `scripts/rename-band-id.ts` para migrar `data.json`;
 * el mismo mapa de variantes se usa para las tablas de Supabase.
 */

/** Variantes de un id con y sin prefijo `band-`/`reg-`, para reasignar también los ids «sueltos». */
export function bandIdVariants(oldId: string, newId: string): Map<string, string> {
  const map = new Map<string, string>([[oldId, newId]]);
  const clean = (id: string) => id.replace(/^(band|reg)-/i, '');
  const oldClean = clean(oldId);
  const newClean = clean(newId);
  if (oldClean && newClean) {
    map.set(oldClean, newClean);
    map.set(`band-${oldClean}`, `band-${newClean}`);
    map.set(`reg-${oldClean}`, `reg-${newClean}`);
  }
  return map;
}

/**
 * Copia profunda de `value` con los ids del mapa sustituidos. No muta la entrada.
 * @param value Cualquier valor serializable (estado completo, colección o fila).
 * @param map Mapa id antiguo → id nuevo (ver {@link bandIdVariants}).
 * @returns El valor con los ids reasignados.
 */
export function renameBandIdInValue<T>(value: T, map: Map<string, string>): T {
  if (typeof value === 'string') return (map.get(value) ?? value) as T;
  if (Array.isArray(value)) return value.map((item) => renameBandIdInValue(item, map)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[map.get(key) ?? key] = renameBandIdInValue(item, map);
    }
    return out as T;
  }
  return value;
}
