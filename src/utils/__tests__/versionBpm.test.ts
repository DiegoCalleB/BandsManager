import { describe, it, expect } from 'vitest';
import { bpmPorRemedir } from '../versionBpm';

describe('bpmPorRemedir', () => {
  it('sin medir, o medido con el detector antiguo, hay que remedir', () => {
    expect(bpmPorRemedir(undefined)).toBe(true);
    expect(bpmPorRemedir(null)).toBe(true);
    expect(bpmPorRemedir('2026-11-01T16:46:11.783+00:00')).toBe(true);
    expect(bpmPorRemedir('2026-11-01 16:46:11.783+00')).toBe(true); // formato de Postgres
    expect(bpmPorRemedir('fecha rara')).toBe(true);
  });
  it('medido con el detector nuevo, no', () => {
    expect(bpmPorRemedir('2026-11-03T10:30:00.000Z')).toBe(false);
    expect(bpmPorRemedir('2026-12-01T00:00:00Z')).toBe(false);
  });
});
