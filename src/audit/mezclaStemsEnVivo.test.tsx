import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const hook = readFileSync(new URL('../hooks/useMezclaStems.ts', import.meta.url), 'utf8');

describe('useMezclaStems con ajustes en vivo', () => {
  it('usa la lógica compartida de volumen y no recrea los audios al cambiar los ajustes', () => {
    expect(hook).toContain("from '../utils/mezclaStems'");
    expect(hook).toContain('volumenEfectivo(p, ajustesRef.current, solo)');
    // El efecto que crea los elementos depende solo de las pistas y la URL, no de los ajustes.
    expect(hook).toContain('[clave, audioUrl, audioRef]');
  });
});
