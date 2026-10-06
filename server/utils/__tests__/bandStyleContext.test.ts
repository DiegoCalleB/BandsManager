// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { buildBandStyleContextBlock } from '../bandStyleContext';

describe('buildBandStyleContextBlock', () => {
  it('devuelve cadena vacía si no hay contexto', () => {
    expect(buildBandStyleContextBlock(null)).toBe('');
    expect(buildBandStyleContextBlock(undefined)).toBe('');
  });

  it('devuelve cadena vacía si el EPK existe pero está sin rellenar', () => {
    expect(buildBandStyleContextBlock({ genero: '', biografia: '  ', dossierTextoExtra: undefined })).toBe('');
  });

  it('incluye solo los campos que sí tienen contenido real', () => {
    const block = buildBandStyleContextBlock({ genero: 'Ska-rock', biografia: '', dossierTextoExtra: undefined });
    expect(block).toContain('Género: Ska-rock');
    expect(block).not.toContain('Biografía:');
    expect(block).not.toContain('Notas de booking');
  });

  it('incluye los tres campos cuando están rellenos', () => {
    const block = buildBandStyleContextBlock({
      genero: 'Ska-rock',
      biografia: 'Banda de mestizaje con sección de metales.',
      dossierTextoExtra: 'Show festivo de 90 minutos con percusión en directo.'
    });
    expect(block).toContain('Género: Ska-rock');
    expect(block).toContain('Biografía: Banda de mestizaje con sección de metales.');
    expect(block).toContain('Notas de booking/estilo: Show festivo de 90 minutos con percusión en directo.');
  });
});
