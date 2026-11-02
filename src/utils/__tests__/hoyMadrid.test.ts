import { describe, expect, it } from 'vitest';
import { hoyMadrid } from '../hoyMadrid';

describe('hoyMadrid', () => {
  it('después de medianoche en Madrid ya es el día siguiente (invierno, UTC+1)', () => {
    expect(hoyMadrid(new Date('2026-11-01T23:30:00Z'))).toBe('2026-11-02');
  });

  it('después de medianoche en Madrid ya es el día siguiente (verano, UTC+2)', () => {
    expect(hoyMadrid(new Date('2026-07-01T22:30:00Z'))).toBe('2026-07-02');
  });

  it('a mediodía coincide con la fecha UTC', () => {
    expect(hoyMadrid(new Date('2026-11-01T12:00:00Z'))).toBe('2026-11-01');
  });
});
