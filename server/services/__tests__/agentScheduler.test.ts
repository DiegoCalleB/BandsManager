import { describe, it, expect, vi, beforeEach } from 'vitest';
import { currentHourAndDay, claveEjecucionProgramada, triggerManualSchedulerTick, bandHasEmailConfigured } from '../agentScheduler';

describe('agentScheduler currentHourAndDay', () => {
  it('calcula la hora y el día ISO (1=lunes..7=domingo) correctos en Europe/Madrid', () => {
    // 2026-08-18 es un martes. 10:30 UTC = 12:30 en Madrid (horario de verano, UTC+2).
    const tuesdayMorningUtc = new Date('2026-08-18T10:30:00Z');
    const result = currentHourAndDay('Europe/Madrid', tuesdayMorningUtc);
    expect(result.hour).toBe(12);
    expect(result.dayIso).toBe(2); // martes
    expect(result.dateKey).toBe('2026-08-18');
  });

  it('trata la medianoche correctamente (Intl puede devolver "24" en vez de "0")', () => {
    // Medianoche exacta en Madrid un día sin cambio de horario relevante.
    const midnightUtc = new Date('2026-01-15T23:00:00Z'); // 00:00 en Madrid (invierno, UTC+1)
    const result = currentHourAndDay('Europe/Madrid', midnightUtc);
    expect(result.hour).toBe(0);
  });

  it('usa Europe/Madrid por defecto si no se pasa timezone', () => {
    const someUtc = new Date('2026-08-18T10:30:00Z');
    const result = currentHourAndDay('', someUtc);
    expect(result.hour).toBe(12);
  });
});

const horario = {
  timezone: 'Europe/Madrid',
  horas_enviador: [10],
  dias_enviador: [2],
  horas_lector: [8, 12],
  dias_lector: [1, 2, 3, 4, 5, 6, 7],
};

describe('claveEjecucionProgramada', () => {
  it('devuelve una clave por banda, día y hora cuando la hora está en la ventana', () => {
    // Martes 2026-08-18 08:15 UTC = 10:15 en Madrid.
    const now = new Date('2026-08-18T08:15:00Z');
    expect(claveEjecucionProgramada('enviador', 'b1', horario, now)).toBe('enviador:b1:2026-08-18:10');
    expect(claveEjecucionProgramada('lector', 'b1', horario, now)).toBeNull();
  });

  it('respeta los días: fuera de dias_enviador no hay clave aunque la hora coincida', () => {
    // Miércoles 10:15 en Madrid.
    expect(claveEjecucionProgramada('enviador', 'b1', horario, new Date('2026-08-19T08:15:00Z'))).toBeNull();
  });
});

const mocks = vi.hoisted(() => ({
  dbGetRegisteredBands: vi.fn(),
  dbGetBandSchedule: vi.fn(),
  dbGetBandEmailAccount: vi.fn(),
  dbGetBandGmailOAuth: vi.fn(),
  dbGetAgentLastRun: vi.fn(),
  dbSetAgentLastRun: vi.fn(),
  enqueueAgentJob: vi.fn(),
}));
vi.mock('../../db.js', () => ({
  dbGetRegisteredBands: mocks.dbGetRegisteredBands,
  dbGetBandSchedule: mocks.dbGetBandSchedule,
  dbGetBandEmailAccount: mocks.dbGetBandEmailAccount,
  dbGetBandGmailOAuth: mocks.dbGetBandGmailOAuth,
}));
vi.mock('../../db/agentSchedule.js', () => ({
  dbGetAgentLastRun: mocks.dbGetAgentLastRun,
  dbSetAgentLastRun: mocks.dbSetAgentLastRun,
}));
vi.mock('../agentQueueService.js', () => ({ enqueueAgentJob: mocks.enqueueAgentJob }));
vi.mock('../agentQueueWorker.js', () => ({ startAgentQueueWorker: vi.fn(), stopAgentQueueWorker: vi.fn() }));
vi.mock('../gmailApiClient.js', () => ({ isGmailRateLimited: () => false }));

