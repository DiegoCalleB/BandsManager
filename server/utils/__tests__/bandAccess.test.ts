import { describe, it, expect } from 'vitest';
import { getTargetBandId, puedeEscribirEnBanda, bandaSolicitada } from '../bandAccess';

// Petición mínima con la forma que leen los helpers.
const peticion = (opciones: {
  user?: any;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
} = {}) => ({
  user: opciones.user,
  headers: opciones.headers || {},
  query: opciones.query || {},
  body: opciones.body || {},
}) as any;

const miembroDeBakandeya = {
  role: 'leader',
  band_id: 'band-bakandeya',
  allowedBandIds: ['band-bakandeya', 'bakandeya', 'reg-bakandeya'],
};

describe('getTargetBandId', () => {
  it('usa la banda del usuario si no se pide otra', () => {
    expect(getTargetBandId(peticion({ user: miembroDeBakandeya }))).toBe('band-bakandeya');
  });

  it('acepta una banda pedida a la que el usuario pertenece', () => {
    const req = peticion({ user: miembroDeBakandeya, headers: { 'x-band-id': 'band-bakandeya' } });
    expect(getTargetBandId(req)).toBe('band-bakandeya');
  });

  it('IGNORA una banda ajena y cae a la propia', () => {
    // El fallo que cierra esto: rutas que leían req.body.bandId a pelo y operaban sobre él.
    for (const req of [
      peticion({ user: miembroDeBakandeya, headers: { 'x-band-id': 'band-la-vanda' } }),
      peticion({ user: miembroDeBakandeya, query: { bandId: 'band-la-vanda' } }),
      peticion({ user: miembroDeBakandeya, body: { bandId: 'band-la-vanda' } }),
      peticion({ user: miembroDeBakandeya, headers: { 'x-active-band-id': 'reg-otra' } }),
    ]) {
      expect(getTargetBandId(req)).toBe('band-bakandeya');
    }
  });

  it('un admin sí puede apuntar a cualquier banda', () => {
    const admin = { role: 'admin', band_id: 'band-bakandeya', allowedBandIds: ['band-bakandeya'] };
    const req = peticion({ user: admin, headers: { 'x-band-id': 'band-la-vanda' } });
    expect(getTargetBandId(req)).toBe('band-la-vanda');
  });

  it('el rol "leader" por sí solo NO abre otras bandas', () => {
    // Era el escape que había: `|| role === 'leader'`, y en esta app todos son leader.
    const req = peticion({ user: { ...miembroDeBakandeya, role: 'leader' }, body: { bandId: 'band-otra' } });
    expect(getTargetBandId(req)).toBe('band-bakandeya');
  });

  it('tolera prefijos band-/reg- y espacios', () => {
    const req = peticion({ user: miembroDeBakandeya, headers: { 'x-band-id': '  reg-bakandeya  ' } });
    expect(getTargetBandId(req)).toBe('reg-bakandeya');
  });

  it('sin usuario cae al valor por defecto', () => {
    expect(getTargetBandId(peticion({ headers: { 'x-band-id': 'band-la-vanda' } }))).toBe('band-bakandeya');
  });
});

describe('bandaSolicitada', () => {
  it('distingue "no piden banda" de "piden una concreta"', () => {
    expect(bandaSolicitada(peticion({ user: miembroDeBakandeya }))).toBeUndefined();
    expect(bandaSolicitada(peticion({ user: miembroDeBakandeya, headers: { 'x-band-id': '   ' } }))).toBeUndefined();
    expect(bandaSolicitada(peticion({ user: miembroDeBakandeya, body: { bandId: 'band-la-vanda' } }))).toBe('band-la-vanda');
  });
});

describe('puedeEscribirEnBanda', () => {
  it('deja escribir en la banda propia, en cualquier variante de prefijo', () => {
    const req = peticion({ user: miembroDeBakandeya });
    expect(puedeEscribirEnBanda(req, 'band-bakandeya')).toBe(true);
    expect(puedeEscribirEnBanda(req, 'bakandeya')).toBe(true);
    expect(puedeEscribirEnBanda(req, 'reg-bakandeya')).toBe(true);
  });

  it('NO deja escribir en una banda ajena, ni siendo leader', () => {
    const req = peticion({ user: miembroDeBakandeya });
    expect(puedeEscribirEnBanda(req, 'band-la-vanda')).toBe(false);
    expect(puedeEscribirEnBanda(req, 'la-vanda')).toBe(false);
  });

  it('el admin sí puede', () => {
    const req = peticion({ user: { role: 'admin', band_id: 'band-x', allowedBandIds: [] } });
    expect(puedeEscribirEnBanda(req, 'band-la-vanda')).toBe(true);
  });

  it('sin usuario, no', () => {
    expect(puedeEscribirEnBanda(peticion(), 'band-bakandeya')).toBe(false);
  });
});
