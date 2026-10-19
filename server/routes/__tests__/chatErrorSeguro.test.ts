/**
 * Cuando falla la IA, el chat contesta con un texto de disculpa (HTTP 200). Ese texto no debe llevar
 * el mensaje interno del proveedor (rutas, ids de proyecto, trozos de la petición): va al log con un
 * código y a la persona solo se le da ese código.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const SECRETO = 'projects/proyecto-secreto-123/locations/europe: clave AIzaSyFAKE rechazada';
let modo: 'fallo-proveedor' | 'fallo-quota' = 'fallo-proveedor';

vi.mock('../../state.js', () => ({
  loadState: () => ({ leads: [], rehearsals: [], concerts: [], messages: [], payments: [], users: [], registeredBands: [] }),
  getUserFromRequestLocal: () => ({ band_id: 'band-a', role: 'leader', bandName: 'Los Test' }),
  getEpkConfigForBand: () => ({}),
  getAutonomyConfigForBand: () => ({ dispatchLevel: 'draft_only', negotiationDepth: 'outreach_only' }),
  requireAuth: (_q: unknown, _s: unknown, n: () => void) => n(),
}));
vi.mock('../../ai.js', () => ({
  getAiClient: () => ({}),
  generateContentWithFallback: async () => {
    const err = new Error(modo === 'fallo-quota' ? `429 quota exceeded ${SECRETO}` : SECRETO) as Error & { deepSeekError?: Error };
    err.deepSeekError = new Error(`otro fallo interno ${SECRETO}`);
    throw err;
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
  dbGetPayments: async () => [],
}));
vi.mock('../../utils/errorTracking.js', () => ({ captureError: vi.fn() }));

import router from '../chat.js';

type Pila = Array<{ name: string; handle: (...a: unknown[]) => unknown }>;
const manejador = (): Pila[number] => {
  const capa = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean>; stack: Pila } }> })
    .stack.find((s) => s.route?.path === '/chat' && s.route.methods.post);
  const pila = capa!.route!.stack;
  return pila[pila.length - 1];
};

async function llamarChat(message: string) {
  const res: { codigo: number; cuerpo: { text?: string } | undefined; status: (c: number) => typeof res; json: (b: { text?: string }) => typeof res } = {
    codigo: 200,
    cuerpo: undefined,
    status(c) { res.codigo = c; return res; },
    json(b) { res.cuerpo = b; return res; },
  };
  await manejador().handle({ body: { message }, headers: {}, method: 'POST', originalUrl: '/api/chat' }, res);
  return res;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('chat: errores de la IA sin filtrar detalles internos', () => {
  it('con un fallo cualquiera del proveedor no enseña su mensaje y da un código de error', async () => {
    modo = 'fallo-proveedor';
    const r = await llamarChat('hola');
    expect(r.cuerpo?.text).toBeTruthy();
    expect(r.cuerpo!.text).not.toContain('proyecto-secreto-123');
    expect(r.cuerpo!.text).not.toContain('AIzaSy');
    expect(r.cuerpo!.text).toMatch(/Código de error: [0-9a-f]{8}/);
  });

  it('con la cuota agotada explica qué pasa pero tampoco enseña el mensaje interno', async () => {
    modo = 'fallo-quota';
    const r = await llamarChat('hola');
    expect(r.cuerpo!.text).toContain('Servicio de Inteligencia Artificial');
    expect(r.cuerpo!.text).not.toContain('proyecto-secreto-123');
    expect(r.cuerpo!.text).not.toContain('otro fallo interno');
    expect(r.cuerpo!.text).toMatch(/Código de error: [0-9a-f]{8}/);
  });

  it('registra el detalle en el log con ese mismo código', async () => {
    modo = 'fallo-proveedor';
    const r = await llamarChat('hola');
    const codigo = r.cuerpo!.text!.match(/Código de error: ([0-9a-f]{8})/)![1];
    const llamadas = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(llamadas.some((c) => String(c[0]).includes('idError=%s') && c[1] === codigo)).toBe(true);
  });
});
