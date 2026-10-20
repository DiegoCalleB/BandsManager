import { describe, it, expect, vi } from 'vitest';
import { importarSalasDeBandflow, type PuertoSemilla } from '../importarSalasBandflow.js';
import type { SalaAGuardar, SalaGuardada } from '../catalogoSalas.js';
import type { CamposPublicosSala } from '../../utils/salaCatalogo.js';

const sala = (nombre: string, extra: Partial<CamposPublicosSala> = {}): CamposPublicosSala => ({
  clave: `nc:${nombre.toLowerCase()}|madrid`, place_id: null, nombre, ciudad: 'Madrid', region: 'Comunidad de Madrid', direccion: null, tipo: 'sala',
  aforo: null, genero: null, website: null, instagram: null, email_contacto: null, telefono: null, ...extra,
});

const existente = (o: Partial<SalaGuardada> & { clave: string; id: string }): SalaGuardada =>
  ({ ...sala('X'), nivel: 'sin_verificar', puntuacion: 0, verificada_en: null, bandas_con_respuesta: 0, bandas_con_entrega: 0, rebotes: 0, no_contactar: false, ...o }) as SalaGuardada;

function montar(salas: SalaGuardada[] = [], alias: Array<{ aliasClave: string; clave: string }> = []) {
  const guardadas: SalaAGuardar[] = [];
  const puerto: PuertoSemilla = {
    leerSalas: vi.fn(async () => salas),
    guardarSalas: vi.fn(async (s) => void guardadas.push(...s)),
    leerAlias: vi.fn(async () => alias as never),
  };
  return { puerto, guardadas };
}

describe('importarSalasDeBandflow', () => {
  it('añade las salas nuevas como sin verificar y anota su procedencia', async () => {
    const { puerto, guardadas } = montar();
    const r = await importarSalasDeBandflow({ puerto, salas: [sala('Sala Alfa', { website: 'https://alfa.es/' })] });
    expect(r).toMatchObject({ nuevas: 1, completadas: 0, salasEnSemilla: 1 });
    expect(guardadas[0]).toMatchObject({ nombre: 'Sala Alfa', nivel: 'sin_verificar', fuentes: ['bandflow'], bandas_con_entrega: 0 });
  });

  it('a una sala existente solo le rellena lo que le falta y anota la procedencia', async () => {
    const { puerto, guardadas } = montar([existente({ id: 's1', clave: 'nc:sala alfa|madrid', nombre: 'Sala Alfa', website: 'https://propia.es/', nivel: 'probable', puntuacion: 50, fuentes: ['osm'] })]);
    const r = await importarSalasDeBandflow({ puerto, salas: [sala('Sala Alfa', { website: 'https://otra.es/', aforo: 300 })] });
    expect(r.completadas).toBe(1);
    expect(guardadas[0]).toMatchObject({ id: 's1', website: 'https://propia.es/', aforo: 300, nivel: 'probable', fuentes: ['osm', 'bandflow'] });
  });

  it('nunca toca una sala verificada', async () => {
    const { puerto, guardadas } = montar([existente({ id: 's1', clave: 'nc:sala alfa|madrid', nombre: 'Sala Alfa', nivel: 'verificada' })]);
    const r = await importarSalasDeBandflow({ puerto, salas: [sala('Sala Alfa', { aforo: 300 })] });
    expect(r.sinCambios).toBe(1);
    expect(guardadas).toEqual([]);
  });

  it('respeta los alias: no crea una fila nueva con un nombre que ya es alias de otra', async () => {
    const { puerto, guardadas } = montar([existente({ id: 's1', clave: 'nc:sala alfa|madrid', nombre: 'Sala Alfa' })], [{ aliasClave: 'nc:alfa|madrid', clave: 'nc:sala alfa|madrid' }]);
    const r = await importarSalasDeBandflow({ puerto, salas: [sala('Alfa', { aforo: 300 })] });
    expect(r.nuevas).toBe(0);
    expect(guardadas[0]).toMatchObject({ id: 's1', aforo: 300 });
  });

  it('en simulación cuenta pero no escribe, y repetirla no cambia nada', async () => {
    const { puerto } = montar();
    const r = await importarSalasDeBandflow({ puerto, simulacion: true, salas: [sala('Sala Alfa')] });
    expect(r).toMatchObject({ simulacion: true, nuevas: 1 });
    expect(puerto.guardarSalas).not.toHaveBeenCalled();
    const { puerto: p2, guardadas } = montar([existente({ id: 's1', clave: 'nc:sala alfa|madrid', nombre: 'Sala Alfa', aforo: 300 })]);
    expect((await importarSalasDeBandflow({ puerto: p2, salas: [sala('Sala Alfa', { aforo: 300 })] })).sinCambios).toBe(1);
    expect(guardadas).toEqual([]);
  });

  it('con la semilla real y un catálogo vacío entran todas, y repetirla no cambia nada', async () => {
    const { SALAS_BANDFLOW } = await import('../../data/bandflowSalas.js');
    const { puerto, guardadas } = montar();
    const r = await importarSalasDeBandflow({ puerto });
    expect(r.nuevas).toBe(SALAS_BANDFLOW.length);
    expect(new Set(guardadas.map((g) => g.id)).size).toBe(SALAS_BANDFLOW.length);
    expect(guardadas.every((g) => g.nivel === 'sin_verificar' && g.fuentes?.[0] === 'bandflow')).toBe(true);

    const { puerto: p2, guardadas: g2 } = montar(guardadas.map((g) => ({ ...g, no_contactar: false }) as SalaGuardada));
    const r2 = await importarSalasDeBandflow({ puerto: p2 });
    expect(r2).toMatchObject({ nuevas: 0, completadas: 0 });
    expect(g2).toEqual([]);
  });
});
