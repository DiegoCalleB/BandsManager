import { describe, it, expect } from 'vitest';
import { elegirInstagram, usuariosDeInstagram } from '../instagramEnWeb.js';

const html = `<a href="https://www.instagram.com/p/ABC123/">post</a>
<a href="https://instagram.com/cervezas_sol">patrocinador</a>
<a href="https://www.instagram.com/salamoby.bilbao/">nosotros</a>
<a href="https://instagram.com/cervezas_sol/">otra vez</a>`;

describe('usuariosDeInstagram', () => {
  it('lista los perfiles enlazados, sin repetir y sin rutas que no son perfiles', () => {
    expect(usuariosDeInstagram(html)).toEqual(['cervezas_sol', 'salamoby.bilbao']);
  });
  it('sin enlaces, nada', () => expect(usuariosDeInstagram('<p>hola</p>')).toEqual([]));
});

describe('elegirInstagram', () => {
  const candidatos = usuariosDeInstagram(html);
  it('elige la cuenta que se parece a la sala, aunque no sea la primera', () => {
    expect(elegirInstagram(candidatos, 'Sala Moby Dick')).toBe('@salamoby.bilbao');
  });
  it('si ninguna se parece a la sala, no apunta ninguna', () => {
    expect(elegirInstagram(candidatos, 'Teatro Principal')).toBeUndefined();
  });
  it('sin nombre de sala conserva el comportamiento anterior: la primera', () => {
    expect(elegirInstagram(candidatos)).toBe('@cervezas_sol');
  });
});
