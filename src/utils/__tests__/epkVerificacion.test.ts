import { describe, it, expect } from 'vitest';
import { camposNoGuardados } from '../epkVerificacion';

describe('camposNoGuardados', () => {
  it('no avisa cuando lo guardado coincide (el servidor puede añadir campos)', () => {
    const enviado = { biografia: 'Hola', enlacesRedes: { spotify: 'x' }, miembros: [{ id: 'a', nombre: 'Ana', rol: 'Voz' }] };
    const guardado = {
      biografia: 'Hola',
      enlacesRedes: { spotify: 'x', youtube: '' },
      miembros: [{ id: 'a', nombre: 'Ana', rol: 'Voz', bio: '', fotoUrl: '', foto_url: '' }]
    };
    expect(camposNoGuardados(enviado, guardado)).toEqual([]);
  });

  it('detecta una biografía y un nombre de miembro que no se guardaron (caso real del trigger)', () => {
    const enviado = { biografia: 'Nueva', miembros: [{ id: 'a', nombre: 'Ana2' }] };
    const guardado = { biografia: 'Vieja', miembros: [{ id: 'a', nombre: 'Ana' }] };
    expect(camposNoGuardados(enviado, guardado)).toEqual(['Biografía', 'Formación de la banda']);
  });

  it('un borrado intencional (vacío) cuenta como guardado si la BD devuelve vacío', () => {
    expect(camposNoGuardados({ bandasSimilares: [] }, { bandasSimilares: [] })).toEqual([]);
    expect(camposNoGuardados({ bandasSimilares: [] }, {})).toEqual([]);
    expect(camposNoGuardados({ bandasSimilares: [] }, { bandasSimilares: ['A'] })).toEqual(['Bandas similares']);
  });

  it('ignora campos que no se enviaron', () => {
    expect(camposNoGuardados({}, { biografia: 'x' })).toEqual([]);
  });
});
