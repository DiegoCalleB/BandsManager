import { describe, it, expect } from 'vitest';
import { EnergyMapCard } from '../EnergyMapCard';
import { SetlistStatsSummaryBar } from '../SetlistStatsSummaryBar';

describe('EnergyMapCard and SetlistStatsSummaryBar Contracts', () => {
  it('exports EnergyMapCard as a valid React component function', () => {
    expect(typeof EnergyMapCard).toBe('function');
  });

  it('exports SetlistStatsSummaryBar as a valid React component function', () => {
    expect(typeof SetlistStatsSummaryBar).toBe('function');
  });
});
