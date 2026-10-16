import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const dbGetBandGmailOAuthMock = vi.fn();
const dbMarkGmailNeedsReauthMock = vi.fn();
vi.mock('../../db/gmailOAuth.js', () => ({
  dbGetBandGmailOAuth: (...args: any[]) => dbGetBandGmailOAuthMock(...args),
  dbMarkGmailNeedsReauth: (...args: any[]) => dbMarkGmailNeedsReauthMock(...args)
}));

import {
  crearBorradorGmailApi,
  tieneGmailOAuthConectado,
  comprobarBorradorEnviado,
  marcarComoLeidoGmailApi,
  enviarEmailGmailApi
} from '../gmailApiClient';
import { EmailAgentError } from '../emailAgentClient';

const account = {
  band_id: 'band-test',
  gmail_email: 'banda@gmail.com',
  refresh_token: 'refresh-abc',
  scope: 'https://www.googleapis.com/auth/gmail.compose'
};

describe('gmailApiClient', () => {
  beforeEach(() => {
    dbGetBandGmailOAuthMock.mockReset();
    dbMarkGmailNeedsReauthMock.mockReset();
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'client-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'client-secret';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tieneGmailOAuthConectado devuelve true solo si hay cuenta guardada', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValueOnce(account);
    expect(await tieneGmailOAuthConectado('band-test')).toBe(true);

    dbGetBandGmailOAuthMock.mockResolvedValueOnce(null);
    expect(await tieneGmailOAuthConectado('band-test')).toBe(false);
  });

  it('tieneGmailOAuthConectado es false si la cuenta está marcada para reconectar', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValueOnce({ ...account, needs_reauth_at: '2026-10-11T06:00:00Z' });
    expect(await tieneGmailOAuthConectado('band-test')).toBe(false);
  });

  it('crearBorradorGmailApi cambia el refresh token por un access token y crea el borrador', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue(account);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'access-xyz', expires_in: 3600 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'draft-1' }) });

    const result = await crearBorradorGmailApi('band-test', {
      to: 'sala@example.com',
      subject: 'Propuesta',
      body: 'Hola, os proponemos un concierto.'
    });

    expect(result.draftPath).toContain('draft-1');
    expect(result.draftId).toBe('draft-1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [tokenCall, draftCall] = fetchMock.mock.calls;
    expect(tokenCall[0]).toBe('https://oauth2.googleapis.com/token');
    expect(draftCall[0]).toBe('https://gmail.googleapis.com/gmail/v1/users/me/drafts');
    expect(draftCall[1].headers.Authorization).toBe('Bearer access-xyz');
  });

  it('lanza EmailAgentError si la banda no tiene Gmail OAuth conectado', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue(null);
    await expect(crearBorradorGmailApi('band-sin-oauth', {
      to: 'sala@example.com',
      subject: 'Propuesta',
      body: 'Hola'
    })).rejects.toBeInstanceOf(EmailAgentError);
  });

  it('lanza EmailAgentError si Google rechaza el refresh token', async () => {
    // Banda distinta a la del test anterior: getValidAccessToken cachea el access token en
    // memoria por band_id, y reutilizar 'band-test' aquí saltaría el fetch al token endpoint
    // que este test necesita ver fallar.
    dbGetBandGmailOAuthMock.mockResolvedValue({ ...account, band_id: 'band-test-token-fail' });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'invalid_grant' });

    await expect(crearBorradorGmailApi('band-test-token-fail', {
      to: 'sala@example.com',
      subject: 'Propuesta',
      body: 'Hola'
    })).rejects.toBeInstanceOf(EmailAgentError);
  });

  it('invalid_grant: lanza reauth_required y marca la cuenta para reconectar (sin reintentos)', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue({ ...account, band_id: 'band-reauth' });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400, text: async () => JSON.stringify({ error: 'invalid_grant' }) });

    const fallo = await crearBorradorGmailApi('band-reauth', { to: 's@x.es', subject: 'x', body: 'x' }).catch((e) => e);
    expect(fallo).toBeInstanceOf(EmailAgentError);
    expect(fallo.code).toBe('reauth_required');
    expect(dbMarkGmailNeedsReauthMock).toHaveBeenCalledWith('band-reauth');
  });

  it('otros fallos del token endpoint (red, 500) siguen siendo api_error y NO marcan la cuenta', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue({ ...account, band_id: 'band-500' });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' });

    const fallo = await crearBorradorGmailApi('band-500', { to: 's@x.es', subject: 'x', body: 'x' }).catch((e) => e);
    expect(fallo.code).toBe('api_error');
    expect(dbMarkGmailNeedsReauthMock).not.toHaveBeenCalled();
  });

  it('comprobarBorradorEnviado devuelve true si el borrador sigue existiendo y false si Google responde 404', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue({ ...account, band_id: 'band-comprobar-borrador' });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'access-comprobar', expires_in: 3600 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'draft-1' }) })
      .mockResolvedValueOnce({ ok: false, status: 404 });

    expect(await comprobarBorradorEnviado('band-comprobar-borrador', 'draft-1')).toBe(true);
    expect(await comprobarBorradorEnviado('band-comprobar-borrador', 'draft-1')).toBe(false);

    const [, existeCall, borradoCall] = fetchMock.mock.calls;
    expect(existeCall[0]).toBe('https://gmail.googleapis.com/gmail/v1/users/me/drafts/draft-1');
    expect(borradoCall[0]).toBe('https://gmail.googleapis.com/gmail/v1/users/me/drafts/draft-1');
  });

  it('marcarComoLeidoGmailApi llama a batchModify quitando la etiqueta UNREAD', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue({ ...account, band_id: 'band-marcar-leido' });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'access-marcar', expires_in: 3600 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await marcarComoLeidoGmailApi('band-marcar-leido', ['msg-1', 'msg-2']);

    const [, batchCall] = fetchMock.mock.calls;
    expect(batchCall[0]).toBe('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify');
    expect(JSON.parse(batchCall[1].body)).toEqual({ ids: ['msg-1', 'msg-2'], removeLabelIds: ['UNREAD'] });
  });

  it('enviarEmailGmailApi manda el mensaje real vía users.messages.send', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue({ ...account, band_id: 'band-enviar-directo' });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'access-enviar', expires_in: 3600 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'sent-msg-1' }) });

    const result = await enviarEmailGmailApi('band-enviar-directo', {
      to: 'sala@example.com',
      subject: 'Propuesta',
      body: 'Hola, os proponemos un concierto.'
    });

    expect(result.messageId).toBe('sent-msg-1');
    const [, sendCall] = fetchMock.mock.calls;
    expect(sendCall[0]).toBe('https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
  });
});

import { parsearMensajeGmail } from '../gmailApiClient';
describe('parsearMensajeGmail: nombre del remitente', () => {
  const con = (from: string) => parsearMensajeGmail({ payload: { headers: [{ name: 'From', value: from }] } }, 'id1');
  it('separa nombre y dirección en los formatos habituales', () => {
    expect(con('"Sala Caracol" <booking@caracol.es>')).toMatchObject({ from: 'booking@caracol.es', fromName: 'Sala Caracol' });
    expect(con('Sala Caracol <booking@caracol.es>')).toMatchObject({ from: 'booking@caracol.es', fromName: 'Sala Caracol' });
    expect(con('booking@caracol.es')).toMatchObject({ from: 'booking@caracol.es', fromName: undefined });
  });
  it('un nombre con marcas HTML no se "limpia" a medias: se queda como texto, sin enlaces de dirección', () => {
    const r = con('<script>x <b@c.es>');
    expect(r.fromName ?? '').not.toContain('<');
  });
});
