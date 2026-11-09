import { describe, it, expect } from 'vitest';
import { normalizeCampaignFromDb } from '../campaigns';

describe('alcance de la campaña', () => {
  it('lee «festivales» de la fila de BD', () => {
    expect(normalizeCampaignFromDb({ id: 1, band_id: 'b', alcance: 'festivales' }).alcance).toBe('festivales');
  });
  it('cualquier otro valor o ausencia = campaña de salas de siempre', () => {
    expect(normalizeCampaignFromDb({ id: 1, band_id: 'b' }).alcance).toBe('salas');
    expect(normalizeCampaignFromDb({ id: 1, band_id: 'b', alcance: 'raro' }).alcance).toBe('salas');
  });
});
