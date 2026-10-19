import { describe, it, expect, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();
vi.mock('../core.js', () => ({ getSupabase: () => ({ from: fromMock }) }));

import { leadParaCatalogo, MARCA_REBOTE, puertoCatalogoSupabase, salaDeFila } from '../salasCatalogo';

beforeEach(() => vi.clearAllMocks());

describe('leadParaCatalogo', () => {
  const base = { id: '1', band_id: 'b', nombre_sala: 'Sala', ciudad: 'Madrid' };

  it('marca el rebote a partir de la marca del Lector y no deja pasar el texto de las notas', () => {
    const l = leadParaCatalogo({ ...base, notas: `contacto privado\n${MARCA_REBOTE} Usuario no existe` });
    expect(l.rebotado).toBe(true);
    expect(l).not.toHaveProperty('notas');
    expect(JSON.stringify(l)).not.toContain('contacto privado');
  });

  it('sin la marca, o sin notas, no hay rebote', () => {
    expect(leadParaCatalogo({ ...base, notas: 'todo bien' }).rebotado).toBe(false);
    expect(leadParaCatalogo({ ...base, notas: null }).rebotado).toBe(false);
    expect(leadParaCatalogo(base).rebotado).toBe(false);
  });
});

describe('salaDeFila', () => {
  it('convierte la fecha de verificación en Date, o la deja en null', () => {
    const fila = { id: 's', verificada_en: '2026-10-18T12:00:00.000Z' } as never;
    expect(salaDeFila(fila).verificada_en).toEqual(new Date('2026-10-18T12:00:00.000Z'));
    expect(salaDeFila({ id: 's', verificada_en: null } as never).verificada_en).toBeNull();
  });
});

describe('puertoCatalogoSupabase', () => {
  function tabla(paginas: unknown[][], error: { message: string } | null = null) {
    const rangos: Array<[number, number]> = [];
    let i = 0;
    const qb: Record<string, unknown> = {
      select: () => qb,
      order: () => qb,
      range: (a: number, b: number) => { rangos.push([a, b]); return Promise.resolve({ data: paginas[i++] ?? [], error }); },
    };
    return { qb, rangos };
  }

  it('lee los leads por páginas de 1000 hasta agotarlos', async () => {
    const fila = (n: number) => ({ id: `l${n}`, band_id: 'b', nombre_sala: 'S', ciudad: 'C' });
    const { qb, rangos } = tabla([Array.from({ length: 1000 }, (_, n) => fila(n)), [fila(1000), fila(1001)]]);
    fromMock.mockReturnValue(qb);
    const leads = await puertoCatalogoSupabase.leerLeads();
    expect(leads).toHaveLength(1002);
    expect(rangos).toEqual([[0, 999], [1000, 1999]]);
    expect(fromMock).toHaveBeenCalledWith('leads');
  });

  it('un error de lectura se propaga con contexto, no se traga', async () => {
    const { qb } = tabla([], { message: 'permiso denegado' });
    fromMock.mockReturnValue(qb);
    await expect(puertoCatalogoSupabase.leerLeads()).rejects.toThrow(/No se pudo leer leads: permiso denegado/);
  });

  it('guarda por upsert con la fecha en ISO y sin tocar no_contactar', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });
    await puertoCatalogoSupabase.guardarSalas([{ id: 's1', clave: 'k', nombre: 'N', verificada_en: new Date('2026-10-18T12:00:00Z') } as never]);
    const [filas, opciones] = upsert.mock.calls[0];
    expect(opciones).toEqual({ onConflict: 'id' });
    expect(filas[0].verificada_en).toBe('2026-10-18T12:00:00.000Z');
    expect(filas[0]).not.toHaveProperty('no_contactar');
    expect(filas[0].updated_at).toEqual(expect.any(String));
  });

  it('un lote con salas nuevas y ya existentes no lleva created_at en ninguna (la base lo gestiona)', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });
    await puertoCatalogoSupabase.guardarSalas([
      { id: 'nueva', clave: 'a', nombre: 'Nueva', verificada_en: null } as never,
      { id: 'vieja', clave: 'b', nombre: 'Vieja', verificada_en: null, created_at: '2026-10-01T00:00:00Z' } as never,
    ]);
    const [filas] = upsert.mock.calls[0];
    expect(filas.map((f: Record<string, unknown>) => 'created_at' in f)).toEqual([false, false]);
  });

  it('no llama a la base de datos si no hay nada que guardar', async () => {
    await puertoCatalogoSupabase.guardarSalas([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('enlaza los leads agrupados por sala: una petición por sala', async () => {
    const inMock = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ in: inMock }));
    fromMock.mockReturnValue({ update });
    await puertoCatalogoSupabase.enlazarLeads([
      { leadId: 'a', salaId: 's1' }, { leadId: 'b', salaId: 's1' }, { leadId: 'c', salaId: 's2' },
    ]);
    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith({ sala_id: 's1' });
    expect(inMock).toHaveBeenCalledWith('id', ['a', 'b']);
    expect(inMock).toHaveBeenCalledWith('id', ['c']);
  });

  it('un fallo al enlazar se propaga', async () => {
    fromMock.mockReturnValue({ update: () => ({ in: vi.fn().mockResolvedValue({ error: { message: 'fk' } }) }) });
    await expect(puertoCatalogoSupabase.enlazarLeads([{ leadId: 'a', salaId: 's1' }])).rejects.toThrow(/No se pudo enlazar/);
  });
});
