import { describe, it, expect } from 'vitest';
import { numeroFinito, textoNoVacio, listaDeTextos, unoDe } from '../valoresIA.js';

describe('valoresIA: validación de campos devueltos por un LLM', () => {
  it('numeroFinito rechaza texto, NaN y nulos', () => {
    expect(numeroFinito(3.5)).toBe(3.5);
    expect(numeroFinito('3')).toBeUndefined();
    expect(numeroFinito(NaN)).toBeUndefined();
    expect(numeroFinito(null)).toBeUndefined();
  });
  it('textoNoVacio rechaza vacíos y no-strings', () => {
    expect(textoNoVacio('Am')).toBe('Am');
    expect(textoNoVacio('  ')).toBeUndefined();
    expect(textoNoVacio({})).toBeUndefined();
  });
  it('listaDeTextos filtra elementos que no son texto', () => {
    expect(listaDeTextos(['a', 1, '', 'b'])).toEqual(['a', 'b']);
    expect(listaDeTextos([1, 2])).toBeUndefined();
    expect(listaDeTextos('a')).toBeUndefined();
  });
  it('unoDe solo acepta valores permitidos', () => {
    expect(unoDe('alta', ['alta', 'baja'] as const)).toBe('alta');
    expect(unoDe('false', ['alta', 'baja'] as const)).toBeUndefined();
  });
});
