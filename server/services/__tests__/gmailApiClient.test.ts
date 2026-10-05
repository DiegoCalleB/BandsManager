import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const dbGetBandGmailOAuthMock = vi.fn();
vi.mock('../../db/gmailOAuth.js', () => ({
  dbGetBandGmailOAuth: (...args: any[]) => dbGetBandGmailOAuthMock(...args)
}));

import {
  crearBorradorGmailApi,
  tieneGmailOAuthConectado,
  comprobarBorradorEnviado,
  leerRespuestasGmailApi,
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

  it('leerRespuestasGmailApi lista mensajes no leídos y extrae remitente/asunto/texto', async () => {
    dbGetBandGmailOAuthMock.mockResolvedValue({ ...account, band_id: 'band-leer-respuestas' });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const cuerpoBase64 = Buffer.from('Hola, nos interesa la propuesta.').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'access-leer', expires_in: 3600 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ messages: [{ id: 'msg-1' }] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payload: {
            mimeType: 'text/plain',
            headers: [
              { name: 'From', value: 'Sala de Conciertos <sala@example.com>'},
              { name: 'Subject', value: 'Re: Propuesta' },
              { name: 'Message-ID', value: '<abc123@mail.gmail.com>'},
              { name: 'Date', value: 'Mon, 01 Sep 2026 10:00:00 +0200' }
            ],
            body: { data: cuerpoBase64 }
          }
        })
      });

    const resultados = await leerRespuestasGmailApi('band-leer-respuestas');

    expect(resultados).toHaveLength(1);
    expect(resultados[0].uid).toBe('msg-1');
    expect(resultados[0].from).toBe('sala@example.com');
    expect(resultados[0].subject).toBe('Re: Propuesta');
    expect(resultados[0].text).toBe('Hola, nos interesa la propuesta.');
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
