/**
 * OAuth de Instagram por banda. Invariantes:
 *  · sin la app de Meta configurada no se arranca el flujo (503), no se inventa una URL;
 *  · el callback solo vale con `state` firmado Y la cookie de nonce del mismo navegador, un solo uso;
 *  · un `state` de otro flujo (Gmail) no vale aquí aunque comparta secreto;
 *  · la banda sale del `state`, nunca de la query, y el token que se guarda es el de LARGA duración;
 *  · cancelar el permiso o no tener cuenta Business vuelve con un motivo claro y no guarda nada.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const servicio = vi.hoisted(() => ({
  verificarTokenInstagram: vi.fn(),
  guardarConexionInstagram: vi.fn(),
}));
vi.mock('../../services/instagramConexion.js', async (orig) => ({ ...(await orig<any>()), ...servicio }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => ({}), saveState: () => {} }));

import instagramOAuthRouter from '../instagramOAuth';
import { crearEstadoOAuth } from '../../utils/oauthEstado';

const ENTORNO = ['CRON_SECRET', 'META_APP_ID', 'META_APP_SECRET', 'META_OAUTH_REDIRECT_URI'] as const;
const original: Record<string, string | undefined> = {};
const REDIRECT = 'https://bandmanager.io/api/instagram-oauth/callback';

const manejador = (ruta: string) => {
  const pila = (instagramOAuthRouter as any).stack.find((s: any) => s.route?.path === ruta).route.stack;
  return pila[pila.length - 1].handle;
};
const authorizeUrl = manejador('/authorize-url');
const callback = manejador('/callback');

const resFalso = () => {
  const r: any = { cookies: {} };
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  r.cookie = (n: string, v: string) => ((r.cookies[n] = v), r);
  r.clearCookie = () => r;
  r.redirect = (u: string) => ((r.destino = u), r);
  return r;
};
const reqAuth = (bandId = 'band-a') => ({ user: { band_id: bandId, allowedBandIds: [bandId], role: 'leader' }, headers: { host: 'bandmanager.io' }, query: {} });

/** Arranca el flujo y devuelve el state y el nonce que el navegador llevaría de vuelta. */
function iniciar(bandId = 'band-a') {
  const res = resFalso();
  authorizeUrl(reqAuth(bandId), res);
  const url = new URL(res.body.url);
  return { res, url, state: url.searchParams.get('state')!, nonce: res.cookies.instagram_oauth_nonce as string };
}
async function volverDeMeta(query: Record<string, string>, nonce?: string) {
  const res = resFalso();
  await callback({ query, headers: { cookie: nonce ? `instagram_oauth_nonce=${nonce}` : '' } }, res);
  return res;
}

const metaOk = () =>
  vi.fn(async (_url: string, init: { body: URLSearchParams }) => {
    const tokenCorto = !init.body.get('grant_type');
    return { ok: true, json: async () => ({ access_token: tokenCorto ? 'TOKEN_CORTO' : 'TOKEN_LARGO' }), text: async () => '' };
  });

beforeEach(() => {
  for (const k of ENTORNO) original[k] = process.env[k];
  process.env.CRON_SECRET = 'secreto-de-prueba';
  process.env.META_APP_ID = 'app-123';
  process.env.META_APP_SECRET = 'secreto-meta';
  process.env.META_OAUTH_REDIRECT_URI = REDIRECT;
  servicio.verificarTokenInstagram.mockReset().mockResolvedValue({ authSource: 'meta_platform_insights_api', account: { id: 'ig1', username: 'banda_ejemplo', name: 'Banda Ejemplo', followers_count: 1200, media_count: 40 } });
  servicio.guardarConexionInstagram.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  for (const k of ENTORNO) (original[k] === undefined ? delete process.env[k] : (process.env[k] = original[k]));
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /authorize-url', () => {
  it('sin la app de Meta configurada responde 503', () => {
    delete process.env.META_APP_ID;
    const res = resFalso();
    authorizeUrl(reqAuth(), res);
    expect(res.code).toBe(503);
  });

  it('devuelve la URL de consentimiento de Meta con scopes de insights, state firmado y cookie de nonce', () => {
    const { url, state, nonce } = iniciar();
    expect(url.origin + url.pathname).toMatch(/^https:\/\/www\.facebook\.com\/v[\d.]+\/dialog\/oauth$/);
    expect(url.searchParams.get('client_id')).toBe('app-123');
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT);
    expect(url.searchParams.get('scope')).toContain('instagram_manage_insights');
    expect(state.split('.')[0]).toBe('band-a');
    expect(state.split('.')[2]).toBe(nonce);
  });

  it('si la app se abre en otro dominio que el de retorno avisa en vez de fallar en el callback', () => {
    const res = resFalso();
    authorizeUrl({ ...reqAuth(), headers: { host: 'otro.up.railway.app' } }, res);
    expect(res.code).toBe(409);
    expect(res.body.dominio).toBe('bandmanager.io');
  });
});

