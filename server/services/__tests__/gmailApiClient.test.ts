import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const dbGetBandGmailOAuthMock = vi.fn();
vi.mock('../../db/gmailOAuth.js', () => ({
  dbGetBandGmailOAuth: (...args: any[]) => dbGetBandGmailOAuthMock(...args)
}));

import { crearBorradorGmailApi, tieneGmailOAuthConectado } from '../gmailApiClient';
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
});
