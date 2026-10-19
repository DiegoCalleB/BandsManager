import { describe, it, expect, vi } from 'vitest';
import { crearDescargaOsm, importarSalasDeOsm, type PuertoImportacion } from '../importarSalasOsm.js';
import type { SalaAGuardar, SalaGuardada } from '../catalogoSalas.js';

const elemento = (name: string, extra: Record<string, string> = {}, id = 1) => ({ type: 'node', id, tags: { amenity: 'music_venue', name, 'addr:city': 'Madrid', ...extra } });

const existente = (o: Partial<SalaGuardada> & { clave: string; id: string }): SalaGuardada =>
  ({ place_id: null, nombre: 'X', ciudad: 'Madrid', region: null, direccion: null, tipo: 'sala', aforo: null, genero: null, website: null, instagram: null, email_contacto: null, telefono: null, nivel: 'sin_verificar', puntuacion: 0, verificada_en: null, bandas_con_respuesta: 0, bandas_con_entrega: 0, rebotes: 0, no_contactar: false, ...o }) as SalaGuardada;

function montar(salas: SalaGuardada[]) {
  const guardadas: SalaAGuardar[] = [];
  const puerto: PuertoImportacion = { leerSalas: vi.fn(async () => salas), guardarSalas: vi.fn(async (s) => void guardadas.push(...s)) };
  return { puerto, guardadas };
}

describe('importarSalasDeOsm', () => {
  it('añade las salas nuevas como sin verificar', async () => {
    const { puerto, guardadas } = montar([]);
    const r = await importarSalasDeOsm({ puerto, descargar: async () => [elemento('Sala Nueva', { website: 'https://nueva.es/' })] });
    expect(r).toMatchObject({ nuevas: 1, completadas: 0, salasEnOsm: 1 });
    expect(guardadas[0]).toMatchObject({ nombre: 'Sala Nueva', nivel: 'sin_verificar', bandas_con_entrega: 0 });
    expect(guardadas[0].id).toMatch(/^sala-/);
    expect(guardadas[0].fuentes).toEqual(['osm']);
  });

  it('cita OpenStreetMap solo en las salas a las que ha aportado algo, y conserva otras fuentes', async () => {
    const previa = existente({ id: 'sala-1', clave: 'nc:moby|madrid', nombre: 'Moby', nivel: 'probable', fuentes: ['leads'] });
    const { puerto, guardadas } = montar([previa]);
    await importarSalasDeOsm({ puerto, descargar: async () => [elemento('Moby', { capacity: '300' })] });
    expect(guardadas[0].fuentes).toEqual(['leads', 'osm']);
    const sinAporte = montar([existente({ id: 'sala-2', clave: 'nc:moby|madrid', nombre: 'Moby', nivel: 'probable', aforo: 300 })]);
    await importarSalasDeOsm({ puerto: sinAporte.puerto, descargar: async () => [elemento('Moby', { capacity: '300' })] });
    expect(sinAporte.guardadas).toEqual([]);
  });

  it('a una sala existente solo le rellena lo que le falta, sin pisar lo que tiene', async () => {
    const { puerto, guardadas } = montar([existente({ id: 'sala-1', clave: 'nc:moby|madrid', nombre: 'Moby', website: 'https://moby.es/', nivel: 'probable', puntuacion: 50 })]);
    const r = await importarSalasDeOsm({ puerto, descargar: async () => [elemento('Moby', { website: 'https://otra.es/', capacity: '300' })] });
    expect(r.completadas).toBe(1);
    expect(guardadas[0]).toMatchObject({ id: 'sala-1', website: 'https://moby.es/', aforo: 300, nivel: 'probable', puntuacion: 50 });
  });

  it('nunca toca una sala verificada', async () => {
    const { puerto, guardadas } = montar([existente({ id: 'sala-1', clave: 'nc:moby|madrid', nombre: 'Moby', nivel: 'verificada' })]);
    const r = await importarSalasDeOsm({ puerto, descargar: async () => [elemento('Moby', { capacity: '300' })] });
    expect(r.sinCambios).toBe(1);
    expect(guardadas).toEqual([]);
  });

  it('en simulación cuenta pero no escribe', async () => {
    const { puerto } = montar([]);
    const r = await importarSalasDeOsm({ puerto, simulacion: true, descargar: async () => [elemento('Sala Nueva')] });
    expect(r).toMatchObject({ simulacion: true, nuevas: 1 });
    expect(puerto.guardarSalas).not.toHaveBeenCalled();
  });

  it('repetirla no cambia nada', async () => {
    const { puerto, guardadas } = montar([existente({ id: 'sala-1', clave: 'nc:moby|madrid', nombre: 'Moby', aforo: 300 })]);
    const r = await importarSalasDeOsm({ puerto, descargar: async () => [elemento('Moby', { capacity: '300' })] });
    expect(r.sinCambios).toBe(1);
    expect(guardadas).toEqual([]);
  });
});

describe('crearDescargaOsm', () => {
  const respuesta = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });

  it('si el primer servidor falla, usa el siguiente', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } }))
      .mockResolvedValueOnce(respuesta({ elements: [elemento('Sala Nueva')] }));
    const r = await crearDescargaOsm(['https://uno.test/api', 'https://dos.test/api'], fetcher as unknown as typeof fetch)();
    expect(r).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('si fallan todos, el error dice cuál y por qué', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } }))
      .mockResolvedValueOnce(respuesta({}, 429));
    await expect(crearDescargaOsm(['https://uno.test/api', 'https://dos.test/api'], fetcher as unknown as typeof fetch)()).rejects.toThrow(/uno\.test: fetch failed \(ENOTFOUND\); dos\.test: respondió 429/);
  });
});
