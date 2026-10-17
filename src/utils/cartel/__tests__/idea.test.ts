import { describe, it, expect } from 'vitest';
import { CAMPOS_IDEA, EJEMPLOS_IDEA, IDEA_VACIA, MAX_CAMPO_IDEA, camposRellenos, ideaVacia, sanearIdea } from '../idea';

describe('sanearIdea', () => {
  it('no acepta lo que no es un objeto', () => {
    for (const malo of [null, undefined, 'texto', 5, ['a'], true]) expect(sanearIdea(malo)).toBeNull();
  });

  it('devuelve siempre los cinco campos, aunque falten o vengan con otro tipo', () => {
    expect(sanearIdea({})).toEqual(IDEA_VACIA);
    expect(sanearIdea({ escena: 5, colores: ['x'], evitar: null })).toEqual(IDEA_VACIA);
  });

  it('quita caracteres de control, recorta y limita la longitud', () => {
    const r = sanearIdea({ escena: `  una\u0000 guitarra\n con alas  `, ambiente: 'x'.repeat(900) })!;
    expect(r.escena).toBe('una guitarra con alas');
    expect(r.ambiente).toHaveLength(MAX_CAMPO_IDEA);
  });

  it('ignora campos que no son de la idea', () => {
    const r = sanearIdea({ escena: 'a', bandId: 'otra', extra: 'x' })!;
    expect(Object.keys(r).sort()).toEqual(['ambiente', 'colores', 'escena', 'evitar', 'parecido']);
  });
});

describe('ideaVacia y camposRellenos', () => {
  it('cuentan lo rellenado', () => {
    expect(ideaVacia(IDEA_VACIA)).toBe(true);
    expect(camposRellenos(IDEA_VACIA)).toBe(0);
    expect(ideaVacia({ ...IDEA_VACIA, colores: 'rojo' })).toBe(false);
    expect(camposRellenos({ ...IDEA_VACIA, colores: 'rojo', escena: 'a' })).toBe(2);
  });
});

describe('ejemplos', () => {
  it('cada ejemplo está completo y sus textos sobreviven al saneado tal cual', () => {
    expect(EJEMPLOS_IDEA.length).toBeGreaterThanOrEqual(3);
    for (const e of EJEMPLOS_IDEA) {
      expect(camposRellenos(e.idea), e.nombre).toBe(CAMPOS_IDEA.length);
      expect(sanearIdea(e.idea)).toEqual(e.idea);
    }
  });

  it('cada campo del formulario tiene su ejemplo', () => {
    expect(CAMPOS_IDEA.map((c) => c.id).sort()).toEqual(Object.keys(IDEA_VACIA).sort());
    for (const c of CAMPOS_IDEA) expect(c.ejemplo.length).toBeGreaterThan(5);
  });
});