describe('tick del planificador', () => {
  const ejecutadas = new Set<string>();

  beforeEach(() => {
    vi.useFakeTimers();
    ejecutadas.clear();
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.dbGetRegisteredBands.mockResolvedValue([{ band_id: 'b1', estado_cuenta: 'activo' }]);
    mocks.dbGetBandSchedule.mockResolvedValue(horario);
    mocks.dbGetBandEmailAccount.mockResolvedValue({ email: 'a@b.es', imap_host: 'imap.b.es' });
    mocks.dbGetBandGmailOAuth.mockResolvedValue(null);
    mocks.dbGetAgentLastRun.mockImplementation(async (k: string) => (ejecutadas.has(k) ? new Date() : null));
    mocks.dbSetAgentLastRun.mockImplementation(async (k: string) => { ejecutadas.add(k); });
    mocks.enqueueAgentJob.mockResolvedValue('job_1');
  });

  const tiposEncolados = () => mocks.enqueueAgentJob.mock.calls.map((c) => c[0].agentType);

  it('encola el Enviador en su ventana y solo una vez por hora aunque haya varios ticks', async () => {
    vi.setSystemTime(new Date('2026-08-18T08:05:00Z')); // martes 10:05 Madrid
    await triggerManualSchedulerTick();
    vi.setSystemTime(new Date('2026-08-18T08:10:00Z'));
    await triggerManualSchedulerTick();
    expect(tiposEncolados()).toEqual(['redactor_pitch_dispatch']);
  });

  it('encola el Lector en sus horas de lectura y no fuera de ellas', async () => {
    vi.setSystemTime(new Date('2026-08-18T09:30:00Z')); // 11:30 Madrid: nada
    await triggerManualSchedulerTick();
    expect(tiposEncolados()).toEqual([]);
    vi.setSystemTime(new Date('2026-08-18T10:02:00Z')); // 12:02 Madrid: lector
    await triggerManualSchedulerTick();
    expect(tiposEncolados()).toEqual(['lector_inbox_check']);
  });

  it('fuera de toda ventana no consulta la cuenta de email (solo mira la hora)', async () => {
    vi.setSystemTime(new Date('2026-08-18T09:30:00Z'));
    await triggerManualSchedulerTick();
    expect(mocks.dbGetBandEmailAccount).not.toHaveBeenCalled();
    expect(mocks.dbGetAgentLastRun).not.toHaveBeenCalled();
  });

  it('sin cuenta de email no encola nada aunque sea su hora', async () => {
    mocks.dbGetBandEmailAccount.mockResolvedValue(null);
    vi.setSystemTime(new Date('2026-08-18T08:05:00Z'));
    await triggerManualSchedulerTick();
    expect(tiposEncolados()).toEqual([]);
  });
});

describe('bandHasEmailConfigured con Gmail revocado', () => {
  beforeEach(() => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'secret';
    mocks.dbGetBandEmailAccount.mockResolvedValue(null);
  });

  it('Gmail conectado y válido cuenta como correo configurado', async () => {
    mocks.dbGetBandGmailOAuth.mockResolvedValue({ refresh_token: 'r', needs_reauth_at: null });
    expect(await bandHasEmailConfigured('b1')).toBe(true);
  });

  it('Gmail marcado para reconectar NO cuenta: no se encolan agentes que fallarían cada vez', async () => {
    mocks.dbGetBandGmailOAuth.mockResolvedValue({ refresh_token: 'r', needs_reauth_at: '2026-10-11T06:00:00Z' });
    expect(await bandHasEmailConfigured('b1')).toBe(false);
  });

  it('Gmail marcado pero con IMAP válido sigue contando (el IMAP funciona)', async () => {
    mocks.dbGetBandGmailOAuth.mockResolvedValue({ refresh_token: 'r', needs_reauth_at: '2026-10-11T06:00:00Z' });
    mocks.dbGetBandEmailAccount.mockResolvedValue({ email: 'a@b.es', imap_host: 'imap.b.es' });
    expect(await bandHasEmailConfigured('b1')).toBe(true);
  });
});
