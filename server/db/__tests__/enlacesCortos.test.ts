/**
 * Capa de datos de los enlaces cortos. Lo que protege este fichero son INVARIANTES, no la
 * implementación: dos peticiones iguales dan el mismo código, una banda nunca ve ni borra los
 * enlaces o clics de otra, y el tope por banda se respeta.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearFakeSupabaseTablas } from './helpers/fakeSupabaseTablas';

const fake = crearFakeSupabaseTablas({
  short_links: [['code'], ['band_id', 'clave']],
});
vi.mock('../core.js', async (orig) => ({ ...(await orig<any>()), getSupabase: () => fake.client }));

import {
  dbAsegurarEnlace,
  dbBorrarEnlace,
  dbClicsDeBanda,
  dbContarEnlaces,
  dbGetEnlacePorCodigo,
  dbListarEnlaces,
  dbRegistrarClic,
} from '../enlacesCortos';
import { MAX_ENLACES_POR_BANDA, normalizarCodigo } from '../../utils/enlacesCortos';

beforeEach(() => {
  for (const k of Object.keys(fake.tablas)) fake.tablas[k].length = 0;
  fake.estado.fallosPorTabla = {};
});

describe('dbAsegurarEnlace', () => {
  it('crea un enlace con código válido y devuelve el MISMO al pedirlo otra vez (idempotente)', async () => {
    const a = await dbAsegurarEnlace('band-a', { concertId: 'c1', destino: 'entradas', canal: 'instagram' });
    const b = await dbAsegurarEnlace('band-a', { concertId: 'c1', destino: 'entradas', canal: 'instagram' });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.creado).toBe(true);
    expect(b.creado).toBe(false);
    expect(b.enlace.code).toBe(a.enlace.code);
    expect(normalizarCodigo(a.enlace.code)).toBe(a.enlace.code);
    expect(fake.tablas.short_links).toHaveLength(1);
  });

  it('canales y conciertos distintos son enlaces distintos', async () => {
    const codigos = new Set<string>();
    for (const canal of ['instagram', 'tiktok'] as const) {
      for (const concertId of ['c1', 'c2']) {
        const r = await dbAsegurarEnlace('band-a', { concertId, destino: 'entradas', canal });
        if (r.ok) codigos.add(r.enlace.code);
      }
    }
    expect(codigos.size).toBe(4);
  });

  it('dos bandas pueden tener el «mismo» enlace sin pisarse', async () => {
    const a = await dbAsegurarEnlace('band-a', { concertId: 'c1', destino: 'epk', canal: 'web' });
    const b = await dbAsegurarEnlace('band-b', { concertId: 'c1', destino: 'epk', canal: 'web' });
    if (!a.ok || !b.ok) throw new Error('no ok');
    expect(a.enlace.code).not.toBe(b.enlace.code);
    expect(a.enlace.band_id).toBe('band-a');
    expect(b.enlace.band_id).toBe('band-b');
  });

  it('si otra petición crea la misma huella a la vez (23505), devuelve la ganadora sin duplicar', async () => {
    // Simula la carrera: la búsqueda inicial no ve nada, pero el insert choca con la huella.
    fake.tablas.short_links.push({ code: 'zzzzzzz', band_id: 'band-a', concert_id: 'c1', destino: 'entradas', canal: 'tiktok', clave: 'c1|entradas|tiktok' });
    const original = fake.client.from;
    let primera = true;
    (fake.client as any).from = (n: string) => {
      const q = original(n);
      if (n === 'short_links' && primera) {
        const maybe = q.maybeSingle;
        q.maybeSingle = async () => {
          if (primera) {
            primera = false;
            return { data: null, error: null };
          }
          return maybe();
        };
      }
      return q;
    };
    try {
      const r = await dbAsegurarEnlace('band-a', { concertId: 'c1', destino: 'entradas', canal: 'tiktok' });
      expect(r.ok && r.enlace.code).toBe('zzzzzzz');
      expect(fake.tablas.short_links).toHaveLength(1);
    } finally {
      (fake.client as any).from = original;
    }
  });

  it('respeta el tope de enlaces por banda, pero sigue devolviendo los que ya existen', async () => {
    for (let i = 0; i < MAX_ENLACES_POR_BANDA; i++) {
      fake.tablas.short_links.push({ code: `c${i}`, band_id: 'band-a', concert_id: `x${i}`, destino: 'epk', canal: 'web', clave: `x${i}|epk|web` });
    }
    const nuevo = await dbAsegurarEnlace('band-a', { concertId: 'nuevo', destino: 'epk', canal: 'web' });
    expect(nuevo).toEqual({ ok: false, motivo: 'limite' });
    const existente = await dbAsegurarEnlace('band-a', { concertId: 'x5', destino: 'epk', canal: 'web' });
    expect(existente.ok && existente.enlace.code).toBe('c5');
    // El tope es por banda: otra banda no se ve afectada.
    expect((await dbAsegurarEnlace('band-b', { concertId: 'nuevo', destino: 'epk', canal: 'web' })).ok).toBe(true);
  });

  it('propaga un error real de la base de datos (no lo disfraza de «límite»)', async () => {
    fake.estado.fallosPorTabla.short_links = { message: 'connection refused' };
    await expect(dbAsegurarEnlace('band-a', { concertId: 'c1', destino: 'epk', canal: 'web' })).rejects.toThrow(/connection refused/);
  });

  it('exige una banda válida (no hay banda por defecto)', async () => {
    await expect(dbAsegurarEnlace('', { destino: 'epk', canal: 'web' })).rejects.toThrow(/band_id/);
  });
});

describe('aislamiento entre bandas', () => {
  beforeEach(async () => {
    await dbAsegurarEnlace('band-a', { concertId: 'c1', destino: 'entradas', canal: 'instagram' });
    await dbAsegurarEnlace('band-b', { concertId: 'c9', destino: 'entradas', canal: 'instagram' });
  });

  it('listar solo devuelve los de la banda pedida', async () => {
    const a = await dbListarEnlaces('band-a');
    expect(a).toHaveLength(1);
    expect(a.every((e) => e.band_id === 'band-a')).toBe(true);
    expect(await dbContarEnlaces('band-a')).toBe(1);
  });

  it('filtrar por concierto de otra banda no devuelve nada', async () => {
    expect(await dbListarEnlaces('band-a', 'c9')).toEqual([]);
  });

  it('borrar un código de OTRA banda no borra nada', async () => {
    const [ajeno] = await dbListarEnlaces('band-b');
    expect(await dbBorrarEnlace(ajeno.code, 'band-a')).toBe(false);
    expect(await dbListarEnlaces('band-b')).toHaveLength(1);
    expect(await dbBorrarEnlace(ajeno.code, 'band-b')).toBe(true);
    expect(await dbListarEnlaces('band-b')).toHaveLength(0);
  });

  it('los clics solo se leen de la banda pedida', async () => {
    const [a] = await dbListarEnlaces('band-a');
    const [b] = await dbListarEnlaces('band-b');
    await dbRegistrarClic({ code: a.code, bandId: 'band-a', visitante: 'v1', dispositivo: 'movil', origen: 'instagram.com' });
    await dbRegistrarClic({ code: b.code, bandId: 'band-b', visitante: 'v2', dispositivo: 'movil', origen: null });
    const desde = new Date(Date.now() - 86_400_000).toISOString();
    expect((await dbClicsDeBanda('band-a', desde)).map((c) => c.code)).toEqual([a.code]);
    expect((await dbClicsDeBanda('band-b', desde)).map((c) => c.code)).toEqual([b.code]);
  });

  it('la búsqueda por código (redirección pública) devuelve la fila con SU banda', async () => {
    const [b] = await dbListarEnlaces('band-b');
    expect((await dbGetEnlacePorCodigo(b.code))?.band_id).toBe('band-b');
    expect(await dbGetEnlacePorCodigo('inexist')).toBeNull();
  });
});

describe('dbRegistrarClic', () => {
  it('no guarda IP ni nada personal: solo código, banda, hash, dispositivo y host de origen', async () => {
    await dbRegistrarClic({ code: 'abcdefg', bandId: 'band-a', visitante: 'hash16', dispositivo: 'movil', origen: 'instagram.com' });
    const fila = fake.tablas.short_link_clicks[0];
    expect(Object.keys(fila).sort()).toEqual(['band_id', 'clicked_at', 'code', 'created_at', 'dispositivo', 'origen', 'visitante']);
  });
});
