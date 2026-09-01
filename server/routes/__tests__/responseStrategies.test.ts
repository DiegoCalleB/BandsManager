import { describe, it, expect } from 'vitest';
import { validateResponseStrategies, VALID_RESPONSE_TYPES, VALID_TONES } from '../bands/responseStrategies.js';

// Estos tests ejercitan la validación REAL del router (validateResponseStrategies), no una copia
// aparte de las listas de tipos/tonos válidos - antes este archivo redeclaraba esas listas a
// mano y las probaba a ellas, así que un cambio real en responseStrategies.ts podía desincronizar
// la validación sin que ningún test se enterara.
describe('validateResponseStrategies', () => {
  it('acepta un objeto vacío', () => {
    expect(validateResponseStrategies({})).toEqual({ ok: true });
  });

  it('acepta una estrategia válida completa', () => {
    const result = validateResponseStrategies({
      price_negotiation: { guidancePrompt: 'Sé flexible', tone: 'neutral', mentionLinks: false }
    });
    expect(result).toEqual({ ok: true });
  });

  it('rechaza un formato que no sea objeto', () => {
    expect(validateResponseStrategies(null)).toEqual({ ok: false, error: 'Invalid strategies format' });
    expect(validateResponseStrategies('texto')).toEqual({ ok: false, error: 'Invalid strategies format' });
    expect(validateResponseStrategies(undefined)).toEqual({ ok: false, error: 'Invalid strategies format' });
  });

  it('rechaza una clave de tipo de respuesta que no sea válida', () => {
    const result = validateResponseStrategies({ tipo_inventado: { guidancePrompt: 'x' } });
    expect(result).toEqual({ ok: false, error: 'Invalid response type: tipo_inventado' });
  });

  it('rechaza un tono que no sea válido', () => {
    const result = validateResponseStrategies({ confirmation: { tone: 'agresivo' } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Invalid tone');
  });

  it('rechaza guidancePrompt que no sea string', () => {
    const result = validateResponseStrategies({ rejection: { guidancePrompt: 123 as any } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('guidancePrompt must be string');
  });

  it('rechaza mentionLinks que no sea boolean', () => {
    const result = validateResponseStrategies({ follow_up: { mentionLinks: 'sí' as any } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('mentionLinks must be boolean');
  });

  it('acepta todos los VALID_RESPONSE_TYPES declarados', () => {
    for (const type of VALID_RESPONSE_TYPES) {
      const result = validateResponseStrategies({ [type]: { guidancePrompt: 'ok' } });
      expect(result).toEqual({ ok: true });
    }
  });

  it('acepta todos los VALID_TONES declarados', () => {
    for (const tone of VALID_TONES) {
      const result = validateResponseStrategies({ confirmation: { tone } });
      expect(result).toEqual({ ok: true });
    }
  });
});
