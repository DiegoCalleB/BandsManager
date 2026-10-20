import { describe, it, expect, vi } from 'vitest';
import { crearDescargaOsm, importarSalasDeOsm, type PuertoImportacion } from '../importarSalasOsm.js';
import type { AliasSala, FilaCoordenadas, SalaAGuardar, SalaGuardada } from '../catalogoSalas.js';

const elemento = (name: string, extra: Record<string, string> = {}, id = 1) => ({ type: 'node', id, tags: { amenity: 'music_venue', name, 'addr:city': 'Madrid', ...extra } });

const existente = (o: Partial<SalaGuardada> & { clave: string; id: string }): SalaGuardada =>
  ({ place_id: null, nombre: 'X', ciudad: 'Madrid', region: null, direccion: null, tipo: 'sala', aforo: null, genero: null, website: null, instagram: null, email_contacto: null, telefono: null, nivel: 'sin_verificar', puntuacion: 0, verificada_en: null, bandas_con_respuesta: 0, bandas_con_entrega: 0, rebotes: 0, no_contactar: false, ...o }) as SalaGuardada;

function montar(salas: SalaGuardada[], alias: AliasSala[] = []) {
  const guardadas: SalaAGuardar[] = [];
  const coordenadas: FilaCoordenadas[] = [];
  const puerto: PuertoImportacion = { leerAlias: vi.fn(async () => alias), leerSalas: vi.fn(async () => salas), guardarSalas: vi.fn(async (s) => void guardadas.push(...s)), guardarCoordenadas: vi.fn(async (f) => void coordenadas.push(...f)) };
  return { puerto, guardadas, coordenadas };
}

describe('importarSalasDeOsm: coordenadas', () => {
  const conPunto = (name: string, lat: number, lon: number) => ({ ...elemento(name), lat, lon });

  it('guarda el punto de OSM de las salas nuevas, después de crearlas', async () => {
    const { puerto, coordenadas } = montar([]);
    const r = await importarSalasDeOsm({ puerto, descargar: async () => [conPunto('Sala Nueva', 40.4, -3.7)] });
    expect(r.conCoordenadas).toBe(1);
    expect(coordenadas[0]).toMatchObject({ lat: 40.4, lon: -3.7, aprox: false });
    expect(coordenadas[0].salaId).toMatch(/^sala-/);
  });

  it('también sitúa las ya existentes sin punto, incluso las verificadas, y reemplaza un punto aproximado', async () => {
    const { puerto, coordenadas } = montar([
      existente({ id: 'sala-1', clave: 'nc:moby|madrid', nombre: 'Moby', nivel: 'verificada' }),
      existente({ id: 'sala-2', clave: 'nc:sol|madrid', nombre: 'Sol', lat: 40, lon: -3, coordenadas_aprox: true }),
    ]);
    await importarSalasDeOsm({ puerto, descargar: async () => [conPunto('Moby', 40.4, -3.7), conPunto('Sol', 40.41, -3.71)] });
    expect(coordenadas.map((c) => c.salaId).sort()).toEqual(['sala-1', 'sala-2']);
  });

  it('no pisa un punto exacto que la sala ya tiene', async () => {
    const { puerto, coordenadas } = montar([existente({ id: 'sala-1', clave: 'nc:moby|madrid', nombre: 'Moby', lat: 40, lon: -3, coordenadas_aprox: false })]);
    await importarSalasDeOsm({ puerto, descargar: async () => [conPunto('Moby', 40.4, -3.7)] });
    expect(coordenadas).toEqual([]);
  });

  it('en simulación no escribe coordenadas', async () => {
    const { puerto, coordenadas } = montar([]);
    const r = await importarSalasDeOsm({ puerto, descargar: async () => [conPunto('Sala Nueva', 40.4, -3.7)], simulacion: true });
    expect(r.conCoordenadas).toBe(1);
    expect(coordenadas).toEqual([]);
  });
});

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

