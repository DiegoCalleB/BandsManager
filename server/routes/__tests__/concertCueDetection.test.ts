// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { detectCuesForAudioFile, AudioCueResult } from '../concert_to_album';
import fs from 'fs';
import path from 'path';

describe('detectCuesForAudioFile', () => {
  it('gestiona rutas inexistentes de forma segura sin excepciones', async () => {
    const result = await detectCuesForAudioFile('/ruta/inexistente/tema.mp3');
    expect(result.cueIn).toBe(0);
    expect(result.cueOut).toBe(0);
    expect(result.duration).toBe(0);
    expect(result.confidence).toBe(0);
  });

  it('gestiona entradas vacías o nulas', async () => {
    const result = await detectCuesForAudioFile('');
    expect(result.cueIn).toBe(0);
    expect(result.cueOut).toBe(0);
  });
});
