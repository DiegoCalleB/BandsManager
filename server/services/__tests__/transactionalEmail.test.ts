import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn();
vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: sendMock,
    };
  },
}));

import { sendTransactionalEmail, sendWelcomeEmail } from '../transactionalEmail.js';

describe('transactionalEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it('simula el envío cuando no hay RESEND_API_KEY en variables de entorno', async () => {
    const result = await sendTransactionalEmail({
      to: 'musico@example.com',
      subject: 'Prueba',
      html: '<p>Hola</p>',
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe('simulated-dev-id');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('llama al cliente de Resend con la API Key y el remitente correcto', async () => {
    process.env.RESEND_API_KEY = 're_test_key_123';
    sendMock.mockResolvedValue({ data: { id: 'resend-msg-999' }, error: null });

    const result = await sendWelcomeEmail('rockstar@example.com', 'Alex', 'Los Roqueros');

    expect(result.success).toBe(true);
    expect(result.id).toBe('resend-msg-999');
    expect(sendMock).toHaveBeenCalledTimes(1);

    const callArg = sendMock.mock.calls[0][0];
    expect(callArg.to).toBe('rockstar@example.com');
    expect(callArg.subject).toContain('Bienvenido a BandManager.io');
    expect(callArg.html).toContain('Alex');
    expect(callArg.html).toContain('Los Roqueros');
  });

  it('gestiona errores devueltos por la API de Resend sin romper la ejecución', async () => {
    process.env.RESEND_API_KEY = 're_test_key_123';
    sendMock.mockResolvedValue({ data: null, error: { message: 'Domain not verified' } });

    const result = await sendTransactionalEmail({
      to: 'musico@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Domain not verified');
  });
});
