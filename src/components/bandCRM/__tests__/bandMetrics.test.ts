import { describe, expect, it } from 'vitest';
import { formatoCompacto } from '../bandMetrics';

describe('formatoCompacto', () => {
  it('keeps small numbers as they are', () => {
    expect(formatoCompacto(0)).toBe('0');
    expect(formatoCompacto(950)).toBe('950');
  });

  it('abbreviates thousands and millions', () => {
    expect(formatoCompacto(1500)).toMatch(/1[.,]?5/);
    expect(formatoCompacto(2_000_000)).toMatch(/2/);
    expect(formatoCompacto(2_000_000).length).toBeLessThan(String(2_000_000).length);
  });
});
