import { describe, it, expect, vi } from 'vitest';
import { importarDeFuente, type PuertoFuente } from '../importarDeFuente.js';
import type { FilaCoordenadas, SalaAGuardar, SalaGuardada } from '../catalogoSalas.js';
import type { CamposPublicosSala } from '../../utils/salaCatalogo.js';

const campos = (nombre: string, extra: Partial<CamposPublicosSala> = {}): CamposPublicosSala => ({
  clave: `nc:${nombre.toLowerCase()}|madrid`, place_id: null, nombre, ciudad: 'Madrid', region: null, direccion: null, tipo: 'sala',
  aforo: null, genero: null, website: null, instagram: null, email_contacto: null, telefono: null, ...extra,
});
const existente = (o: Partial<SalaGuardada> & { clave: string; id: string }): SalaGuardada =>
  ({ ...campos('X'), nivel: 'sin_verificar', puntuacion: 0, verificada_en: null, bandas_con_respuesta: 0, bandas_con_entrega: 0, rebotes: 0, no_contactar: false, ...o }) as SalaGuardada;

function montar(salas: SalaGuardada[] = [], alias: Array<{ aliasClave: string; clave: string; nombre: string | null }> = []) {
  const guardadas: SalaAGuardar[] = [];
  const coordenadas: FilaCoordenadas[] = [];
  const puerto: PuertoFuente = { leerSalas: vi.fn(async () => salas), leerAlias: vi.fn(async () => alias), guardarSalas: vi.fn(async (s) => void guardadas.push(...s)), guardarCoordenadas: vi.fn(async (f) => void coordenadas.push(...f)) };
  return { puerto, guardadas, coordenadas };
}

describe('importarDeFuente', () => {
  it('añade las nuevas sin verificar, con su fuente y su punto, y da ejemplos', async () => {
    const { puerto, guardadas, coordenadas } = montar();
    const r = await importarDeFuente({ puerto, fuente: 'wikidata', fichas: [{ campos: campos('Moby', { website: 'https://moby.es/' }), punto: { lat: 40.4, lon: -3.7 } }] });
    expect(r).toMatchObject({ nuevas: 1, conCoordenadas: 1, ejemplos: ['Moby (Madrid)'] });
    expect(guardadas[0]).toMatchObject({ nombre: 'Moby', nivel: 'sin_verificar', fuentes: ['wikidata'] });
    expect(coordenadas[0]).toMatchObject({ salaId: guardadas[0].id, aprox: false });
  });

  it('a una existente solo le rellena huecos y añade la fuente; una verificada no se toca', async () => {
    const { puerto, guardadas } = montar([
      existente({ id: 's1', clave: 'nc:moby|madrid', nombre: 'Moby', website: 'https://mia.es/', fuentes: ['osm'] }),
      existente({ id: 's2', clave: 'nc:sol|madrid', nombre: 'Sol', nivel: 'verificada' }),
    ]);
    const r = await importarDeFuente({ puerto, fuente: 'wikidata', fichas: [{ campos: campos('Moby', { website: 'https://otra.es/', aforo: 300 }) }, { campos: campos('Sol', { aforo: 500 }) }] });
    expect(r).toMatchObject({ completadas: 1, sinCambios: 1 });
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]).toMatchObject({ id: 's1', website: 'https://mia.es/', aforo: 300, fuentes: ['osm', 'wikidata'] });
  });

  it('respeta los alias (no crea un duplicado de una sala fusionada)', async () => {
    const { puerto, guardadas } = montar([existente({ id: 's1', clave: 'nc:moby dick|madrid', nombre: 'Moby Dick' })], [{ aliasClave: 'nc:moby|madrid', clave: 'nc:moby dick|madrid', nombre: null }]);
    const r = await importarDeFuente({ puerto, fuente: 'wikidata', fichas: [{ campos: campos('Moby', { aforo: 300 }) }] });
    expect(r.nuevas).toBe(0);
    expect(guardadas[0]).toMatchObject({ id: 's1', aforo: 300 });
  });

  it('no pisa un punto exacto que ya existe; en simulación no escribe nada', async () => {
    const { puerto, guardadas, coordenadas } = montar([existente({ id: 's1', clave: 'nc:moby|madrid', nombre: 'Moby', lat: 40, lon: -3, coordenadas_aprox: false })]);
    await importarDeFuente({ puerto, fuente: 'wikidata', fichas: [{ campos: campos('Moby'), punto: { lat: 41, lon: -4 } }] });
    expect(coordenadas).toEqual([]);
    const otro = montar();
    const r = await importarDeFuente({ puerto: otro.puerto, fuente: 'wikidata', simulacion: true, fichas: [{ campos: campos('Nueva'), punto: { lat: 40.4, lon: -3.7 } }] });
    expect(r.nuevas).toBe(1);
    expect(otro.guardadas).toEqual([]);
    expect(otro.coordenadas).toEqual([]);
    expect(guardadas).toEqual([]);
  });
});
