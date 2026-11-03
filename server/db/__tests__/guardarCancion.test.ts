import { describe, it, expect } from 'vitest';
import { guardarCancion, variantesDeBanda, COLUMNAS_OPCIONALES } from '../guardarCancion';

/** Cliente falso: guarda qué se llamó y responde según el guion de `actualizaciones` / `altas`. */
function crearSb(guion: { actualizaciones: any[]; altas: any[] }) {
  const llamadas: string[] = [];
  const payloads: any[] = [];
  const filtros: any[] = [];
  const sb: any = {
    from: () => {
      const qb: any = {
        update: (p: any) => { llamadas.push('update'); payloads.push(p); return qb; },
        insert: (p: any) => { llamadas.push('insert'); payloads.push(p); return qb; },
        delete: () => { llamadas.push('delete'); return qb; },
        eq: (c: string, v: any) => { filtros.push([c, v]); return qb; },
        in: (c: string, v: any) => { filtros.push([c, v]); return qb; },
        select: () => qb,
        maybeSingle: async () => guion.actualizaciones.shift() ?? { data: null, error: null },
        single: async () => guion.altas.shift() ?? { data: null, error: null },
      };
      return qb;
    },
  };
  return { sb, llamadas, payloads, filtros };
}
const fila = { id: 's1', band_id: 'band-a', titulo: 'Tema', created_at: '2026-01-01T00:00:00Z' };

describe('guardarCancion: nunca hay un instante sin canción', () => {
  it('si existe, actualiza (acotado a la banda), no borra y no toca la fecha de alta', async () => {
    const { sb, llamadas, payloads, filtros } = crearSb({ actualizaciones: [{ data: { ...fila }, error: null }], altas: [] });
    await guardarCancion(sb, { ...fila }, ['band-a', 'a']);
    expect(llamadas).toEqual(['update']);
    expect(payloads[0]).not.toHaveProperty('created_at');
    expect(filtros).toContainEqual(['band_id', ['band-a', 'a']]);
  });

  it('si no existe, la crea con INSERT', async () => {
    const { sb, llamadas } = crearSb({ actualizaciones: [{ data: null, error: null }], altas: [{ data: { ...fila }, error: null }] });
    await expect(guardarCancion(sb, { ...fila }, ['band-a'])).resolves.toMatchObject({ id: 's1' });
    expect(llamadas).toEqual(['update', 'insert']);
  });

  it('si otra petición la creó a la vez (23505), actualiza esa fila en vez de pelear: sin borrar', async () => {
    const { sb, llamadas } = crearSb({
      actualizaciones: [{ data: null, error: null }, { data: { ...fila }, error: null }],
      altas: [{ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "songs_pkey"' } }],
    });
    await expect(guardarCancion(sb, { ...fila }, ['band-a'])).resolves.toMatchObject({ id: 's1' });
    expect(llamadas).toEqual(['update', 'insert', 'update']);
  });

  it('si la escritura FALLA, lanza y NO ha borrado nada (antes la canción desaparecía)', async () => {
    const { sb, llamadas } = crearSb({ actualizaciones: [{ data: null, error: { message: 'connection reset' } }], altas: [] });
    await expect(guardarCancion(sb, { ...fila }, ['band-a'])).rejects.toThrow(/connection reset/);
    expect(llamadas).not.toContain('delete');
  });

  it('sin una columna de migración reciente, guarda sin ella en vez de fallar', async () => {
    const { sb, payloads } = crearSb({
      actualizaciones: [
        { data: null, error: { message: "Could not find the 'bpm_detectado_en' column of 'songs' in the schema cache" } },
        { data: { ...fila }, error: null },
      ],
      altas: [],
    });
    await guardarCancion(sb, { ...fila, bpm_detectado_en: null, notas_miembros: {} }, ['band-a']);
    expect(payloads[0]).toHaveProperty('bpm_detectado_en');
    for (const c of COLUMNAS_OPCIONALES) expect(payloads[1]).not.toHaveProperty(c);
  });
});

describe('variantesDeBanda', () => {
  it('cubre con y sin prefijo y no repite', () => {
    expect(variantesDeBanda('band-ruta-66').sort()).toEqual(['band-ruta-66', 'reg-ruta-66', 'ruta-66'].sort());
    expect(variantesDeBanda('x', 'band-x').sort()).toEqual(['band-x', 'reg-x', 'x']);
    expect(variantesDeBanda(undefined, '  ')).toEqual([]);
  });
});
