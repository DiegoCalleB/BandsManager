import { describe, it, expect } from 'vitest';
import { AI_PRICING_TABLE, costEurFromTokens } from '../ai';

/**
 * Tarifas del ledger de IA (aiLedger). Gemini 3.8 Flash: $0.75 / $3.75 por 1M tokens
 * (precio introductorio publicado por Google); ver comentario en AI_PRICING_TABLE.
 */
describe('tarifas de IA del ledger', () => {
  it('Gemini usa la tarifa de 3.8 Flash', () => {
    expect(AI_PRICING_TABLE.gemini.name).toBe('Gemini 3.8 Flash');
    expect(AI_PRICING_TABLE.gemini.inputPer1M).toBe(0.75);
    expect(AI_PRICING_TABLE.gemini.outputPer1M).toBe(3.75);
  });

  it('1M tokens de entrada y 1M de salida cuestan (0,75 + 3,75) USD convertidos a EUR', () => {
    expect(costEurFromTokens('gemini', 1_000_000, 1_000_000)).toBeCloseTo((0.75 + 3.75) / 1.08, 6);
  });

  it('un proveedor desconocido factura como Gemini, nunca a cero', () => {
    expect(costEurFromTokens('otro', 1_000_000, 0)).toBeCloseTo(0.75 / 1.08, 6);
  });

  it('DeepSeek no cambia', () => {
    expect(costEurFromTokens('deepseek', 1_000_000, 1_000_000)).toBeCloseTo((0.14 + 0.28) / 1.08, 6);
  });
});
