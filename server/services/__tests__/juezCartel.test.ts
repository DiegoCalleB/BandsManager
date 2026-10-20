import { describe, it, expect, vi, beforeEach } from 'vitest';

let respuesta: () => Promise<unknown> = async () => ({});
let llamadas = 0;
const generateContent = () => {
  llamadas++;
  return respuesta();
};
vi.mock('../../ai.js', () => ({
  getAiClient: () => ({ models: { generateContent } }),
  GEMINI_MODEL: 'gemini-2.5-flash',
  TIMEOUT_IA_MS: 1000,
  costEurFromTokens: () => 0,
}));
vi.mock('../../db/aiLedger.js', () => ({ dbRecordAiUsage: vi.fn().mockResolvedValue(undefined) }));

import { elegirMejorVariante } from '../juezCartel';

const v = (n: number) => Array.from({ length: n }, () => ({ mimeType: 'image/png', data: 'AAAA' }));

describe('elegirMejorVariante', () => {
  beforeEach(() => {
    llamadas = 0;
  });
  const responde = (r: unknown) => (respuesta = async () => r);

  it('con una sola variante no gasta una llamada', async () => {
    expect((await elegirMejorVariante('b', v(1))).indice).toBe(0);
    expect(llamadas).toBe(0);
  });

  it('devuelve el índice que elige el juez', async () => {
    responde({ text: '{"best": 2}', usageMetadata: {} });
    expect((await elegirMejorVariante('b', v(3))).indice).toBe(2);
  });

  it.each(['{"best": 9}', '{"best": "x"}', 'no es json'])('respuesta inválida (%s) → la primera', async (text) => {
    responde({ text, usageMetadata: {} });
    expect((await elegirMejorVariante('b', v(3))).indice).toBe(0);
  });

  it('si el juez falla, entrega igualmente la primera', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    respuesta = () => Promise.reject(new Error('sin cupo'));
    const elegida = await elegirMejorVariante('b', v(3));
    expect(elegida.indice).toBe(0);
  });

  const textos = { nombre: 'LOS TOROS', fecha: 'SÁB 12 DIC 2026', lugar: 'REVI LIVE · MADRID' };

  it('con textos, la variante bien escrita gana aunque el juez prefiera otra con faltas', async () => {
    responde({ text: '{"best": 0, "text_ok": [false, false, true]}', usageMetadata: {} });
    expect(await elegirMejorVariante('b', v(3), textos)).toEqual({ indice: 2, textoOk: true });
  });

  it('con textos y ninguna bien escrita, avisa de que hay faltas', async () => {
    responde({ text: '{"best": 1, "text_ok": [false, false, false]}', usageMetadata: {} });
    expect(await elegirMejorVariante('b', v(3), textos)).toEqual({ indice: 1, textoOk: false });
  });

  it('con textos, incluso con una sola variante, lee el texto', async () => {
    responde({ text: '{"best": 0, "text_ok": [true]}', usageMetadata: {} });
    expect(await elegirMejorVariante('b', v(1), textos)).toEqual({ indice: 0, textoOk: true });
    expect(llamadas).toBe(1);
  });

  it('si el juez falla con textos, no da el texto por bueno', async () => {
    respuesta = () => Promise.reject(new Error('sin cupo'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await elegirMejorVariante('b', v(2), textos)).textoOk).toBe(false);
  });
});