describe('importarSalasDeOsm con alias', () => {
  it('una sala de OSM con alias completa la canónica y no crea una fila nueva', async () => {
    const canonica = existente({ id: 'sala-c', clave: 'nc:nazca club|madrid', nombre: 'Nazca Club', nivel: 'probable' });
    const { puerto, guardadas } = montar([canonica], [{ aliasClave: 'nc:sala nazca|madrid', clave: 'nc:nazca club|madrid', nombre: 'Nazca Club' }]);
    const r = await importarSalasDeOsm({ puerto, descargar: async () => [elemento('Sala Nazca', { capacity: '500' })] });
    expect(r).toMatchObject({ nuevas: 0, completadas: 1 });
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]).toMatchObject({ id: 'sala-c', aforo: 500 });
  });
  it('dos nombres de OSM con alias a la misma clave entran como una sola sala', async () => {
    const alias = [{ aliasClave: 'nc:sala nazca|madrid', clave: 'nc:nazca club|madrid', nombre: null }, { aliasClave: 'nc:nazca|madrid', clave: 'nc:nazca club|madrid', nombre: null }];
    const { puerto, guardadas } = montar([], alias);
    await importarSalasDeOsm({ puerto, descargar: async () => [elemento('Sala Nazca', {}, 1), elemento('Nazca', {}, 2)] });
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0].clave).toBe('nc:nazca club|madrid');
  });
});

describe('crearDescargaOsm', () => {
  const respuesta = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });
  const servidores = ['https://uno.test/api', 'https://dos.test/api'];
  const opciones = { regiones: ['ES-MD', 'ES-GA'], pausaMs: 0 };
  const consulta = (llamada: unknown[]) => decodeURIComponent(String((llamada[1] as { body: string }).body));

  it('pide cada comunidad por separado, con su código ISO, y junta los resultados', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(respuesta({ elements: [elemento('Sala Madrid', {}, 1)] }))
      .mockResolvedValueOnce(respuesta({ elements: [elemento('Sala Vigo', {}, 2)] }));
    const r = await crearDescargaOsm(servidores, fetcher as unknown as typeof fetch, 1000, opciones)();
    expect(r).toHaveLength(2);
    expect(consulta(fetcher.mock.calls[0])).toContain('"ISO3166-2"="ES-MD"');
    expect(consulta(fetcher.mock.calls[1])).toContain('"ISO3166-2"="ES-GA"');
    expect(consulta(fetcher.mock.calls[0])).not.toContain('ES-GA');
  });

  it('un elemento que llega en dos comunidades cuenta una sola vez', async () => {
    const fetcher = vi.fn().mockImplementation(async () => respuesta({ elements: [elemento('Sala Frontera', {}, 7)] }));
    expect(await crearDescargaOsm(servidores, fetcher as unknown as typeof fetch, 1000, opciones)()).toHaveLength(1);
  });

  it('si el primer servidor falla, usa el siguiente para esa comunidad', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } }))
      .mockResolvedValueOnce(respuesta({ elements: [elemento('Sala Nueva')] }));
    const r = await crearDescargaOsm(servidores, fetcher as unknown as typeof fetch, 1000, { regiones: ['ES-MD'], pausaMs: 0 })();
    expect(r).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('si una comunidad falla en todos los servidores, importa las demás y avisa de cuál faltó', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(respuesta({}, 502))
      .mockResolvedValueOnce(respuesta({}, 500))
      .mockResolvedValueOnce(respuesta({ elements: [elemento('Sala Vigo', {}, 2)] }));
    const alFallarRegion = vi.fn();
    const r = await crearDescargaOsm(servidores, fetcher as unknown as typeof fetch, 1000, { ...opciones, alFallarRegion })();
    expect(r).toHaveLength(1);
    expect(alFallarRegion).toHaveBeenCalledWith('ES-MD', 'uno.test: respondió 502; dos.test: respondió 500');
  });

  it('si no llega ninguna comunidad, falla y dice cuál servidor dio qué', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } }))
      .mockResolvedValue(respuesta({}, 429));
    await expect(crearDescargaOsm(servidores, fetcher as unknown as typeof fetch, 1000, { regiones: ['ES-MD'], pausaMs: 0 })()).rejects.toThrow(/ES-MD \(uno\.test: fetch failed \(ENOTFOUND\); dos\.test: respondió 429\)/);
  });

  it('por defecto recorre las 19 comunidades y ciudades autónomas', async () => {
    const { REGIONES_OSM } = await import('../../utils/osmSalas.js');
    expect(REGIONES_OSM).toHaveLength(19);
    expect(new Set(REGIONES_OSM).size).toBe(19);
    for (const c of REGIONES_OSM) expect(c).toMatch(/^ES-[A-Z]{2}$/);
  });
});
