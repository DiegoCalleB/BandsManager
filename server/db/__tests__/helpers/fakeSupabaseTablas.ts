/**
 * Supabase falso en memoria con lo básico de un CRUD: select / insert / update / delete con
 * eq, in, is, gte, order, limit, maybeSingle, single y `select(_, { count: 'exact', head: true })`.
 * Las restricciones únicas se declaran por tabla en `unicos` y un insert que las rompe devuelve
 * el error `23505` de Postgres, que es lo que hace el cliente real. `fallosPorTabla` rompe una tabla.
 *
 * Pensado para probar capas de datos que mezclan lecturas y escrituras por banda
 * (server/db/enlacesCortos.ts, server/db/referidos.ts). Para acuerdos y aportaciones hay otro más
 * específico: `fakeDealsSupabase.ts`.
 */
export function crearFakeSupabaseTablas(unicos: Record<string, string[][]> = {}) {
  const tablas: Record<string, any[]> = {};
  const estado: { fallosPorTabla: Record<string, { code?: string; message: string } | undefined>; consultas: string[] } = {
    fallosPorTabla: {},
    consultas: [],
  };

  function from(nombre: string) {
    const datos = (tablas[nombre] ??= []);
    let modo: 'select' | 'insert' | 'update' | 'delete' = 'select';
    let carga: any = null;
    let parche: any = null;
    let devuelve = false;
    let soloConteo = false;
    let conConteo = false;
    let limite = Infinity;
    let orden: null | { col: string; asc: boolean } = null;
    const filtros: Array<(f: any) => boolean> = [];

    const ejecutar = (): { data: any; error: any; count?: number } => {
      estado.consultas.push(`${modo} ${nombre}`);
      const fallo = estado.fallosPorTabla[nombre];
      if (fallo) return { data: null, error: fallo };

      const sel = datos.filter((f) => filtros.every((ok) => ok(f)));

      if (modo === 'select') {
        let filas = sel;
        if (orden) {
          const { col, asc } = orden;
          filas = [...sel].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
        }
        const out: any = { data: soloConteo ? null : filas.slice(0, limite).map((f) => ({ ...f })), error: null };
        if (conConteo) out.count = sel.length;
        return out;
      }

      if (modo === 'insert') {
        const filas = Array.isArray(carga) ? carga : [carga];
        const nuevas: any[] = [];
        for (const fila of filas) {
          for (const cols of unicos[nombre] || []) {
            const choca = datos.some((f) => cols.every((c) => f[c] !== undefined && f[c] !== null && f[c] === fila[c]));
            if (choca) {
              return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint on (${cols.join(',')})` } };
            }
          }
          const copia = { created_at: new Date().toISOString(), ...fila };
          datos.push(copia);
          nuevas.push(copia);
        }
        return { data: devuelve ? nuevas.map((f) => ({ ...f })) : null, error: null };
      }

      if (modo === 'update') {
        sel.forEach((f) => Object.assign(f, parche));
        return { data: devuelve ? sel.map((f) => ({ ...f })) : null, error: null };
      }

      // delete
      for (const f of sel) datos.splice(datos.indexOf(f), 1);
      return { data: devuelve ? sel.map((f) => ({ ...f })) : null, error: null };
    };

    const q: any = {
      select: (_cols?: string, opciones?: { count?: string; head?: boolean }) => {
        if (modo !== 'select') devuelve = true;
        if (opciones?.count) conConteo = true;
        if (opciones?.head) soloConteo = true;
        return q;
      },
      insert: (p: any) => ((modo = 'insert'), (carga = p), q),
      update: (p: any) => ((modo = 'update'), (parche = p), q),
      delete: () => ((modo = 'delete'), q),
      eq: (c: string, v: any) => (filtros.push((f) => f[c] === v), q),
      in: (c: string, vs: any[]) => (filtros.push((f) => vs.includes(f[c])), q),
      is: (c: string, v: any) => (filtros.push((f) => (v === null ? f[c] == null : f[c] === v)), q),
      gte: (c: string, v: any) => (filtros.push((f) => f[c] != null && f[c] >= v), q),
      order: (col: string, o?: { ascending?: boolean }) => ((orden = { col, asc: o?.ascending !== false }), q),
      limit: (n: number) => ((limite = n), q),
      maybeSingle: async () => {
        const r = ejecutar();
        return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: r.error };
      },
      single: async () => {
        const r = ejecutar();
        const fila = Array.isArray(r.data) ? r.data[0] ?? null : r.data;
        return { data: fila, error: r.error || (fila ? null : { code: 'PGRST116', message: 'No rows' }) };
      },
      then: (resolve: any, reject: any) => Promise.resolve(ejecutar()).then(resolve, reject),
    };
    return q;
  }

  return { client: { from }, tablas, estado };
}
