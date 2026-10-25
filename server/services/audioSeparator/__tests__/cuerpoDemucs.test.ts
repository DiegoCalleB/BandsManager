import { describe, expect, it } from 'vitest';
import { cuerpoDemucs } from '../FalAiService';

describe('cuerpoDemucs', () => {
  it('pide los 6 stems con más calidad que los valores por defecto de Fal', () => {
    expect(cuerpoDemucs('https://x/a.mp3')).toEqual({ audio_url: 'https://x/a.mp3', model: 'htdemucs_6s', shifts: 2, overlap: 0.5 });
  });
});
