import { describe, it, expect, beforeEach } from 'vitest';
import { leerEstiloArmonia, guardarEstiloArmonia, textoDeAcorde, CLASE_FUNCION, ESTILO_POR_DEFECTO } from '../estiloArmonia';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
});

describe('estiloArmonia', () => {
  it('por defecto: nombre y color por función', () => {
    expect(leerEstiloArmonia()).toEqual(ESTILO_POR_DEFECTO);
    expect(ESTILO_POR_DEFECTO).toEqual({ mostrar: 'nombre', colorear: 'funcion', grados: 'simple' });
  });
  it('guarda y recupera, y tolera basura', () => {
    guardarEstiloArmonia({ mostrar: 'ambos', colorear: 'nada', grados: 'simple' });
    expect(leerEstiloArmonia()).toEqual({ mostrar: 'ambos', colorear: 'nada', grados: 'simple' });
    mem.set('bm_estilo_armonia', '{"mostrar":"raro"}');
    expect(leerEstiloArmonia().mostrar).toBe('nombre');
    mem.set('bm_estilo_armonia', 'no es json');
    expect(leerEstiloArmonia()).toEqual(ESTILO_POR_DEFECTO);
  });
  it('sin localStorage no falla', () => {
    (globalThis as any).localStorage = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(leerEstiloArmonia()).toEqual(ESTILO_POR_DEFECTO);
    expect(() => guardarEstiloArmonia(ESTILO_POR_DEFECTO)).not.toThrow();
  });
  it('texto del acorde', () => {
    expect(textoDeAcorde('Am', 'vi', 'nombre')).toEqual({ principal: 'Am' });
    expect(textoDeAcorde('Am', 'vi', 'grado')).toEqual({ principal: 'vi' });
    expect(textoDeAcorde('Am', 'vi', 'ambos')).toEqual({ principal: 'Am', secundario: 'vi' });
    expect(textoDeAcorde('Am', null, 'grado')).toEqual({ principal: 'Am' });
  });
  it('solo tokens del sistema: ni hexadecimales ni escalas de gris vetadas', () => {
    for (const c of Object.values(CLASE_FUNCION)) {
      expect(c).not.toMatch(/#[0-9a-f]{3,8}/i);
      expect(c).not.toMatch(/\b(slate|zinc|stone|gray)-/);
      expect(c).not.toMatch(/\bborder/);
    }
  });
});

describe('gradoVisible', () => {
  it('en modo simple quita b y #, y conserva mayúscula, minúscula y °', async () => {
    const { gradoVisible } = await import('../estiloArmonia');
    expect(gradoVisible('bIII')).toBe('III');
    expect(gradoVisible('bVII7')).toBe('VII7');
    expect(gradoVisible('#iv°')).toBe('iv°');
    expect(gradoVisible('V/bVI')).toBe('V/VI');
    expect(gradoVisible('iii')).toBe('iii');
    expect(gradoVisible('bIII', { grados: 'completo' })).toBe('bIII');
  });
});
