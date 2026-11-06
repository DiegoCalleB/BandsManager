import { describe, it, expect } from 'vitest';
import { afinidadDeGenero, ordenarPorAfinidad } from '../afinidadFestival';
import type { Lead } from '../../types';

const lead = (nombre_sala: string, genero: string): Lead => ({ id: nombre_sala, nombre_sala, genero }) as Lead;
const banda = ['Electro Balkan', 'Reggae', 'Ska'];

describe('afinidadDeGenero', () => {
  it('puntúa más un festival de reggae/ska que uno de metal', () => {
    const reggae = afinidadDeGenero(lead('Rototom', 'Reggae, Ska, Dub'), banda);
    const metal = afinidadDeGenero(lead('Resurrection', 'Metal, Hardcore'), banda);
    expect(reggae.puntos).toBeGreaterThan(metal.puntos);
    expect(metal.puntos).toBe(0);
  });

  it('da el motivo en una línea con los géneros que encajan', () => {
    expect(afinidadDeGenero(lead('X', 'Reggae, Ska'), banda).motivo).toBe('Reggae/Ska');
  });

  it('cuenta afines (world, fusión, dub, ska-punk) por debajo del género exacto', () => {
    const exacto = afinidadDeGenero(lead('A', 'Ska'), banda).puntos;
    const afin = afinidadDeGenero(lead('B', 'World music'), banda).puntos;
    expect(afin).toBeGreaterThan(0);
    expect(afin).toBeLessThan(exacto);
  });

  it('un festival multigénero o sin género va después, no se descarta', () => {
    const r = afinidadDeGenero(lead('M', 'Multigénero'), banda);
    expect(r.puntos).toBeGreaterThan(0);
    expect(afinidadDeGenero(lead('N', ''), banda).puntos).toBe(0);
  });

  it('usa el género de la banda, no valores fijos', () => {
    expect(afinidadDeGenero(lead('R', 'Reggae'), ['Metal']).puntos).toBe(0);
  });
});

describe('ordenarPorAfinidad', () => {
  it('ordena de mayor a menor y mantiene el orden original en empates', () => {
    const lista = [lead('metal', 'Metal'), lead('ska', 'Ska'), lead('multi', 'Multigénero'), lead('reggae', 'Reggae')];
    expect(ordenarPorAfinidad(lista, banda).map((l) => l.id)).toEqual(['ska', 'reggae', 'multi', 'metal']);
  });
});
