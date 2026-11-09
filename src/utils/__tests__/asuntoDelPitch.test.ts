import { describe, expect, it } from 'vitest';
import { separarAsunto } from '../asuntoDelPitch';

describe('separarAsunto', () => {
  it('saca el asunto de la primera línea y deja el cuerpo limpio', () => {
    expect(separarAsunto('Asunto: Black Friday: Los Ejemplos\n\nBuenas gente,\n\n¡Un abrazo!')).toEqual({
      asunto: 'Black Friday: Los Ejemplos',
      cuerpo: 'Buenas gente,\n\n¡Un abrazo!',
    });
  });

  it('sin línea de asunto devuelve el texto tal cual', () => {
    expect(separarAsunto('Buenas gente,\n\nHola')).toEqual({ asunto: '', cuerpo: 'Buenas gente,\n\nHola' });
  });

  it('solo cuenta la primera línea y ignora mayúsculas y espacios', () => {
    expect(separarAsunto('  asunto :   Hola  \nCuerpo').asunto).toBe('Hola');
    expect(separarAsunto('Hola\nAsunto: no es el primero').asunto).toBe('');
  });

  it('un asunto vacío no cuenta y el valor nulo no rompe', () => {
    expect(separarAsunto('Asunto:\n\nCuerpo').asunto).toBe('');
    expect(separarAsunto(undefined)).toEqual({ asunto: '', cuerpo: '' });
  });

  it('recorta el asunto a una longitud razonable y le quita saltos de línea', () => {
    expect(separarAsunto(`Asunto: ${'a'.repeat(400)}\n\nx`).asunto.length).toBeLessThanOrEqual(200);
  });
});
