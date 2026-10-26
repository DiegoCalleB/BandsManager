import { describe, it, expect } from 'vitest';
import { consultaGencat, fichasDeGencat, nombreLegible, type FilaGencat } from '../gencatSalas.js';

const fila = (o: Partial<FilaGencat> = {}): FilaGencat => ({
  nom: 'BIKINI BARCELONA', subtipus: 'Sales de concerts', titularitat: 'Privada', adre_a: 'Avinguda Diagonal, 547', codi_postal: '08029',
  municipi: 'Barcelona', latitud: '41.3896', longitud: '2.1346', ...o,
});

describe('fichasDeGencat', () => {
  it('convierte una sala de conciertos con dirección, punto y región', () => {
    const [f] = fichasDeGencat([fila()]);
    expect(f.campos).toMatchObject({ nombre: 'Bikini Barcelona', ciudad: 'Barcelona', region: 'Cataluña', direccion: 'Avinguda Diagonal, 547, 08029', tipo: 'sala', email_contacto: null, telefono: null });
    expect(f.punto).toEqual({ lat: 41.3896, lon: 2.1346 });
  });

  it('solo entran las «Sales de concerts»: ni polivalentes ni teatros', () => {
    expect(fichasDeGencat([fila({ subtipus: 'Sala polivalent', nom: 'Ateneu Manlleu' }), fila({ subtipus: 'Teatre', nom: 'Teatre Municipal' })])).toEqual([]);
  });

  it('respeta la privacidad: email solo de rol y teléfono solo fijo', () => {
    const [f] = fichasDeGencat([fila({ adre_a_electr_nica: 'info@bikini.cat', tel_fon: '933 220 800' }), fila({ nom: 'Otra', adre_a_electr_nica: 'maria.lopez@gmail.com', tel_fon: '600111222' })]);
    expect(f.campos).toMatchObject({ email_contacto: 'info@bikini.cat', telefono: '933220800' });
    const [, g] = fichasDeGencat([fila({}), fila({ nom: 'Otra', adre_a_electr_nica: 'maria.lopez@gmail.com', tel_fon: '600111222' })]);
    expect(g.campos).toMatchObject({ email_contacto: null, telefono: null });
  });

  it('descarta puntos fuera de España, nombres genéricos, sin municipio y recintos masivos', () => {
    expect(fichasDeGencat([fila({ latitud: '48.8', longitud: '2.3' })])[0].punto).toBeNull();
    expect(fichasDeGencat([fila({ nom: 'SALA' }), fila({ nom: 'SALA DE CONCERTS' }), fila({ municipi: '' }), fila({ nom: 'Palau Sant Jordi', municipi: 'Barcelona' })])).toEqual([]);
  });

  it('la web pasa por urlPublica y el aforo solo si es un entero razonable', () => {
    const [a, b] = fichasDeGencat([fila({ adre_a_web: 'http://www.salamandra.cat/', aforament_total: '299' }), fila({ nom: 'Dos', adre_a_web: 'javascript:alert(1)', aforament_total: 'NA' })]);
    expect(a.campos).toMatchObject({ website: 'http://www.salamandra.cat/', aforo: 299 });
    expect(b.campos).toMatchObject({ website: null, aforo: null });
  });
});

describe('nombreLegible', () => {
  it('pasa las mayúsculas a título, con los conectores en minúscula', () => {
    expect(nombreLegible('BIKINI BARCELONA')).toBe('Bikini Barcelona');
    expect(nombreLegible('23ROBADORS')).toBe('23Robadors');
    expect(nombreLegible('LA SONORA DE GRÀCIA')).toBe('La Sonora de Gràcia');
  });
  it('respeta los nombres que ya mezclan mayúsculas y minúsculas', () => {
    expect(nombreLegible('Sala Apolo')).toBe('Sala Apolo');
    expect(nombreLegible('Jazz Sí Club')).toBe('Jazz Sí Club');
  });
});

describe('consultaGencat', () => {
  it('pide solo las salas de conciertos del conjunto de la Generalitat', () => {
    const u = new URL(consultaGencat());
    expect(u.hostname).toBe('analisi.transparenciacatalunya.cat');
    expect(u.searchParams.get('$where')).toBe("subtipus = 'Sales de concerts'");
  });
});
