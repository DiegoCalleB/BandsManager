import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  lead: { id: 'l1', band_id: 'band-a', nombre_sala: 'Sala X', ciudad: 'Madrid', tipo: 'sala', pitch_generado: 'viejo' } as Record<string, unknown>,
  generateUnifiedAI: vi.fn(),
}));

vi.mock('../../state.js', async (orig) => ({
  ...(await orig<typeof import('../../state.js')>()),
  loadState: () => ({ leads: [h.lead], concerts: [] }),
  saveState: vi.fn(),
}));
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<typeof import('../../db.js')>()),
  dbUpsertLead: vi.fn().mockResolvedValue(undefined),
  dbRecordCampaignPitchTraining: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../db/pitchLearning.js', async (orig) => ({
  ...(await orig<typeof import('../../db/pitchLearning.js')>()),
  dbRecordPitchHumanEdit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../ai.js', async (orig) => ({
  ...(await orig<typeof import('../../ai.js')>()),
  generateUnifiedAI: h.generateUnifiedAI,
}));
vi.mock('../pitchJudge.js', () => ({
  evaluateAndRefinePitch: vi.fn(async ({ pitchText }: { pitchText: string }) => ({
    audit: { antiAiScore: 90 }, refinedText: pitchText,
  })),
}));

import { PitchEngine } from '../pitchEngine.js';

const contexto = {
  bandDna: { bandName: 'Banda A' }, systemPrompt: 's', userPrompt: 'u',
  tourContext: null, feedbackDetails: [], links: { spotify: '', youtube: '', epk: '' }, contactEmail: 'a@b.c',
};

describe('PitchEngine.regeneratePitch: marca cuándo el texto NO lo escribió la IA', () => {
  beforeEach(() => {
    vi.spyOn(PitchEngine, 'compileContext').mockResolvedValue(contexto as never);
    h.generateUnifiedAI.mockReset();
  });

  it('texto de Gemini: simulated = false', async () => {
    h.generateUnifiedAI.mockResolvedValue({ text: 'Hola, os escribimos desde Banda A.', provider: 'gemini', modelName: 'gemini-3.8-flash' });
    const r = await PitchEngine.regeneratePitch({ leadId: 'l1', userBandId: 'band-a' });
    expect(r.simulated).toBe(false);
  });

  it('plantilla del generador local (provider local_agent): simulated = true', async () => {
    h.generateUnifiedAI.mockResolvedValue({ text: 'Hola, equipo de Sala X: plantilla.', provider: 'local_agent', modelName: 'Redactor Experto (Modo Local Seguro)' });
    const r = await PitchEngine.regeneratePitch({ leadId: 'l1', userBandId: 'band-a' });
    expect(r.simulated).toBe(true);
  });

  it('si la IA lanza error, sigue siendo simulated = true', async () => {
    h.generateUnifiedAI.mockRejectedValue(new Error('todo caído'));
    const r = await PitchEngine.regeneratePitch({ leadId: 'l1', userBandId: 'band-a' });
    expect(r.simulated).toBe(true);
  });
});
