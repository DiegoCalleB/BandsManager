import { describe, expect, it } from 'vitest';
import { seccionDesdeEtiqueta } from '../seccionIdea';

describe('seccionDesdeEtiqueta (compositor IA)', () => {
  it('las etiquetas simples pasan a su sección', () => {
    expect(seccionDesdeEtiqueta('Intro')).toBe('intro');
    expect(seccionDesdeEtiqueta('Verso')).toBe('verso');
    expect(seccionDesdeEtiqueta('Estribillo')).toBe('estribillo');
    expect(seccionDesdeEtiqueta('Puente')).toBe('puente');
    expect(seccionDesdeEtiqueta('Outro')).toBe('outro');
    expect(seccionDesdeEtiqueta('General')).toBe('general');
  });

  it('«Solo / Instrumental» y «Pre-estribillo» dan secciones válidas (antes solo-/-instrumental y pre-estribillo)', () => {
    expect(seccionDesdeEtiqueta('Solo / Instrumental')).toBe('solo');
    expect(seccionDesdeEtiqueta('Pre-estribillo')).toBe('estribillo');
  });

  it('lo desconocido cae en general', () => {
    expect(seccionDesdeEtiqueta('Coda rara')).toBe('general');
    expect(seccionDesdeEtiqueta('')).toBe('general');
  });
});
