import { describe, it, expect, vi } from 'vitest';
import { geolocalizarSalas, type PuertoGeolocalizacion } from '../geolocalizarSalas.js';
import type { SalaGuardada } from '../catalogoSalas.js';

const sala = (id: string, nombre: string, ciudad: string | null = 'Madrid'): SalaGuardada => ({ id, nombre, ciudad, region: 'Comunidad de Madrid' }) as SalaGuardada;
const local = (ciudad: string, lat = '40.41', lon = '-3.70') => [{ lat, lon, class: 'amenity', display_name: `Local, ${ciudad}, España` }];
const lugar = (lat = '40.4', lon = '-3.7') => [{ lat, lon, class: 'boundary', display_name: 'Madrid, España' }];

function montar(salas: SalaGuardada[]) {
  const guardados: Array<[string, unknown]> = [];
  const puerto: PuertoGeolocalizacion = { salasSinCoordenadas: vi.fn(async () => salas), guardarPunto: vi.fn(async (id, p) => void guardados.push([id, p])) };
  return { puerto, guardados };
}

describe('geolocalizarSalas', () => {
  it('guarda el punto exacto del local cuando el geocodificador lo encuentra', async () => {
    const { puerto, guardados } = montar([sala('a', 'Moby')]);
    const r = await geolocalizarSalas({ puerto, buscar: async () => local('Madrid'), pausaMs: 0 });
    expect(r).toMatchObject({ revisadas: 1, exactas: 1, deLaCiudad: 0 });
    expect(guardados[0]).toEqual(['a', { lat: 40.41, lon: -3.7, aprox: false }]);
  });

  it('si no encuentra el local usa el punto de la ciudad y lo marca como aproximado', async () => {
    const { puerto, guardados } = montar([sala('a', 'Moby')]);
    const buscar = vi.fn(async (url: string) => (new URL(url).searchParams.get('q')?.startsWith('Moby') ? [] : lugar()));
    const r = await geolocalizarSalas({ puerto, buscar, pausaMs: 0 });
    expect(r).toMatchObject({ exactas: 0, deLaCiudad: 1 });
    expect(guardados[0]).toEqual(['a', { lat: 40.4, lon: -3.7, aprox: true }]);
  });

  it('pide una sola vez el punto de cada ciudad por pasada', async () => {
    const { puerto } = montar([sala('a', 'Moby'), sala('b', 'Sol'), sala('c', 'Fridas')]);
    const buscar = vi.fn(async (url: string) => (new URL(url).searchParams.get('q') === 'Madrid, Comunidad de Madrid, España' ? lugar() : []));
    await geolocalizarSalas({ puerto, buscar, pausaMs: 0 });
    const consultasDeCiudad = buscar.mock.calls.filter(([u]) => new URL(u).searchParams.get('q') === 'Madrid, Comunidad de Madrid, España');
    expect(consultasDeCiudad).toHaveLength(1);
  });

  it('una sala que nadie sabe situar se anota para no repetirla cada día', async () => {
    const { puerto, guardados } = montar([sala('a', 'Moby')]);
    const r = await geolocalizarSalas({ puerto, buscar: async () => [], pausaMs: 0 });
    expect(r.sinPunto).toBe(1);
    expect(guardados[0]).toEqual(['a', null]);
  });

  it('un error de red no anota el intento y no frena a las demás', async () => {
    const { puerto, guardados } = montar([sala('a', 'Moby'), sala('b', 'Sol')]);
    let n = 0;
    const buscar = async () => {
      if (n++ === 0) throw new Error('red caída');
      return local('Madrid');
    };
    const r = await geolocalizarSalas({ puerto, buscar, pausaMs: 0 });
    expect(r).toMatchObject({ errores: 1, exactas: 1 });
    expect(guardados.map(([id]) => id)).toEqual(['b']);
  });

  it('respeta el ritmo de una consulta por segundo', async () => {
    vi.useFakeTimers();
    const { puerto } = montar([sala('a', 'Moby'), sala('b', 'Sol')]);
    const buscar = vi.fn(async () => local('Madrid'));
    const p = geolocalizarSalas({ puerto, buscar });
    await vi.advanceTimersByTimeAsync(0);
    expect(buscar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1100);
    await p;
    expect(buscar).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
