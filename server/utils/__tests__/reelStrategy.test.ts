import { describe, it, expect } from 'vitest';
import { estrategiaDe, buildEstrategiaBlock, buildReglasDeRedaccion } from '../reelStrategy';
import { TIPOS_CONTENIDO } from '../viralSignals';

describe('estrategiaDe', () => {
  it('da una estrategia distinta para cada tipo de contenido', () => {
    const etiquetas = TIPOS_CONTENIDO.map((t) => estrategiaDe(t).etiqueta);
    expect(new Set(etiquetas).size).toBe(TIPOS_CONTENIDO.length);
  });

  it('cada estrategia trae qué buscar, qué evitar y ejemplos', () => {
    for (const tipo of TIPOS_CONTENIDO) {
      const e = estrategiaDe(tipo);
      expect(e.queBuscar.length).toBeGreaterThan(0);
      expect(e.queEvitar.length).toBeGreaterThan(0);
      expect(e.ejemplosTitulo.length).toBeGreaterThan(0);
    }
  });

  it('un concierto busca la reacción del público; un videoclip busca el estribillo', () => {
    expect(estrategiaDe('concierto').queBuscar.join( ' ')).toMatch(/público/i);
    expect(estrategiaDe('videoclip').queBuscar.join( ' ')).toMatch(/estribillo/i);
  });
});

describe('buildEstrategiaBlock', () => {
  it('incluye la etiqueta, qué buscar y qué evitar', () => {
    const bloque = buildEstrategiaBlock('concierto');
    expect(bloque).toContain('CONCIERTO');
    expect(bloque).toContain('QUÉ BUSCAR');
    expect(bloque).toContain('QUÉ NO ELEGIR');
    expect(bloque).toContain('EJEMPLOS');
  });

  it('cambia de contenido según el tipo', () => {
    expect(buildEstrategiaBlock('concierto')).not.toBe(buildEstrategiaBlock('videoclip'));
  });
});

describe('buildReglasDeRedaccion', () => {
  it('prohíbe explícitamente los comodines vacíos', () => {
    // Es la regla que existe justo para que el modelo deje de escribir "momento épico".
    const reglas = buildReglasDeRedaccion('Ruta 66');
    expect(reglas).toMatch(/momento épico/i);
    expect(reglas).toMatch(/PROHIBIDO/);
  });

  it('menciona a la banda por su nombre real', () => {
    expect(buildReglasDeRedaccion('Lavanda')).toContain('Lavanda');
    expect(buildReglasDeRedaccion('Ruta 66')).toContain('Ruta 66');
  });

  it('exige un límite de palabras para el hookText', () => {
    expect(buildReglasDeRedaccion('X')).toMatch(/6 palabras/);
  });
});
