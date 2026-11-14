import { describe, expect, it } from 'vitest';
import { buscarWebsDeSalas, consultaDeFicha, type FichaSinWeb, type PuertoBusquedaWeb } from '../buscarWebsDeSalas.js';

const ficha = (id: string, nombre: string, ciudad: string | null): FichaSinWeb => ({ id, nombre, ciudad } as FichaSinWeb);

function puerto(fichas: FichaSinWeb[]) {
  const guardadas: [string, string | null][] = [];
  const p: PuertoBusquedaWeb = {
    fichasSinWeb: async () => fichas,
    guardarBusqueda: async (id, web) => void guardadas.push([id, web]),
  };
  return { p, guardadas };
}

describe('buscarWebsDeSalas', () => {
  it('guarda la web segura, anota las que no tienen y no anota las que fallaron', async () => {
    const { p, guardadas } = puerto([ficha('a', 'Sala Wagon', 'Madrid'), ficha('b', 'Sala Rock', 'Madrid'), ficha('c', 'Sala Caída', 'Madrid')]);
    const informe = await buscarWebsDeSalas({
      puerto: p,
      buscar: async (q) => {
        if (q.includes('Caída')) throw new Error('503');
        return [{ link: 'https://labwagon.com/', title: 'LabWagon Madrid' }, { link: 'https://salarock.com/', title: 'Madrid' }];
      },
    });
    expect(guardadas).toEqual([['a', 'https://labwagon.com/'], ['b', null]]);
    expect(informe).toMatchObject({ buscadas: 2, encontradas: 1, errores: 1 });
  });

  it('pone el nombre entre comillas y la ciudad detrás', () => {
    expect(consultaDeFicha({ nombre: 'Sala Wagon', ciudad: 'Madrid' })).toBe('"Sala Wagon" Madrid');
    expect(consultaDeFicha({ nombre: 'Azkena', ciudad: null })).toBe('"Azkena"');
  });
});
