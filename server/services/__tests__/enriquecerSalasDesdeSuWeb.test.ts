import { describe, it, expect, vi } from 'vitest';
import { enriquecerSalasDesdeSuWeb, type PuertoEnriquecimientoWeb } from '../enriquecerSalasDesdeSuWeb.js';
import type { SalaGuardada } from '../catalogoSalas.js';
import type { DatosDeWebSala } from '../../utils/datosDeWebSala.js';

const sala = (id: string, extra: Partial<SalaGuardada> = {}): SalaGuardada =>
  ({ id, clave: `nc:${id}|madrid`, nombre: `Sala ${id}`, website: `https://${id}.es/`, instagram: null, email_contacto: null, telefono: null, genero: null, ...extra }) as SalaGuardada;

const nada: DatosDeWebSala = { instagram: null, email_contacto: null, telefono: null, genero: null };
const AHORA = new Date('2026-10-20T12:00:00Z');

function montar(salas: SalaGuardada[]) {
  const guardado: Array<[string, Record<string, string>]> = [];
  const puerto: PuertoEnriquecimientoWeb = {
    salasPorEnriquecer: vi.fn(async () => salas),
    guardarEnriquecimiento: vi.fn(async (id, campos) => void guardado.push([id, campos as Record<string, string>])),
  };
  return { puerto, guardado };
}

describe('enriquecerSalasDesdeSuWeb', () => {
  it('rellena solo los campos vacíos y nunca pisa lo que ya había', async () => {
    const { puerto, guardado } = montar([sala('a', { instagram: 'propio', email_contacto: 'info@a.es' })]);
    const r = await enriquecerSalasDesdeSuWeb({
      puerto, ahora: () => AHORA, leerWeb: async () => ['<html>'],
      extraer: () => ({ instagram: 'otro', email_contacto: 'booking@a.es', telefono: '910000000', genero: 'Rock' }),
    });
    expect(guardado).toEqual([['a', { telefono: '910000000', genero: 'Rock' }]]);
    expect(r).toMatchObject({ revisadas: 1, completadas: 1, camposRellenados: { instagram: 0, email_contacto: 0, telefono: 1, genero: 1 } });
  });

  it('anota la revisión aunque no encuentre nada, para que la sala pase al final de la cola', async () => {
    const { puerto, guardado } = montar([sala('a')]);
    const r = await enriquecerSalasDesdeSuWeb({ puerto, ahora: () => AHORA, leerWeb: async () => ['<html>'], extraer: () => nada });
    expect(guardado).toEqual([['a', {}]]);
    expect(r.completadas).toBe(0);
  });

  it('una web caída o ilegible no rompe nada: se anota y se sigue', async () => {
    const { puerto, guardado } = montar([sala('a'), sala('b')]);
    const leerWeb = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(['<html>']);
    const r = await enriquecerSalasDesdeSuWeb({ puerto, ahora: () => AHORA, leerWeb, extraer: () => ({ ...nada, genero: 'Jazz' }) });
    expect(guardado.map(([id]) => id)).toEqual(['a', 'b']);
    expect(r).toMatchObject({ revisadas: 2, sinWeb: 1, completadas: 1 });
  });

  it('pide solo las revisadas hace más de 90 días y respeta el límite', async () => {
    const { puerto } = montar([]);
    await enriquecerSalasDesdeSuWeb({ puerto, ahora: () => AHORA, leerWeb: async () => null, extraer: () => nada });
    const [limite, antesDe] = (puerto.salasPorEnriquecer as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(limite).toBe(40);
    expect((antesDe as Date).toISOString()).toBe('2026-07-22T12:00:00.000Z');
  });

  it('sin web guardada no intenta leer nada', async () => {
    const { puerto } = montar([sala('a', { website: null })]);
    const leerWeb = vi.fn();
    const r = await enriquecerSalasDesdeSuWeb({ puerto, ahora: () => AHORA, leerWeb, extraer: () => nada });
    expect(leerWeb).not.toHaveBeenCalled();
    expect(r.sinWeb).toBe(1);
  });
});
