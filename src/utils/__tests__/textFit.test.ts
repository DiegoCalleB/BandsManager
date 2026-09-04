import { describe, it, expect } from 'vitest';
import { fitNoteSegments, NoteSegment } from '../textFit';

// Medidor determinista y falso: cada carácter mide `fontSizePx * 0.5` de ancho. No depende de canvas.
const fakeMeasure = (text: string, fontSizePx: number) => text.length * fontSizePx * 0.5;

const baseOpts = {
  maxFontSizePx: 20,
  minFontSizePx: 10,
  fontFamily: 'Caveat',
  measure: fakeMeasure
};

describe('fitNoteSegments', () => {
  it('devuelve vacío si no hay segmentos con texto', () => {
    const result = fitNoteSegments([{ text: '', className: 'a' }], { ...baseOpts, maxWidthPx: 500 });
    expect(result.lineOneSegments).toEqual([]);
    expect(result.wrapped).toBe(false);
  });

  it('usa el tamaño máximo cuando el texto cabe de sobra', () => {
    const segments: NoteSegment[] = [{ text: 'hola', className: 'note-member' }];
    const result = fitNoteSegments(segments, { ...baseOpts, maxWidthPx: 1000 });
    expect(result.fontSizePx).toBe(20);
    expect(result.wrapped).toBe(false);
    expect(result.lineOneSegments).toEqual(segments);
  });

  it('encoge la fuente antes de partir en dos líneas', () => {
    // A 20px, "hola mundo desde el escenario" (30 chars) mide 300px; con maxWidthPx=200 no cabe
    // a 20px pero sí a un tamaño menor sin necesidad de partir línea.
    const segments: NoteSegment[] = [{ text: 'hola mundo desde el escenario', className: 'note-member' }];
    const result = fitNoteSegments(segments, { ...baseOpts, maxWidthPx: 200 });
    expect(result.wrapped).toBe(false);
    expect(result.fontSizePx).toBeLessThan(20);
    expect(result.fontSizePx).toBeGreaterThanOrEqual(10);
  });

  it('parte en dos líneas antes de soltar un segmento, cuando ni encogiendo cabe en una línea', () => {
    const segments: NoteSegment[] = [
      { text: 'entrada en el compas ocho con sordina y cambio de afinacion completo', className: 'note-member' },
      { text: 'cue de luces', className: 'note-cue' }
    ];
    const result = fitNoteSegments(segments, { ...baseOpts, maxWidthPx: 220 });
    expect(result.wrapped).toBe(true);
    expect(result.fontSizePx).toBe(10);
    expect(result.lineOneSegments.length).toBe(1);
    expect(result.lineTwoSegments.length).toBe(1);
  });

  it('suelta el segmento de menor prioridad (el último) cuando ni en dos líneas cabe todo', () => {
    const segments: NoteSegment[] = [
      { text: 'nota de miembro corta', className: 'note-member' },
      { text: 'una nota de bolo bastante larga que ocupa mucho sitio en la fila', className: 'note-cue' },
      { text: 'nota general tambien larga que no deberia caber junto a las otras dos', className: 'note-general' }
    ];
    const result = fitNoteSegments(segments, { ...baseOpts, maxWidthPx: 150 });
    // Solo debe sobrevivir contenido del segmento de mayor prioridad (note-member), el resto se soltó.
    const survivingClasses = new Set([...result.lineOneSegments, ...result.lineTwoSegments].map(s => s.className));
    expect(survivingClasses.has('note-general')).toBe(false);
  });

  it('trunca con "…" solo como último recurso, cuando incluso el único segmento restante no cabe', () => {
    const segments: NoteSegment[] = [
      { text: 'una nota de miembro absurdamente larga que jamas cabria en una fila normal de un repertorio impreso', className: 'note-member' }
    ];
    const result = fitNoteSegments(segments, { ...baseOpts, maxWidthPx: 60 });
    expect(result.lineOneSegments.length).toBe(1);
    expect(result.lineOneSegments[0].text.endsWith('…')).toBe(true);
    expect(result.lineTwoSegments).toEqual([]);
  });

  it('nunca corta un segmento a la mitad salvo en el caso de truncado final', () => {
    const segments: NoteSegment[] = [
      { text: 'miembro', className: 'note-member' },
      { text: 'bolo', className: 'note-cue' }
    ];
    const result = fitNoteSegments(segments, { ...baseOpts, maxWidthPx: 1000 });
    expect(result.lineOneSegments.map(s => s.text)).toEqual(['miembro', 'bolo']);
  });
});
