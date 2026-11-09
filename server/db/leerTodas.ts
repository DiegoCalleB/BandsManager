/**
 * Supabase corta cada petición a 1000 filas sin avisar. Lee una consulta por páginas hasta que una venga incompleta,
 * para no perder filas (las últimas por orden) de una banda grande. `pagina` recibe el rango y devuelve la consulta.
 */
export async function leerTodas<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  tamano = 1000,
): Promise<T[]> {
  const todas: T[] = [];
  for (let desde = 0; ; desde += tamano) {
    const { data, error } = await pagina(desde, desde + tamano - 1);
    if (error) throw new Error(error.message);
    todas.push(...(data || []));
    if ((data || []).length < tamano) return todas;
  }
}
