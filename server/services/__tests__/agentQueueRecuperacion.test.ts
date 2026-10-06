import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../db/core.js', () => ({ getSupabase: () => null }));

import { enqueueAgentJob, fetchNextPendingJob, recuperarTrabajosColgados } from '../agentQueueService';

describe('recuperarTrabajosColgados (cola en memoria)', () => {
  beforeEach(() => vi.useRealTimers());

  it('un trabajo bloqueado hace mucho (worker muerto) vuelve a pending y se puede volver a coger', async () => {
    const id = await enqueueAgentJob({ bandId: 'band-x', agentType: 'lector_inbox_check' });
    const job = await fetchNextPendingJob('worker-1');
    expect(job?.id).toBe(id);
    expect(job?.status).toBe('processing');

    // Simula que el worker murió hace 30 minutos.
    job!.locked_until = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    expect(await recuperarTrabajosColgados(true)).toBe(1);
    expect(job!.status).toBe('pending');
    expect(job!.attempts).toBe(1);
  });

  it('un trabajo con bloqueo reciente (agente largo todavía en marcha) NO se toca', async () => {
    await enqueueAgentJob({ bandId: 'band-y', agentType: 'scout_enrichment' });
    const job = await fetchNextPendingJob('worker-1');
    expect(await recuperarTrabajosColgados(true)).toBe(0);
    expect(job!.status).toBe('processing');
  });
});
