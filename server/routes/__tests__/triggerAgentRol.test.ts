/** POST /trigger-agent: solo dirección (líder o admin) puede lanzar agentes desde una sesión. */
import { describe, expect, it } from 'vitest';
import { soloDireccionSalvoCron } from '../agentePermisos.js';

type Req = Parameters<typeof soloDireccionSalvoCron>[0];
type Res = Parameters<typeof soloDireccionSalvoCron>[1];

function ejecutar(user: { role: string } | undefined) {
  let code: number | undefined;
  let siguiente = false;
  const res = { status: (c: number) => ((code = c), res), json: () => res } as unknown as Res;
  soloDireccionSalvoCron({ user } as unknown as Req, res, () => { siguiente = true; });
  return { code, siguiente };
}

describe('POST /trigger-agent — rol', () => {
  it.each(['member', 'musician', 'viewer'])('un %s no puede lanzar agentes', (role) => {
    expect(ejecutar({ role })).toEqual({ code: 403, siguiente: false });
  });

  it.each(['leader', 'admin'])('un %s sí', (role) => {
    expect(ejecutar({ role })).toEqual({ code: undefined, siguiente: true });
  });

  it('el cron (sin usuario) sigue entrando', () => {
    expect(ejecutar(undefined)).toEqual({ code: undefined, siguiente: true });
  });
});
