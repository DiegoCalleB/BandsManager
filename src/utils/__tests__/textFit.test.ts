// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { fitStackedNoteSegments, NOTE_FONT_HARD_FLOOR_PX, NoteSegment } from '../textFit';

// Medidor determinista y falso: cada carácter mide `fontSizePx * 0.5` de ancho. No depende de canvas.
const fakeMeasure = (text: string, fontSizePx: number) => text.length * fontSizePx * 0.5;

const baseOpts = {
  maxFontSizePx: 20,
  minFontSizePx: 10,
  fontFamily: 'Caveat',
  measure: fakeMeasure
};

describe('fitStackedNoteSegments', () => {
  it('devuelve vacío si no hay segmentos con texto', () => {
    const result = fitStackedNoteSegments([{ text: '', className: 'a' }], { ...baseOpts, maxWidthPx: 500 });
    expect(result.lines).toEqual([]);
  });

  it('apila cada nota en su propia línea, sin combinarlas', () => {
    const segments: NoteSegment[] = [
      { text: 'nota de fer', className: 'note-member' },
      { text: 'cue de luces', className: 'note-cue' }
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 1000 });
    expect(result.lines.length).toBe(2);
    expect(result.lines[0]).toEqual({ text: 'nota de fer', className: 'note-member', fontSizePx: 20 });
    expect(result.lines[1]).toEqual({ text: 'cue de luces', className: 'note-cue', fontSizePx: 20 });
  });

  it('usa un tamaño de fuente común (el máximo) cuando todas las notas caben de sobra', () => {
    const segments: NoteSegment[] = [
      { text: 'hola', className: 'note-member' },
      { text: 'adios', className: 'note-general' }
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 1000 });
    expect(result.fontSizePx).toBe(20);
  });

  it('encoge el tamaño común antes de partir cualquier nota en dos líneas', () => {
    const segments: NoteSegment[] = [
      { text: 'una nota bastante larga aqui!', className: 'note-member' },
      { text: 'corta', className: 'note-cue' }
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 220 });
    expect(result.fontSizePx).toBeLessThan(20);
    expect(result.fontSizePx).toBeGreaterThanOrEqual(10);
    // Ninguna línea se parte todavía, porque encoger fue suficiente.
    expect(result.lines.length).toBe(2);
  });

  it('encoge SOLO la nota que ni al tamaño mínimo común cabe, sin tocar las demás ni truncarla', () => {
    const segments: NoteSegment[] = [
      { text: 'entrada en el compas ocho con sordina y cambio de afinacion completo del instrumento', className: 'note-member' },
      { text: 'corta', className: 'note-cue' }
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 150 });
    expect(result.fontSizePx).toBe(10);
    // La nota de miembro (larga) se encoge por debajo del tamaño común hasta el suelo absoluto,
    // pero conserva su texto completo — nunca se trunca ni se parte en dos líneas. La de cue
    // (corta) se queda en el tamaño común, sin verse afectada.
    const memberLines = result.lines.filter(l => l.className === 'note-member');
    const cueLines = result.lines.filter(l => l.className === 'note-cue');
    expect(memberLines.length).toBe(1);
    expect(memberLines[0].text).toBe('entrada en el compas ocho con sordina y cambio de afinacion completo del instrumento');
    expect(memberLines[0].fontSizePx).toBe(NOTE_FONT_HARD_FLOOR_PX);
    expect(cueLines.length).toBe(1);
    expect(cueLines[0]).toEqual({ text: 'corta', className: 'note-cue', fontSizePx: 10 });
  });

  it('nunca trunca con "…": una nota que ni en el suelo absoluto cabe conserva su texto íntegro', () => {
    const segments: NoteSegment[] = [
      { text: 'una nota de miembro absurdamente larga que jamas cabria en una sola linea de un repertorio impreso normal', className: 'note-member' }
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 60 });
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].text).toBe(
      'una nota de miembro absurdamente larga que jamas cabria en una sola linea de un repertorio impreso normal'
    );
    expect(result.lines[0].fontSizePx).toBe(NOTE_FONT_HARD_FLOOR_PX);
  });

  it('nunca genera "…" en ninguna línea, ni siquiera a un ancho absurdamente estrecho', () => {
    const segments: NoteSegment[] = [
      { text: 'nota de miembro larga que ocupa bastante sitio en la fila del repertorio', className: 'note-member' },
      { text: 'una nota de bolo tambien bastante larga que ocupa mucho sitio', className: 'note-cue' },
      { text: 'nota general tambien larga que antes se hubiera soltado por prioridad', className: 'note-general' }
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 1 });
    expect(result.lines.every(l => !l.text.includes('…'))).toBe(true);
    expect(result.lines.every(l => l.fontSizePx === NOTE_FONT_HARD_FLOOR_PX)).toBe(true);
  });

  it('nunca genera más de una línea por nota, ni siquiera con notas larguísimas', () => {
    const segments: NoteSegment[] = [
      { text: 'esta nota es tan larga que en el diseño anterior se hubiera partido en dos lineas', className: 'note-member' },
      { text: 'esta otra tambien es bastante larga y tampoco deberia partirse jamas', className: 'note-general' }
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 100 });
    expect(result.lines.length).toBe(2);
  });

  it('no suelta ninguna nota: todas aparecen siempre, cada una en su línea', () => {
    const segments: NoteSegment[] = [
      { text: 'nota de miembro larga que ocupa bastante sitio en la fila del repertorio', className: 'note-member' },
      { text: 'una nota de bolo tambien bastante larga que ocupa mucho sitio', className: 'note-cue' },
      { text: 'nota general tambien larga que antes se hubiera soltado por prioridad', className: 'note-general' }
    ];
    const result = fitStackedNoteSegments(segments, { ...baseOpts, maxWidthPx: 150 });
    const classes = new Set(result.lines.map(l => l.className));
    expect(classes.has('note-member')).toBe(true);
    expect(classes.has('note-cue')).toBe(true);
    expect(classes.has('note-general')).toBe(true);
  });
});
