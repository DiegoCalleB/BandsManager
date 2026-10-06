import { describe, it, expect } from 'vitest';
import { fitStackedNoteSegments, NoteSegment } from '../textFit';

// Medidor determinista y falso: cada carácter mide `fontSizePx * 0.5` de ancho. No depende de canvas.
const fakeMeasure = (text: string, fontSizePx: number) => text.length * fontSizePx * 0.5;

const baseOpts = {
  maxFontSizePx: 20,
  minFontSizePx: 10,
  fontFamily: 'Caveat',
  measure: fakeMeasure,
};

describe('fitStackedNoteSegments', () => {
  it('devuelve vacío si no hay segmentos con texto', () => {
    const result = fitStackedNoteSegments([{ text: '', className: 'a' }], { ...baseOpts, maxWidthPx: 500 });
    expect(result.lines).toEqual([]);
  });

  it('apila cada nota en su propia línea, sin combinarlas', () => {
    const segments: NoteSegment[] = [
      { text: 'nota de fer', className: 'note-member' },
      { text: 'cue de luces', className: 'note-cue' },
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 1000 });
    expect(result.lines.length).toBe(2);
    expect(result.lines[0]).toEqual({ text: 'nota de fer', className: 'note-member', fontSizePx: 20 });
    expect(result.lines[1]).toEqual({ text: 'cue de luces', className: 'note-cue', fontSizePx: 20 });
  });

  it('cada nota lleva su propio tamaño: una general larga no arrastra a la del músico', () => {
    const segments: NoteSegment[] = [
      { text: 'nota de fer', className: 'note-member' },
      { text: 'una nota general larguisima que obliga a encoger bastante para caber', className: 'note-general' },
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 240 });
    const member = result.lines.find((l) => l.className === 'note-member')!;
    const general = result.lines.find((l) => l.className === 'note-general')!;
    expect(member.fontSizePx).toBe(20);
    expect(general.fontSizePx).toBeLessThan(member.fontSizePx);
  });

  it('una nota secundaria (maxScale) nunca pasa de su fracción del tamaño máximo', () => {
    const segments: NoteSegment[] = [
      { text: 'ok', className: 'note-general', maxScale: 0.5 },
      { text: 'ok', className: 'note-member' },
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 1000 });
    expect(result.lines[0].fontSizePx).toBe(10);
    expect(result.lines[1].fontSizePx).toBe(20);
  });

  it('el tamaño de referencia es el de la nota más grande', () => {
    const segments: NoteSegment[] = [
      { text: 'corta', className: 'note-member' },
      { text: 'una nota general larguisima que obliga a encoger bastante para caber', className: 'note-general' },
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 240 });
    expect(result.fontSizePx).toBe(20);
  });

  it('nunca baja del tamaño mínimo legible: lo que no cabe conserva el texto y se queda en el mínimo', () => {
    const text = 'una nota de miembro absurdamente larga que jamas cabria en una sola linea de un repertorio impreso normal';
    const result = fitStackedNoteSegments([{ text, className: 'note-member' }], { ...baseOpts, maxWidthPx: 60 });
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].text).toBe(text);
    expect(result.lines[0].fontSizePx).toBe(baseOpts.minFontSizePx);
  });

  it('nunca trunca con "…" ni suelta ninguna nota, ni a un ancho absurdamente estrecho', () => {
    const segments: NoteSegment[] = [
      { text: 'nota de miembro larga que ocupa bastante sitio en la fila del repertorio', className: 'note-member' },
      { text: 'una nota de bolo tambien bastante larga que ocupa mucho sitio', className: 'note-cue' },
      { text: 'nota general tambien larga que antes se hubiera soltado por prioridad', className: 'note-general' },
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 1 });
    expect(result.lines).toHaveLength(3);
    expect(result.lines.every((l) => !l.text.includes('…'))).toBe(true);
    expect(result.lines.every((l) => l.fontSizePx === baseOpts.minFontSizePx)).toBe(true);
  });

  it('una nota por segmento, siempre', () => {
    const segments: NoteSegment[] = [
      { text: 'esta nota es tan larga que en el diseño anterior se hubiera partido en dos lineas', className: 'note-member' },
      { text: 'esta otra tambien es bastante larga y tampoco deberia partirse jamas', className: 'note-general' },
    ];
    expect(fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 100 }).lines).toHaveLength(2);
  });
});
