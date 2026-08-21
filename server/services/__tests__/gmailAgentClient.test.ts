import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../db/gmailTokens.js', () => ({
  dbGetBandGmailToken: vi.fn()
}));

vi.mock('../../db/core.js', () => ({
  getSupabase: vi.fn()
}));

import { dbGetBandGmailToken } from '../../db/gmailTokens.js';
import { getSupabase } from '../../db/core.js';
import { enviarEmail, verificarIdentidadGmail, GmailAgentError } from '../gmailAgentClient';

describe('gmailAgentClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-client-secret');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('nunca envía si la banda no tiene token de Gmail conectado', async () => {
    vi.mocked(dbGetBandGmailToken).mockResolvedValue(null);

    await expect(
      enviarEmail('band-test', { to: 'sala@example.com', subject: 'Hola', body: 'Propuesta' })
    ).rejects.toMatchObject({ code: 'no_token' });
  });

  it('nunca envía si la cuenta de Gmail conectada no coincide con el email oficial de la banda', async () => {
    vi.mocked(dbGetBandGmailToken).mockResolvedValue({
      band_id: 'band-test',
      refresh_token: 'fake-refresh-token',
      email_conectado: null
    });

    vi.mocked(getSupabase).mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { email: 'oficial@banda.com' } })
          })
        })
      })
    } as any);

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('oauth2.googleapis.com/token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'fake-access-token' })
        });
      }
      if (url.includes('/profile')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ emailAddress: 'otra-cuenta-distinta@gmail.com' })
        });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      enviarEmail('band-test', { to: 'sala@example.com', subject: 'Hola', body: 'Propuesta' })
    ).rejects.toMatchObject({ code: 'identity_mismatch' });

    // No debe haber llegado a intentar el envío real (solo token + profile, nunca messages/send).
    const calledUrls = fetchMock.mock.calls.map((c) => c[0]);
    expect(calledUrls.some((u) => String(u).includes('/messages/send'))).toBe(false);
  });

  it('verificarIdentidadGmail confirma coincidencia cuando el email conectado es igual al oficial', async () => {
    vi.mocked(dbGetBandGmailToken).mockResolvedValue({
      band_id: 'band-test',
      refresh_token: 'fake-refresh-token',
      email_conectado: null
    });

    vi.mocked(getSupabase).mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { email: 'oficial@banda.com' } })
          })
        })
      })
    } as any);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('oauth2.googleapis.com/token')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ access_token: 'fake-access-token' }) });
        }
        if (url.includes('/profile')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ emailAddress: 'Oficial@Banda.com' }) });
        }
        throw new Error(`Unexpected fetch call: ${url}`);
      })
    );

    const result = await verificarIdentidadGmail('band-test');
    expect(result.ok).toBe(true);
    expect(result.emailConectado).toBe('oficial@banda.com');
  });
});
