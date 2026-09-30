import { describe, it, expect } from 'vitest';
import {
  getTargetBandId,
  puedeEscribirEnBanda,
  bandaSolicitada,
  mismaBanda,
  bandaFacturableDelUsuario,
  bandaDelAgente,
} from '../bandAccess';

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

  it('sin usuario, falla en vez de caer en la banda insignia', () => {
    // Antes devolvía "band-bakandeya" en silencio. Todos los llamadores están detrás de
    // requireAuth, así que llegar aquí sin usuario es un bug del llamador, no un caso a tolerar.
    expect(() => getTargetBandId(peticion({ headers: { 'x-band-id': 'band-la-vanda' } }))).toThrow();
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

describe('bandaDelAgente', () => {
  it('sin params, la banda del usuario', () => {
    expect(bandaDelAgente(peticion({ user: miembroDeBakandeya }), undefined)).toBe('band-bakandeya');
  });

  it('FALLA (null) si params pide una banda ajena', () => {
    // El caso feo: con esto se lanzaba el Enviador de otra banda, que despacha sus correos
    // aprobados desde su propia cuenta de SMTP.
    const req = peticion({ user: miembroDeBakandeya });
    expect(bandaDelAgente(req, { band_id: 'band-la-vanda' })).toBeNull();
  });

  it('acepta la banda propia pedida por params', () => {
    const req = peticion({ user: miembroDeBakandeya });
    expect(bandaDelAgente(req, { band_id: ' reg-bakandeya ' })).toBe('reg-bakandeya');
  });

  it('sin usuario (llamada de cron) manda el params.band_id', () => {
    // requireCronOrAuth deja pasar al planificador sin sesión: ahí el band_id es de fiar porque
    // la cabecera X-Cron-Secret ya se ha validado antes de llegar aquí.
    expect(bandaDelAgente(peticion(), { band_id: 'band-la-vanda' })).toBe('band-la-vanda');
  });

  it('sin usuario y sin params.band_id, falla en vez de caer en la banda insignia', () => {
    // Antes devolvía "band-bakandeya" en silencio: un job del planificador que se olvidara de
    // mandar el band_id acababa disparando el agente sobre la banda insignia sin avisar.
    expect(bandaDelAgente(peticion(), {})).toBeNull();
  });

  it('un band_id que no es texto se ignora', () => {
    const req = peticion({ user: miembroDeBakandeya });
    expect(bandaDelAgente(req, { band_id: { $ne: null } })).toBe('band-bakandeya');
  });
});

describe('mismaBanda', () => {
  it('ignora prefijos, mayúsculas y espacios', () => {
    expect(mismaBanda('band-bakandeya', 'reg-BAKANDEYA')).toBe(true);
    expect(mismaBanda( '  bakandeya ', 'band-bakandeya')).toBe(true);
  });

  it('dos bandas distintas no son la misma', () => {
    expect(mismaBanda('band-bakandeya', 'band-la-vanda')).toBe(false);
  });

  it('lo vacío no coincide con nada, ni consigo mismo', () => {
    // Importa: se usa para comparar el bandId de una sesión de Stripe, y una sesión sin banda
    // no puede colar como "sí, es la tuya".
    expect(mismaBanda('', '')).toBe(false);
    expect(mismaBanda(undefined, 'band-bakandeya')).toBe(false);
    expect(mismaBanda('band-bakandeya', undefined)).toBe(false);
  });
});

describe('bandaFacturableDelUsuario', () => {
  const conEmail = { ...miembroDeBakandeya, email: 'bakandeya@ejemplo.com' };

  it('sin banda pedida, factura a la banda del usuario', () => {
    expect(bandaFacturableDelUsuario(peticion({ user: conEmail }))).toEqual({
      bandId: 'band-bakandeya',
      email: 'bakandeya@ejemplo.com',
    });
  });

  it('FALLA (null) si se pide una banda ajena, en vez de degradar a la propia', () => {
    // A diferencia de getTargetBandId: cobrar o cancelar en la banda equivocada no se arregla
    // solo, así que la ruta tiene que responder 403.
    for (const req of [
      peticion({ user: conEmail, body: { bandId: 'band-la-vanda' } }),
      peticion({ user: conEmail, query: { bandId: 'band-la-vanda' } }),
      peticion({ user: conEmail, headers: { 'x-band-id': 'band-la-vanda' } }),
    ]) {
      expect(bandaFacturableDelUsuario(req)).toBeNull();
    }
  });

  it('acepta una banda pedida que sí es suya', () => {
    const req = peticion({ user: conEmail, body: { bandId: 'reg-bakandeya' } });
    expect(bandaFacturableDelUsuario(req)?.bandId).toBe('reg-bakandeya');
  });

  it('IGNORA el email del body: el de la sesión es el único que cuenta', () => {
    // Era la vía de entrada: la búsqueda de banda en facturación cae también por email, así que
    // mandar el de otra persona acababa operando sobre SU suscripción.
    const req = peticion({ user: conEmail, body: { userEmail: 'victima@ejemplo.com' } });
    expect(bandaFacturableDelUsuario(req)?.email).toBe('bakandeya@ejemplo.com');
  });

  it('no devuelve email si el de la sesión no es un email de verdad', () => {
    const req = peticion({ user: { ...miembroDeBakandeya, username: 'diego' } });
    expect(bandaFacturableDelUsuario(req)).toEqual({ bandId: 'band-bakandeya', email: undefined });
  });

  it('sin usuario o sin banda, null', () => {
    expect(bandaFacturableDelUsuario(peticion())).toBeNull();
    expect(bandaFacturableDelUsuario(peticion({ user: { role: 'member', allowedBandIds: [] } }))).toBeNull();
  });
});
