import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const dbGetBandGmailOAuthMock = vi.fn();
const dbSetGmailHistoryIdMock = vi.fn();
vi.mock('../../db/gmailOAuth.js', () => ({
  dbGetBandGmailOAuth: (...a: any[]) => dbGetBandGmailOAuthMock(...a),
  dbMarkGmailNeedsReauth: vi.fn(),
  dbSetGmailHistoryId: (...a: any[]) => dbSetGmailHistoryIdMock(...a),
}));

import { leerBandejaGmailIncremental } from '../gmailApiClient';

let banda = 0;
const cuenta = (extra: any = {}) => ({ band_id: `b${banda}`, gmail_email: 'banda@gmail.com', refresh_token: 'r', scope: 's', ...extra });
const json = (cuerpo: any, status = 200) => ({ ok: status < 400, status, json: async () => cuerpo, text: async () => JSON.stringify(cuerpo) });
const mensaje = (id: string) => ({
  id, threadId: `t-${id}`,
  payload: { headers: [{ name: 'From', value: `Sala <sala${id}@x.es>` }, { name: 'Subject', value: `Re: ${id}` }, { name: 'Message-ID', value: `<${id}@x.es>` }], mimeType: 'text/plain', body: { data: Buffer.from(`hola ${id}`).toString('base64url') } },
});

// Un Gmail falso: enruta por URL.
function gmailFalso(opts: { profile?: string; scan?: string[][]; history?: Array<{ ids: string[]; next?: string }>; historyStatus?: number; listStatus?: number }) {
  const llamadas: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    llamadas.push(url);
    if (url.includes('oauth2.googleapis.com/token')) return json({ access_token: 'tok', expires_in: 3600 });
    if (url.endsWith('/profile')) return json({ historyId: opts.profile ?? '500' });
    if (url.includes('/history')) {
      if (opts.historyStatus) return json({ error: { code: opts.historyStatus } }, opts.historyStatus);
      const pagina = Number(new URL(url).searchParams.get('pageToken') || 0);
      const p = opts.history![pagina];
      return json({ history: p.ids.map((id) => ({ messagesAdded: [{ message: { id, labelIds: ['INBOX', 'UNREAD'] } }] })), nextPageToken: p.next });
    }
    if (url.includes('/messages?')) {
      if (opts.listStatus) return json({ error: { code: opts.listStatus, status: 'RESOURCE_EXHAUSTED' } }, opts.listStatus);
      const pagina = Number(new URL(url).searchParams.get('pageToken') || 0);
      const ids = opts.scan![pagina];
      return json({ messages: ids.map((id) => ({ id })), nextPageToken: pagina + 1 < opts.scan!.length ? String(pagina + 1) : undefined });
    }
    const id = url.split('/messages/')[1].split('?')[0];
    return json(mensaje(id));
  }));
  return llamadas;
}

beforeEach(() => {
  banda++;
  vi.clearAllMocks();
  process.env.GOOGLE_OAUTH_CLIENT_ID = 'id';
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'secret';
});
afterEach(() => vi.unstubAllGlobals());

describe('leerBandejaGmailIncremental', () => {
  it('sin cursor: escaneo completo paginado (no se queda en 25) y guarda el cursor SOLO al confirmar', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue(cuenta());
    const pagina = (desde: number, n: number) => Array.from({ length: n }, (_, i) => `m${desde + i}`);
    gmailFalso({ profile: '900', scan: [pagina(0, 100), pagina(100, 40)] });

    const lectura = await leerBandejaGmailIncremental(`b${banda}`);
    expect(lectura.modo).toBe('completa');
    expect(lectura.mensajes).toHaveLength(140);
    expect(dbSetGmailHistoryIdMock).not.toHaveBeenCalled(); // aún no: el Lector no ha procesado nada

    await lectura.avanzarCursor();
    expect(dbSetGmailHistoryIdMock).toHaveBeenCalledWith(`b${banda}`, '900');
  });

  it('con cursor: pide solo lo añadido desde ese historyId, de todas las páginas y sin duplicados', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue(cuenta({ gmail_history_id: '400' }));
    const llamadas = gmailFalso({ profile: '950', history: [{ ids: ['a', 'b'], next: '1' }, { ids: ['b', 'c'] }] });

    const lectura = await leerBandejaGmailIncremental(`b${banda}`);
    expect(lectura.modo).toBe('incremental');
    expect(lectura.mensajes.map((m) => m.uid).sort()).toEqual(['a', 'b', 'c']);
    expect(llamadas.some((u) => u.includes('startHistoryId=400') && u.includes('labelId=INBOX'))).toBe(true);
    expect(llamadas.some((u) => u.includes('newer_than'))).toBe(false); // no hubo escaneo

    await lectura.avanzarCursor();
    expect(dbSetGmailHistoryIdMock).toHaveBeenCalledWith(`b${banda}`, '950');
  });

  it('si el cursor caducó (404 de Google) vuelve al escaneo completo en vez de fallar', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue(cuenta({ gmail_history_id: '1' }));
    gmailFalso({ profile: '777', historyStatus: 404, scan: [['x', 'y']] });

    const lectura = await leerBandejaGmailIncremental(`b${banda}`);
    expect(lectura.modo).toBe('completa');
    expect(lectura.mensajes.map((m) => m.uid)).toEqual(['x', 'y']);
    await lectura.avanzarCursor();
    expect(dbSetGmailHistoryIdMock).toHaveBeenCalledWith(`b${banda}`, '777');
  });

  it('sin mensajes nuevos devuelve vacío y aun así avanza el cursor al confirmar', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue(cuenta({ gmail_history_id: '400' }));
    gmailFalso({ profile: '410', history: [{ ids: [] }] });
    const lectura = await leerBandejaGmailIncremental(`b${banda}`);
    expect(lectura.mensajes).toEqual([]);
    await lectura.avanzarCursor();
    expect(dbSetGmailHistoryIdMock).toHaveBeenCalledWith(`b${banda}`, '410');
  });

  it('límite 429 de Google: devuelve vacío y NO avanza el cursor (se reintenta luego)', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue(cuenta());
    gmailFalso({ listStatus: 429, scan: [[]] });
    const lectura = await leerBandejaGmailIncremental(`b${banda}`);
    expect(lectura.mensajes).toEqual([]);
    await lectura.avanzarCursor();
    expect(dbSetGmailHistoryIdMock).not.toHaveBeenCalled();
  });
});
