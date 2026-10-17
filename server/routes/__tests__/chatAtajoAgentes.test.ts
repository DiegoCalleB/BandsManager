/**
 * El atajo de agentes del chat está siempre disponible (ya no hay interruptor): una orden
 * explícita propone la tarjeta de confirmación; una pregunta o una negación, no. Nunca lanza nada
 * por sí mismo: solo propone.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../state.js', () => ({
  loadState: () => ({ leads: [], rehearsals: [], concerts: [], messages: [], payments: [], users: [], registeredBands: [] }),
  getUserFromRequestLocal: () => ({ band_id: 'band-a', role: 'member', bandName: 'Los Test' }),
  getEpkConfigForBand: () => ({}),
  getAutonomyConfigForBand: () => ({ dispatchLevel: 'draft_only', negotiationDepth: 'outreach_only' }),
  requireAuth: (_q: unknown, _s: unknown, n: () => void) => n(),
}));
vi.mock('../../ai.js', () => ({
  getAiClient: () => ({}),
  generateContentWithFallback: async () => ({ text: JSON.stringify({ text: 'respuesta de la IA', proposedActions: [] }), functionCalls: [] }),
}));
vi.mock('../leads.js', () => ({ getGlobalPitchFeedbackSummary: () => ({}), formatGlobalPitchFeedbackForPrompt: () => '' }));
vi.mock('../../db.js', () => ({
  dbGetRegisteredBandById: async () => null,
  dbGetEpkConfig: async () => null,
  dbGetActiveCampaign: async () => null,
  dbGetSongs: async () => [],
  dbGetSetlists: async () => [],
}));

import router from '../chat.js';

async function chatear(message: string, extra: Record<string, unknown> = {}) {
  const capa = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: (...a: unknown[]) => unknown }> } }> })
    .stack.find((s) => s.route?.path === '/chat' && s.route.methods.post);
  const pila = capa!.route!.stack;
  let cuerpo: { text?: string; proposedActions?: Array<{ type: string; agentName?: string }> } = {};
  const res = { status: () => res, json: (b: typeof cuerpo) => ((cuerpo = b), res) };
  await pila[pila.length - 1].handle({ body: { message, ...extra }, headers: {} }, res);
  return cuerpo;
}

describe('chat: atajo de agentes siempre disponible', () => {
  it('una orden explícita propone la tarjeta del agente', async () => {
    const r = await chatear('lanza el scout en Sevilla');
    expect(r.proposedActions?.[0]).toMatchObject({ type: 'propose_agent_trigger', agentName: 'Scout' });
  });

  it('funciona aunque el cliente siga mandando el antiguo agentsEnabled:false', async () => {
    const r = await chatear('lanza el scout en Sevilla', { agentsEnabled: false });
    expect(r.proposedActions?.[0]?.type).toBe('propose_agent_trigger');
  });

  it('una pregunta no lanza el atajo', async () => {
    const r = await chatear('¿cómo funciona el agente scout?');
    expect(r.proposedActions).toEqual([]);
  });

  it('una negación explícita no lo lanza', async () => {
    const r = await chatear('no lances el agente enviador');
    expect(r.proposedActions).toEqual([]);
  });
});
