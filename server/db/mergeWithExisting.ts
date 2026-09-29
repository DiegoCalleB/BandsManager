const toCamel = (key: string) =>
  key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/**
 * Mezcla un guardado parcial sobre la fila que ya había en la base de datos.
 *
 * Lo que manda el caller gana SIEMPRE, venga en snake_case o en camelCase; la fila existente
 * solo rellena lo que el caller no mandó en ninguna de las dos grafías.
 *
 * Por qué no basta `{ ...existing, ...incoming }`: la fila de Supabase viene en snake_case
 * (`gastos_detalle`) y el frontend manda camelCase (`gastosDetalle`). Con el spread plano
 * conviven las dos claves y `merged.gastos_detalle || merged.gastosDetalle` se queda con el
 * valor VIEJO — editar los gastos de un concierto desde Finanzas no guardaba nada. Tampoco
 * cuenta como "mandado" un `undefined` explícito: si lo contara, el spread pisaría el valor
 * existente con `undefined` y volvería el reseteo silencioso a []/{} que esto evita.
 */
export function mergeWithExisting<T extends Record<string, any>>(
  existing: Record<string, any> | null | undefined,
  incoming: T
): Record<string, any> {
  const sent = Object.fromEntries(
    Object.entries(incoming || {}).filter(([, v]) => v !== undefined)
  );
  const kept = Object.fromEntries(
    Object.entries(existing || {}).filter(
      ([k]) => !(k in sent) && !(toCamel(k) in sent)
    )
  );
  return { ...kept, ...sent };
}
