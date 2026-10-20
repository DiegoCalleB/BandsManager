// En producción `musicians_waitlist` exige nombre_banda y nombre_contacto (NOT NULL, sin valor por
// defecto). Un INSERT que no los mande falla con 500: así dejó de funcionar el alta de la landing.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertados: any[] = [];
vi.mock('../core.js', async (orig) => ({
  ...(await orig<any>()),
  getSupabase: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }),
      insert: (fila: any) => {
        insertados.push(fila);
        return { select: () => ({ single: async () => ({ data: { id: fila.id, email: fila.email, idioma: fila.idioma, confirmado_at: null, baja_at: null }, error: null }) }), error: null, then: (r: any) => r({ error: null }) };
      },
    }),
  }),
}));

import { dbAltaContactoEmpresa, dbAltaInteresado } from '../interesados.js';

const OBLIGATORIAS = ['id', 'nombre_banda', 'nombre_contacto', 'email'];

describe('INSERT en musicians_waitlist: columnas NOT NULL de producción', () => {
  beforeEach(() => (insertados.length = 0));

  it('el alta de la lista de novedades manda todas las columnas obligatorias', async () => {
    await dbAltaInteresado('ana@x.com', 'es', 'landing');
    for (const c of OBLIGATORIAS) expect(typeof insertados[0][c], c).toBe('string');
  });

  it('la consulta B2B manda todas las columnas obligatorias', async () => {
    await dbAltaContactoEmpresa({ empresa: 'Agencia Norte', email: 'a@x.com', tipo: 'agencia', mensaje: '', idioma: 'es' });
    for (const c of OBLIGATORIAS) expect(typeof insertados[0][c], c).toBe('string');
    expect(insertados[0]).toMatchObject({ nombre_banda: 'Agencia Norte', origen: 'b2b' });
  });
});
