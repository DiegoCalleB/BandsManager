/**
 * Supabase falso en memoria para los tests de acuerdos y aportaciones. Soporta lo que usan
 * server/db/deals.ts y server/db/dealSupport.ts: select / eq / gte / in / order / limit /
 * maybeSingle, upsert(onConflict), update().eq().eq().select(). Varias tablas (`tablas`);
 * `filas` apunta a concert_deals por compatibilidad. `fallo` rompe todas las tablas y
 * `fallosPorTabla` solo la indicada (p. ej. tabla inexistente).
 */
export function crearFakeDealsSupabase() {
  const tablas: Record<string, any[]> = { concert_deals: [], deal_support_contributions: [] };
  const filas = tablas.concert_deals;
  const estado: {
    fallo: null | { code?: string; message: string };
    fallosPorTabla: Record<string, { code?: string; message: string } | undefined>;
  } = { fallo: null, fallosPorTabla: {} };

  function from(nombre: string) {
    const datos = (tablas[nombre] ??= []);
    let modo: 'select' | 'update' | 'upsert' = 'select';
    let parche: any = null;
    let carga: any = null;
    let conflicto = 'id';
    let devuelve = false;
    const filtros: Array<(f: any) => boolean> = [];
    let limite = Infinity;
    let orden: null | { col: string; asc: boolean } = null;

    const ejecutar = () => {
      const fallo = estado.fallosPorTabla[nombre] || estado.fallo;
      if (fallo) return { data: null, error: fallo };
      let sel = datos.filter((f) => filtros.every((ok) => ok(f)));
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
      const i = datos.findIndex((f) => f[conflicto] === carga[conflicto]);
      if (i >= 0) datos[i] = { ...datos[i], ...carga };
      else datos.push({ ...carga });
      const guardada = datos.find((f) => f[conflicto] === carga[conflicto]);
      return { data: devuelve ? [{ ...guardada }] : null, error: null };
    };

    const q: any = {
      select: () => {
        if (modo !== 'select') devuelve = true;
        return q;
      },
      eq: (c: string, v: any) => (filtros.push((f) => f[c] === v), q),
      gte: (c: string, v: any) => (filtros.push((f) => f[c] != null && f[c] >= v), q),
      in: (c: string, vs: any[]) => (filtros.push((f) => vs.includes(f[c])), q),
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

  return { client: { from }, filas, tablas, estado };
}
