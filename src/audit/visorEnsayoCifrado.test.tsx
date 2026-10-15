import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const leer = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('Visor del ensayo en vivo', () => {
  it('pinta el cifrado con el renderizador del Atril, sin HTML inyectado', () => {
    const src = leer('../components/ensayos/ModoLocalEnVivoTab.tsx');
    expect(src).toContain('renderFormattedChordSheet(processChordText(rawChordText, transpose, notation))');
    expect(src).not.toContain('renderFormattedChords(');
    expect(src).not.toContain('dangerouslySetInnerHTML');
  });
});
