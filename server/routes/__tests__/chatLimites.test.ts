/**
 * Coste del chat: la ruta debe tener limitador propio, rechazar mensajes inválidos, acotar el
 * historial, pedir un tope de tokens de salida y atribuir la llamada a la banda.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface LlamadaIA {
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  bandId?: string;
  config: { maxOutputTokens?: number };
}
const llamadas: LlamadaIA[] = [];

vi.mock('../../state.js', () => ({
  loadState: () => ({ leads: [], rehearsals: [], concerts: [], messages: [], payments: [], users: [], registeredBands: [] }),
  getUserFromRequestLocal: () => ({ band_id: 'band-a', role: 'leader', bandName: 'Los Test' }),
  getEpkConfigForBand: () => ({}),
  getAutonomyConfigForBand: () => ({ dispatchLevel: 'draft_only', negotiationDepth: 'outreach_only' }),
  requireAuth: (_q: unknown, _s: unknown, n: () => void) => n(),
}));
vi.mock('../../ai.js', () => ({
  getAiClient: () => ({}),
  generateContentWithFallback: async (_c: unknown, opts: LlamadaIA) => {
    llamadas.push(opts);
    return { text: JSON.stringify({ text: 'ok', proposedActions: [] }), functionCalls: [] };
  },
}));
vi.mock('../leads.js', () => ({
  getGlobalPitchFeedbackSummary: () => ({}),
  formatGlobalPitchFeedbackForPrompt: () => '',
}));
vi.mock('../../db.js', () => ({
  dbGetRegisteredBandById: async () => null,
  dbGetEpkConfig: async () => null,
  dbGetActiveCampaign: async () => null,
  dbGetSongs: async () => [],
  dbGetSetlists: async () => [],
  dbGetTours: async () => [],
  dbContarFans: async () => 0,
}));

import router from '../chat.js';
import { MAX_CARACTERES_MENSAJE, MAX_TOKENS_RESPUESTA_CHAT, MAX_TURNOS_HISTORIAL } from '../../utils/conversacionChat.js';

type Pila = Array<{ name: string; handle: (...a: unknown[]) => unknown }>;
const pilaDeChat = (): Pila => {
  const capa = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean>; stack: Pila } }> })
    .stack.find((s) => s.route?.path === '/chat' && s.route.methods.post);
  return capa!.route!.stack;
};

async function llamarChat(body: Record<string, unknown>) {
  const pila = pilaDeChat();
  const res: { codigo: number; cuerpo: unknown; status: (c: number) => typeof res; json: (b: unknown) => typeof res } = {
    codigo: 200,
    cuerpo: undefined,
    status(c) { res.codigo = c; return res; },
    json(b) { res.cuerpo = b; return res; },
  };
  await pila[pila.length - 1].handle({ body, headers: {} }, res);
  return res;
}

beforeEach(() => {
  llamadas.length = 0;
});

describe('chat: coste', () => {
  it('lleva un limitador por usuario delante del manejador', () => {
    expect(pilaDeChat().map((h) => h.name)).toContain('rateLimiter');
  });

  it('rechaza con 400, sin llamar al modelo, un mensaje que no es cadena o es demasiado largo', async () => {
    for (const message of [undefined, 42, ['hola'], { a: 1 }, 'x'.repeat(MAX_CARACTERES_MENSAJE + 1)]) {
      const r = await llamarChat({ message });
      expect(r.codigo).toBe(400);
    }
    expect(llamadas).toHaveLength(0);
  });

  // El último turno lleva delante los datos de la banda (chatPrompt.ts); lo que escribió el usuario va tras esta marca.
  const soloMensaje = (texto?: string) => (texto ?? '').split('MENSAJE DEL USUARIO:\n').pop();

  it('acota el historial a los últimos turnos', async () => {
    const chatHistory = Array.from({ length: 200 }, (_, i) => ({ sender: i % 2 ? 'bot' : 'user', text: `turno ${i}` }));
    const r = await llamarChat({ message: 'hola', chatHistory });
    expect(r.codigo).toBe(200);
    const enviados = llamadas[0].contents.flatMap((c) => c.parts.map((p) => p.text));
    expect(enviados.length).toBeLessThanOrEqual(MAX_TURNOS_HISTORIAL + 1);
    expect(soloMensaje(enviados[enviados.length - 1])).toBe('hola');
    expect(enviados).not.toContain('turno 0');
  });

  it('un historial que no es una lista ya no tumba la ruta', async () => {
    const r = await llamarChat({ message: 'hola', chatHistory: 'esto no es una lista' });
    expect(r.codigo).toBe(200);
    expect(llamadas[0].contents).toHaveLength(1);
    expect(llamadas[0].contents[0].role).toBe('user');
    expect(soloMensaje(llamadas[0].contents[0].parts[0].text)).toBe('hola');
  });

  it('pide un tope de tokens de salida y atribuye la llamada a la banda', async () => {
    await llamarChat({ message: 'hola' });
    expect(llamadas[0].config.maxOutputTokens).toBe(MAX_TOKENS_RESPUESTA_CHAT);
    expect(llamadas[0].bandId).toBe('band-a');
  });

  it('mantiene los roles alternados aunque el historial empiece por el modelo', async () => {
    await llamarChat({
      message: 'tercera',
      chatHistory: [
        { sender: 'bot', text: 'saludo del bot' },
        { sender: 'user', text: 'primera' },
        { sender: 'user', text: 'segunda' },
      ],
    });
    expect(llamadas[0].contents).toHaveLength(1);
    const [turno] = llamadas[0].contents;
    expect(turno.role).toBe('user');
    expect(turno.parts.map((p) => soloMensaje(p.text))).toEqual(['primera', 'segunda', 'tercera']);
  });
});
