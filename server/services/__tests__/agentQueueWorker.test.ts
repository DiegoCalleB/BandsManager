import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  completeAgentJob: vi.fn(),
  failAgentJob: vi.fn(),
  runLectorAgent: vi.fn(),
  logAgentExecution: vi.fn(),
  captureError: vi.fn(),
}));

const { EmailAgentErrorFalso } = vi.hoisted(() => ({
  EmailAgentErrorFalso: class extends Error {
    constructor(message: string, public code: string) {
      super(message);
    }
  },
}));

vi.mock('../agentQueueService.js', () => ({
  fetchNextPendingJob: vi.fn(),
  completeAgentJob: mocks.completeAgentJob,
  failAgentJob: mocks.failAgentJob,
  pruneOldJobs: vi.fn(),
  onAgentJobEnqueued: vi.fn(),
}));
vi.mock('../lectorAgent.js', () => ({ runLectorAgent: mocks.runLectorAgent }));
vi.mock('../agentEngine.js', () => ({ runEnviadorAgent: vi.fn(), logAgentExecution: mocks.logAgentExecution }));
vi.mock('../emailAgentClient.js', () => ({ EmailAgentError: EmailAgentErrorFalso }));
vi.mock('../campaignRadarScheduler.js', () => ({ syncActiveCampaignsRadar: vi.fn() }));
vi.mock('../stemPredictionReconciler.js', () => ({ reconcileStaleStemPredictions: vi.fn() }));
vi.mock('../../utils/errorTracking.js', () => ({ captureError: mocks.captureError }));
vi.mock('../agentScheduler.js', () => ({ bandHasEmailConfigured: async () => true }));

import { processSingleJob } from '../agentQueueWorker';

const job = { id: 'job-1', band_id: 'b1', agent_type: 'lector_inbox_check', attempts: 0, max_attempts: 3, payload: {} } as any;

beforeEach(() => vi.clearAllMocks());

describe('processSingleJob', () => {
  it('Gmail revocado (reauth_required): cierra el trabajo sin reintentos ni Sentry y avisa una vez en los logs', async () => {
    mocks.runLectorAgent.mockRejectedValue(new EmailAgentErrorFalso('revocado', 'reauth_required'));
    await processSingleJob(job);

    expect(mocks.failAgentJob).not.toHaveBeenCalled();
    expect(mocks.captureError).not.toHaveBeenCalled();
    expect(mocks.completeAgentJob).toHaveBeenCalledWith('job-1', expect.objectContaining({ skipped: true, reason: 'gmail_reauth_required' }));
    expect(mocks.logAgentExecution).toHaveBeenCalledTimes(1);
    expect(mocks.logAgentExecution.mock.calls[0][0]).toMatchObject({ band_id: 'b1', estado: 'warning' });
    expect(mocks.logAgentExecution.mock.calls[0][0].mensaje).toMatch(/reconect/i);
  });

  it('un fallo normal sigue reintentándose con backoff (failAgentJob)', async () => {
    mocks.runLectorAgent.mockRejectedValue(new Error('boom'));
    await processSingleJob(job);
    expect(mocks.failAgentJob).toHaveBeenCalledWith('job-1', 'boom', 0, 3);
    expect(mocks.completeAgentJob).not.toHaveBeenCalled();
  });
});
