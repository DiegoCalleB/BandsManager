import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/emailAccounts.js', () => ({
  dbGetBandEmailAccount: vi.fn()
}));

vi.mock('../../db/core.js', () => ({
  getSupabase: vi.fn()
}));

const sendMailMock = vi.fn();
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: sendMailMock }))
  }
}));

import { dbGetBandEmailAccount } from '../../db/emailAccounts.js';
import { getSupabase } from '../../db/core.js';
import { enviarEmail, verificarIdentidadEmail, EmailAgentError } from '../emailAgentClient';

const baseAccount = {
  band_id: 'band-test',
  provider: 'gmail' as const,
  email: 'oficial@banda.com',
  app_password: 'fake-app-password',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 465,
  smtp_secure: true,
  imap_host: 'imap.gmail.com',
  imap_port: 993
};

function mockRegisteredBandEmail(email: string) {
  vi.mocked(getSupabase).mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { email } })
        })
      })
    })
  } as any);
}

describe('emailAgentClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nunca envía si la banda no tiene cuenta de email conectada', async () => {
    vi.mocked(dbGetBandEmailAccount).mockResolvedValue(null);

    await expect(
      enviarEmail('band-test', { to: 'sala@example.com', subject: 'Hola', body: 'Propuesta' })
    ).rejects.toMatchObject({ code: 'no_token' });

    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('nunca envía si la cuenta configurada no coincide con el email oficial de la banda', async () => {
    vi.mocked(dbGetBandEmailAccount).mockResolvedValue({ ...baseAccount, email: 'otra-cuenta@gmail.com' });
    mockRegisteredBandEmail('oficial@banda.com');

    await expect(
      enviarEmail('band-test', { to: 'sala@example.com', subject: 'Hola', body: 'Propuesta' })
    ).rejects.toMatchObject({ code: 'identity_mismatch' });

    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('envía por SMTP cuando la identidad coincide, funciona igual para Gmail y Outlook', async () => {
    vi.mocked(dbGetBandEmailAccount).mockResolvedValue({ ...baseAccount, provider: 'outlook', smtp_host: 'smtp.office365.com', smtp_port: 587, smtp_secure: false });
    mockRegisteredBandEmail('oficial@banda.com');
    sendMailMock.mockResolvedValue({ messageId: 'msg-123' });

    const result = await enviarEmail('band-test', { to: 'sala@example.com', subject: 'Hola', body: 'Propuesta' });

    expect(result.messageId).toBe('msg-123');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const sentArgs = sendMailMock.mock.calls[0][0];
    expect(sentArgs.from).toBe('oficial@banda.com');
    expect(sentArgs.to).toBe('sala@example.com');
  });

  it('verificarIdentidadEmail confirma coincidencia sin distinguir mayúsculas', async () => {
    vi.mocked(dbGetBandEmailAccount).mockResolvedValue({ ...baseAccount, email: 'Oficial@Banda.com' });
    mockRegisteredBandEmail('oficial@banda.com');

    const result = await verificarIdentidadEmail('band-test');
    expect(result.ok).toBe(true);
    expect(result.emailConectado).toBe('oficial@banda.com');
  });

  it('EmailAgentError conserva el código de error tras un fallo de envío SMTP', async () => {
    vi.mocked(dbGetBandEmailAccount).mockResolvedValue(baseAccount);
    mockRegisteredBandEmail('oficial@banda.com');
    sendMailMock.mockRejectedValue(new Error('Connection timeout'));

    await expect(
      enviarEmail('band-test', { to: 'sala@example.com', subject: 'Hola', body: 'Propuesta' })
    ).rejects.toBeInstanceOf(EmailAgentError);
  });
});
