import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dbGetEpkConfig = vi.hoisted(() => vi.fn());
vi.mock('../../db.js', () => ({ dbGetEpkConfig }));

const { credencialesInstagram, motivoErrorInstagram, seguidoresInstagram } = await import('../instagramDescubrimiento.js');

const respuesta = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });

beforeEach(() => {
  dbGetEpkConfig.mockReset().mockResolvedValue(null);
  vi.stubEnv('INSTAGRAM_ACCESS_TOKEN', '');
  vi.stubEnv('META_GRAPH_TOKEN', '');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('credencialesInstagram', () => {
  it('sin token explica que falta conectar Instagram', async () => {
    expect(await credencialesInstagram('band-1')).toEqual({ motivo: 'Instagram sin conectar (falta el token de Meta)' });
  });

  it('rechaza el token de «Instagram Login», que no sirve para business_discovery', async () => {
    dbGetEpkConfig.mockResolvedValue({ enlacesRedes: { instagram_access_token: 'IGQWRabc' } });
    const r = await credencialesInstagram('band-1');
    expect('motivo' in r && r.motivo).toContain('Facebook Login');
  });

  it('usa token y cuenta guardados en la configuración EPK de la banda', async () => {
    dbGetEpkConfig.mockResolvedValue({ enlacesRedes: { instagram_access_token: 'EAAtoken', instagram_account_id: 1784 } });
    expect(await credencialesInstagram('band-1')).toEqual({ token: 'EAAtoken', cuentaId: '1784' });
  });

  it('con token de entorno y sin ID, descubre la cuenta profesional enlazada a sus páginas', async () => {
    vi.stubEnv('META_GRAPH_TOKEN', 'EAAentorno');
    const fetchMock = vi.fn(async () => respuesta({ data: [{}, { instagram_business_account: { id: '999' } }] }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await credencialesInstagram('band-1')).toEqual({ token: 'EAAentorno', cuentaId: '999' });
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain('/me/accounts');
  });

  it('avisa si el token no tiene ninguna cuenta profesional enlazada', async () => {
    vi.stubEnv('META_GRAPH_TOKEN', 'EAAentorno');
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({ data: [] })));
    const r = await credencialesInstagram('band-1');
    expect('motivo' in r && r.motivo).toContain('ninguna cuenta profesional');
  });
});

describe('seguidoresInstagram', () => {
  const cred = { token: 'EAAtoken', cuentaId: '1784' };

  it('devuelve los seguidores de la cuenta del enlace', async () => {
    const fetchMock = vi.fn(async () => respuesta({ business_discovery: { followers_count: 5321 } }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await seguidoresInstagram(cred, 'https://instagram.com/Ladilla.Rusa/')).toEqual({ fila: { fuente: 'instagram', seguidores: 5321 } });
    const url = decodeURIComponent(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url).toContain('/1784?fields=business_discovery.username(ladilla.rusa){followers_count}');
  });

  it('sin enlace de Instagram no llama a Meta', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await seguidoresInstagram(cred, '')).toEqual({ motivo: 'sin enlace de Instagram' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('traduce el error de cuenta no encontrada o no profesional', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({ error: { code: 110, message: 'Invalid user id' } }, 400)));
    expect(await seguidoresInstagram(cred, '@bala')).toEqual({ motivo: 'Instagram no encuentra una cuenta profesional con ese usuario' });
  });

  it('propaga el motivo de credenciales sin tocar la red', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await seguidoresInstagram({ motivo: 'Instagram sin conectar (falta el token de Meta)' }, '@bala')).toEqual({ motivo: 'Instagram sin conectar (falta el token de Meta)' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('motivoErrorInstagram', () => {
  it('distingue token caducado, límite de peticiones y error genérico', () => {
    expect(motivoErrorInstagram(400, { error: { code: 190 } })).toContain('caducado');
    expect(motivoErrorInstagram(400, { error: { code: 4 } })).toContain('limitado');
    expect(motivoErrorInstagram(500, null)).toBe('Instagram respondió 500');
  });
});
