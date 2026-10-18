import { describe, it, expect } from 'vitest';
import { camposDesdeCatalogo } from '../camposDesdeCatalogo.js';
import type { SalaGuardada } from '../../services/catalogoSalas.js';

const sala = (o: Partial<SalaGuardada> = {}): SalaGuardada => ({
  id: 'sala-1',
  clave: 'nc:alfa|madrid',
  place_id: 'ChIJabc',
  nombre: 'Alfa',
  ciudad: 'Madrid',
  region: 'Comunidad de Madrid',
  direccion: 'Calle Falsa 1',
  tipo: 'sala',
  aforo: 300,
  genero: 'Rock',
  website: 'https://alfa.es/',
  instagram: 'alfasala',
  email_contacto: 'booking@alfa.es',
  telefono: '910000000',
  nivel: 'probable',
  puntuacion: 50,
  verificada_en: null,
  bandas_con_respuesta: 1,
  bandas_con_entrega: 1,
  rebotes: 0,
  no_contactar: false,
  ...o,
});

describe('camposDesdeCatalogo', () => {
  it('completa un lead vacío con lo que el catálogo conoce', () => {
    expect(camposDesdeCatalogo({ nombre_sala: 'Alfa', ciudad: 'Madrid' }, sala())).toEqual({
      place_id: 'ChIJabc',
      direccion: 'Calle Falsa 1',
      region: 'Comunidad de Madrid',
      telefono: '910000000',
      website: 'https://alfa.es/',
      email_contacto: 'booking@alfa.es',
      instagram: 'alfasala',
      genero: 'Rock',
      aforo: 300,
    });
  });

  it('nunca pisa lo que la banda ya tiene', () => {
    const lead = { email_contacto: 'mio@alfa.es', website: 'https://mia.es', aforo: 120, genero: 'Ska', telefono: '600000000', direccion: 'Mi calle' };
    expect(camposDesdeCatalogo(lead, sala())).toEqual({ place_id: 'ChIJabc', region: 'Comunidad de Madrid', instagram: 'alfasala' });
  });

  it('un teléfono en cualquiera de los tres campos del lead basta para no añadir otro', () => {
    expect(camposDesdeCatalogo({ telefono_fijo: '910111111' }, sala())).not.toHaveProperty('telefono');
    expect(camposDesdeCatalogo({ telefono_movil: '600111111' }, sala())).not.toHaveProperty('telefono');
  });

  it('solo aporta lo que la sala tiene', () => {
    expect(camposDesdeCatalogo({}, sala({ place_id: null, email_contacto: null, telefono: null, aforo: null, website: null, instagram: null, direccion: null, region: null, genero: null }))).toEqual({});
  });

  it('una sala «no contactar» o inexistente no aporta nada', () => {
    expect(camposDesdeCatalogo({}, sala({ no_contactar: true }))).toEqual({});
    expect(camposDesdeCatalogo({}, null)).toEqual({});
    expect(camposDesdeCatalogo({}, undefined)).toEqual({});
  });
});
