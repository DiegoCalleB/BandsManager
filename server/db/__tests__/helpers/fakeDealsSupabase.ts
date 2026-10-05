/**
 * Supabase falso en memoria, solo para la tabla concert_deals. Soporta lo que usa server/db/deals.ts:
 * select / eq / order / limit / maybeSingle, upsert(onConflict), update().eq().eq().select().
 * Permite simular errores (p. ej. tabla inexistente) con `fallo`.
 */
export function crearFakeDealsSupabase() {
  const filas: any[] = [];
  const estado: { fallo: null | { code?: string; message: string } } = { fallo: null };

  function from(tabla: string) {
    if (tabla !== 'concert_deals') throw new Error(`tabla no simulada: ${tabla}`);
    let modo: 'select' | 'update' | 'upsert' = 'select';
    let parche: any = null;
    let carga: any = null;
    let conflicto = 'id';
    let devuelve = false;
    const filtros: Array<[string, any]> = [];
    let limite = Infinity;
    let orden: null | { col: string; asc: boolean } = null;

    const ejecutar = () => {
      if (estado.fallo) return { data: null, error: estado.fallo };
      let sel = filas.filter((f) => filtros.every(([c, v]) => f[c] === v));
      if (modo === 'select') {
        if (orden) {
          const { col, asc } = orden;
          sel = [...sel].sort((a, b) => (a[col] > b[col] ? 1 : -1) * (asc ? 1 : -1));
        }
        return { data: sel.slice(0, limite), error: null };
      }
      if (modo === 'update') {
        sel.forEach((f) => Object.assign(f, parche));
        return { data: devuelve ? sel.map((f) => ({ ...f })) : null, error: null };
      }
      const i = filas.findIndex((f) => f[conflicto] === carga[conflicto]);
      if (i >= 0) filas[i] = { ...filas[i], ...carga };
      else filas.push({ ...carga });
      const guardada = filas.find((f) => f[conflicto] === carga[conflicto]);
      return { data: devuelve ? [{ ...guardada }] : null, error: null };
    };

    const q: any = {
      select: () => {
        if (modo !== 'select') devuelve = true;
        return q;
      },
      eq: (c: string, v: any) => (filtros.push([c, v]), q),
      order: (col: string, o?: { ascending?: boolean }) => ((orden = { col, asc: o?.ascending !== false }), q),
      limit: (n: number) => ((limite = n), q),
      update: (p: any) => ((modo = 'update'), (parche = p), q),
      upsert: (p: any, o?: { onConflict?: string }) => ((modo = 'upsert'), (carga = p), (conflicto = o?.onConflict || 'id'), q),
      maybeSingle: async () => {
        const r: any = ejecutar();
        return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: r.error };
      },
      then: (resolve: any, reject: any) => Promise.resolve(ejecutar()).then(resolve, reject)
    };
    return q;
  }

  return { client: { from }, filas, estado };
}
