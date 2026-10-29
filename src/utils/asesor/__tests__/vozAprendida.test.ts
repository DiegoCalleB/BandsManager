import { describe, expect, it } from 'vitest';
import type { Pieza } from '../pieza';
import { bloqueVozAprendida, terminosProhibidosEn, vozAprendidaDe } from '../vozAprendida';

const pieza = (cambios: Partial<Pieza> = {}): Pieza => ({
  formato: 'carrusel', gancho: 'Una noche épica en Leganés', cta: 'Entradas en la bio', portada: '',
  pasos: [{ titulo: 'Abrimos fuerte', detalle: 'El mejor directo del año' }], textos: [{ red: 'instagram', texto: 'Nos vemos el sábado', hashtags: [] }], ...cambios,
});

describe('vozAprendidaDe', () => {
  it('recoge lo aprendido, limpio y acotado, con lo manual primero', () => {
    const v = vozAprendidaDe({
      terminos_a_evitar: ['  épico ', 'ÉPICO', 'increíble', 7, '\u0000'], reglas_manuales: ['Nunca tuteamos a las salas'], reglas_estilo_aprendidas: ['Frases cortas'], vocabulario_aprendido: ['furgo'],
      reglas_por_categoria: { sala: {} },
    });
    expect(v.evitar).toEqual(['épico', 'increíble']);
    expect(v.reglas).toEqual(['Nunca tuteamos a las salas', 'Frases cortas']);
    expect(v.vocabulario).toEqual(['furgo']);
  });

  it('tolera cualquier cosa', () => {
    for (const raro of [null, undefined, 'x', 5, [], { terminos_a_evitar: 'no es lista' }]) {
      expect(vozAprendidaDe(raro)).toEqual({ evitar: [], reglas: [], vocabulario: [] });
    }
    expect(vozAprendidaDe({ terminos_a_evitar: Array.from({ length: 50 }, (_, i) => `t${i}`) }).evitar).toHaveLength(8);
  });
});

describe('bloqueVozAprendida', () => {
  it('va como datos y se omite si no hay nada', () => {
    expect(bloqueVozAprendida({ evitar: [], reglas: [], vocabulario: [] })).toBe('');
    const b = bloqueVozAprendida({ evitar: ['épico'], reglas: ['Frases cortas'], vocabulario: [] });
    expect(b).toContain('<voz>');
    expect(b).toContain('NO quieren oír');
    expect(b).toContain('épico');
  });
});

describe('terminosProhibidosEn', () => {
  it('encuentra palabras enteras sin mirar mayúsculas ni tildes, en cualquier parte de la pieza', () => {
    expect(terminosProhibidosEn(pieza(), ['epica', 'mejor directo', 'cartel'])).toEqual(['epica', 'mejor directo']);
  });

  it('no confunde un término con otra palabra que lo contiene', () => {
    expect(terminosProhibidosEn(pieza({ gancho: 'La epicidad de un bolo' }), ['epic'])).toEqual([]);
  });

  it('un término con símbolos no rompe la comprobación', () => {
    expect(terminosProhibidosEn(pieza(), ['(a+b)*', '[x'])).toEqual([]);
  });
});