describe('GET /callback', () => {
  it('cambia el code por un token largo, lo guarda para la banda del state y vuelve conectado', async () => {
    const fetchFalso = metaOk();
    vi.stubGlobal('fetch', fetchFalso);
    const { state, nonce } = iniciar('band-a');

    const res = await volverDeMeta({ state, code: 'CODIGO' }, nonce);

    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(servicio.verificarTokenInstagram).toHaveBeenCalledWith('TOKEN_LARGO');
    expect(servicio.guardarConexionInstagram).toHaveBeenCalledWith('band-a', 'TOKEN_LARGO', expect.objectContaining({ username: 'banda_ejemplo' }));
    expect(res.destino).toBe('/?view=fans&instagram_oauth=conectado');
  });

  it('la banda sale del state: un bandId en la query no cuenta', async () => {
    vi.stubGlobal('fetch', metaOk());
    const { state, nonce } = iniciar('band-a');
    await volverDeMeta({ state, code: 'CODIGO', band_id: 'band-b' }, nonce);
    expect(servicio.guardarConexionInstagram.mock.calls[0][0]).toBe('band-a');
  });

  it('sin la cookie del navegador que inició el flujo rechaza y no toca Meta ni guarda', async () => {
    const fetchFalso = metaOk();
    vi.stubGlobal('fetch', fetchFalso);
    const { state } = iniciar();
    const res = await volverDeMeta({ state, code: 'CODIGO' });
    expect(res.destino).toContain('instagram_oauth=error&motivo=empieza_y_termina_en_el_mismo_dominio');
    expect(fetchFalso).not.toHaveBeenCalled();
    expect(servicio.guardarConexionInstagram).not.toHaveBeenCalled();
  });

  it('el state se consume: repetir el callback falla', async () => {
    vi.stubGlobal('fetch', metaOk());
    const { state, nonce } = iniciar();
    await volverDeMeta({ state, code: 'CODIGO' }, nonce);
    const segunda = await volverDeMeta({ state, code: 'CODIGO' }, nonce);
    expect(segunda.destino).toContain('motivo=estado_invalido_o_caducado');
    expect(servicio.guardarConexionInstagram).toHaveBeenCalledTimes(1);
  });

  it('un state firmado para Gmail no vale para Instagram', async () => {
    const state = crearEstadoOAuth('gmail-oauth').firmar('band-a', 'nonce-fijo');
    const res = await volverDeMeta({ state, code: 'CODIGO' }, 'nonce-fijo');
    expect(res.destino).toContain('motivo=estado_invalido_o_caducado');
    expect(servicio.guardarConexionInstagram).not.toHaveBeenCalled();
  });

  it('si el usuario cancela el permiso vuelve con acceso_denegado y no guarda', async () => {
    const { state, nonce } = iniciar();
    const res = await volverDeMeta({ state, error: 'access_denied' }, nonce);
    expect(res.destino).toContain('motivo=acceso_denegado');
    expect(servicio.guardarConexionInstagram).not.toHaveBeenCalled();
  });

  it('si Meta no amplía el token a larga duración falla claro en vez de guardar uno de 1 h', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'TOKEN_CORTO' }), text: async () => '' })
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({}), text: async () => 'boom' }));
    const { state, nonce } = iniciar();
    const res = await volverDeMeta({ state, code: 'CODIGO' }, nonce);
    expect(res.destino).toContain('motivo=meta_no_amplio_el_token');
    expect(servicio.guardarConexionInstagram).not.toHaveBeenCalled();
  });

  it('sin cuenta de Instagram Business vuelve con un motivo claro y no guarda', async () => {
    vi.stubGlobal('fetch', metaOk());
    servicio.verificarTokenInstagram.mockResolvedValue(null);
    const { state, nonce } = iniciar();
    const res = await volverDeMeta({ state, code: 'CODIGO' }, nonce);
    expect(res.destino).toContain('motivo=sin_cuenta_de_instagram_business');
    expect(servicio.guardarConexionInstagram).not.toHaveBeenCalled();
  });
});
