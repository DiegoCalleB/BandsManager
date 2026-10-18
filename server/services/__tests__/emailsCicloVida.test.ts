import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({
  dbUsuariosRecientes: vi.fn(),
  dbEmailsEnviados: vi.fn(),
  dbBandasConConcierto: vi.fn(),
  dbBandasConEpk: vi.fn(),
  dbReservarEmail: vi.fn(),
  dbLiberarEmail: vi.fn(),
}));
const envio = vi.hoisted(() => ({ sendTransactionalEmail: vi.fn(), getProductionAppUrl: () => 'https://bandmanager.io' }));
vi.mock('../../db/emailsCicloVida.js', () => db);
vi.mock('../transactionalEmail.js', () => envio);
vi.mock('../../utils/errorTracking.js', () => ({ captureError: vi.fn() }));

import { procesarEmailsCicloVida, MAX_POR_PASADA } from '../emailsCicloVida.js';

const AHORA = new Date('2026-10-20T12:00:00Z');
const usuario = (id: string, dias: number, extra = {}) => ({
  id, name: 'Ana', email: `${id}@x.com`, band_id: `b-${id}`, band_name: 'Tigres', ui_preferences: {},
  created_at: new Date(AHORA.getTime() - dias * 86_400_000).toISOString(), ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.EMAILS_CICLO_VIDA_SOLO;
  db.dbEmailsEnviados.mockResolvedValue(new Map());
  db.dbBandasConConcierto.mockResolvedValue(new Set());
  db.dbBandasConEpk.mockResolvedValue(new Set());
  db.dbReservarEmail.mockResolvedValue(true);
  envio.sendTransactionalEmail.mockResolvedValue({ success: true, id: 'e1' });
});

describe('procesarEmailsCicloVida', () => {
  it('envía a quien toca y solo a él', async () => {
    db.dbUsuariosRecientes.mockResolvedValue([usuario('a', 3), usuario('b', 0.5), usuario('c', 3, { email: null })]);
    const r = await procesarEmailsCicloVida(AHORA);
    expect(r).toEqual({ revisados: 3, enviados: 1 });
    expect(envio.sendTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(envio.sendTransactionalEmail.mock.calls[0][0].to).toBe('a@x.com');
    expect(db.dbReservarEmail).toHaveBeenCalledWith('a', 'primer_concierto');
  });
  it('si otra instancia ya reservó el email, no lo manda', async () => {
    db.dbUsuariosRecientes.mockResolvedValue([usuario('a', 3)]);
    db.dbReservarEmail.mockResolvedValue(false);
    expect((await procesarEmailsCicloVida(AHORA)).enviados).toBe(0);
    expect(envio.sendTransactionalEmail).not.toHaveBeenCalled();
  });
  it('si el envío falla libera la reserva para reintentar y no se cuenta', async () => {
    db.dbUsuariosRecientes.mockResolvedValue([usuario('a', 3)]);
    envio.sendTransactionalEmail.mockResolvedValue({ success: false, error: 'sin clave' });
    expect((await procesarEmailsCicloVida(AHORA)).enviados).toBe(0);
    expect(db.dbLiberarEmail).toHaveBeenCalledWith('a', 'primer_concierto');
  });
  it('respeta la baja y manda en inglés a quien se registró en inglés', async () => {
    db.dbUsuariosRecientes.mockResolvedValue([usuario('a', 3), usuario('b', 3, { ui_preferences: { idioma: 'en' } })]);
    db.dbEmailsEnviados.mockResolvedValue(new Map([['a', new Set(['baja'])]]));
    await procesarEmailsCicloVida(AHORA);
    expect(envio.sendTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(envio.sendTransactionalEmail.mock.calls[0][0].subject).toBe('Your first gig on BandManager, in 2 minutes');
  });
  it('un fallo con un usuario no impide enviar al siguiente', async () => {
    db.dbUsuariosRecientes.mockResolvedValue([usuario('a', 3), usuario('b', 3)]);
    db.dbReservarEmail.mockRejectedValueOnce(new Error('BD'));
    expect((await procesarEmailsCicloVida(AHORA)).enviados).toBe(1);
  });
  it('en modo prueba solo escribe a las direcciones de la lista', async () => {
    process.env.EMAILS_CICLO_VIDA_SOLO = ' B@x.com ';
    db.dbUsuariosRecientes.mockResolvedValue([usuario('a', 3), usuario('b', 3)]);
    expect((await procesarEmailsCicloVida(AHORA)).enviados).toBe(1);
    expect(envio.sendTransactionalEmail.mock.calls[0][0].to).toBe('b@x.com');
    expect(db.dbReservarEmail).not.toHaveBeenCalledWith('a', expect.anything());
  });
  it('nunca envía más del tope por pasada', async () => {
    db.dbUsuariosRecientes.mockResolvedValue(Array.from({ length: MAX_POR_PASADA + 10 }, (_, i) => usuario(`u${i}`, 3)));
    expect((await procesarEmailsCicloVida(AHORA)).enviados).toBe(MAX_POR_PASADA);
  });
});
