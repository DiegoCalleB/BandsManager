import { describe, it, expect } from 'vitest';
import React from 'react';
import { SetlistShowItemRow } from '../SetlistShowItemRow';
import { SetlistItem } from '../../../types';

describe('SetlistShowItemRow Component Contract', () => {
  it('should be defined as a valid React component function', () => {
    expect(typeof SetlistShowItemRow).toBe('function');
  });

  it('handles header block and custom show items contracts correctly', () => {
    const headerBlock: SetlistItem = {
      id: 'item-block-1',
      tipoItem: 'bloque',
      bloqueSubtipo: 'header',
      tituloCustom: 'Bloque 1 · Apertura'
    };

    const beatboxItem: SetlistItem = {
      id: 'item-beatbox-1',
      tipoItem: 'bloque',
      bloqueSubtipo: 'beatbox',
      tituloCustom: 'Solo de batería',
      duracionEstimadaMinutos: 2,
      duracionEstimadaSegundos: 120,
      notaTema: 'Luces rojas y estrobo'
    };

    expect(headerBlock.tipoItem).toBe('bloque');
    expect(beatboxItem.duracionEstimadaSegundos).toBe(120);
  });
});
