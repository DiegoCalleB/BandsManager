import { describe, it, expect } from 'vitest';
import { generateTrackingToken, decodeTrackingToken } from '../tracking';

describe('Resend Tracking Tokens and Webhooks', () => {
  it('genera y decodifica correctamente tokens de seguimiento firmados por HMAC', () => {
    const payload = { leadId: 'lead-123', bandId: 'band-456', msgId: 'msg-789' };
    const token = generateTrackingToken(payload);

    expect(typeof token).toBe('string');
    expect(token).toContain('.');

    const decoded = decodeTrackingToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.leadId).toBe('lead-123');
    expect(decoded?.bandId).toBe('band-456');
    expect(decoded?.msgId).toBe('msg-789');
  });

  it('rechaza tokens manipulados o con firma inválida', () => {
    const payload = { leadId: 'lead-123', bandId: 'band-456' };
    const token = generateTrackingToken(payload);
    
    // Corromper la firma
    const parts = token.split('.');
    const tamperedToken = `${parts[0]}.badsignature123`;

    const decoded = decodeTrackingToken(tamperedToken);
    expect(decoded).toBeNull();
  });

  it('retorna null ante tokens con formato inválido o vacíos', () => {
    expect(decodeTrackingToken('')).toBeNull();
    expect(decodeTrackingToken('invalidtoken')).toBeNull();
  });
});
