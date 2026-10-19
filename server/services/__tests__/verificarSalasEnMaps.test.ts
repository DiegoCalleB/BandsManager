import { describe, it, expect, vi } from 'vitest';
import { verificarSalasEnMaps, type PuertoVerificacion } from '../verificarSalasEnMaps.js';
import type { SalaGuardada } from '../catalogoSalas.js';
import type { EstadoNegocio } from '../../utils/estadoNegocio.js';

const sala = (id: string, nombre: string, place_id: string | null = null) => ({ id, nombre, place_id, ciudad: 'Madrid' }) as SalaGuardada;
const AHORA = new Date('2026-10-18T12:00:00Z');

function montar(salas: SalaGuardada[]) {
  const guardado: Array<[string, EstadoNegocio]> = [];
  const puerto: PuertoVerificacion = {
    salasPendientes: vi.fn(async () => salas),
    guardarEstado: vi.fn(async (id, estado) => void guardado.push([id, estado])),
  };
  return { puerto, guardado };
}

describe('verificarSalasEnMaps', () => {
  it('anota abierta, cerrada temporal y cerrada definitivamente', async () => {
    const { puerto, guardado } = montar([sala('s1', 'Uno', 'P1'), sala('s2', 'Dos', 'P2'), sala('s3', 'Tres', 'P3')]);
    const estados: Record<string, string> = { P1: 'OPERATIONAL', P2: 'CLOSED_TEMPORARILY', P3: 'CLOSED_PERMANENTLY' };
    const r = await verificarSalasEnMaps({ puerto, ahora: () => AHORA, consultarMaps: async (s) => ({ id: s.place_id!, nombre: s.nombre, businessStatus: estados[s.place_id!] }) });
    expect(guardado).toEqual([['s1', 'operativo'], ['s2', 'cerrado_temporal'], ['s3', 'cerrado_permanente']]);
    expect(r).toMatchObject({ revisadas: 3, operativas: 1, cerradasTemporal: 1, cerradasPermanente: 1, errores: 0 });
  });

  it('si Maps devuelve otra sala, no la marca cerrada: la deja sin verificar', async () => {
    const { puerto, guardado } = montar([sala('s1', 'Moby Dick')]);
    const r = await verificarSalasEnMaps({ puerto, ahora: () => AHORA, consultarMaps: async () => ({ id: 'X', nombre: 'Bar La Esquina', businessStatus: 'CLOSED_PERMANENTLY' }) });
    expect(guardado).toEqual([['s1', 'sin_verificar']]);
    expect(r.sinCoincidencia).toBe(1);
    expect(r.cerradasPermanente).toBe(0);
  });

  it('un error de red no escribe nada y tras varios seguidos se detiene', async () => {
    const { puerto, guardado } = montar([sala('s1', 'A', 'P'), sala('s2', 'B', 'P'), sala('s3', 'C', 'P'), sala('s4', 'D', 'P')]);
    const consultarMaps = vi.fn(async () => { throw new Error('cuota'); });
    const r = await verificarSalasEnMaps({ puerto, ahora: () => AHORA, consultarMaps });
    expect(guardado).toEqual([]);
    expect(r.errores).toBe(3);
    expect(consultarMaps).toHaveBeenCalledTimes(3);
  });

  it('pide solo las salas sin comprobar en los últimos 90 días', async () => {
    const { puerto } = montar([]);
    await verificarSalasEnMaps({ puerto, ahora: () => AHORA, consultarMaps: async () => null });
    const [limite, antesDe] = (puerto.salasPendientes as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(limite).toBe(40);
    expect((antesDe as Date).toISOString()).toBe('2026-07-20T12:00:00.000Z');
  });
});
