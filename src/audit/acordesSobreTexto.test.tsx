import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderFormattedChordSheet } from '../components/SongChordsViewerModal';

const html = (texto: string, sync?: any) => renderToStaticMarkup(<div>{renderFormattedChordSheet(texto, undefined, sync)}</div>);

describe('cifrado con los acordes ENCIMA de la letra', () => {
  it('cada acorde va en una fila superior y el texto en la inferior de su columna', () => {
    const h = html('[Am]la [F]casa');
    // columna = fila de acorde (h-5) + fila de texto
    expect(h).toMatch(/inline-flex flex-col[^>]*><span class="h-7 leading-7 mr-0.5"><span[^>]*>Am<\/span><\/span><span[^>]*>la<\/span>/);
    expect(h).toMatch(/<span class="h-7 leading-7 mr-0.5"><span[^>]*>F<\/span><\/span><span[^>]*>casa<\/span>/);
  });

  it('un acorde a mitad de palabra parte la palabra sin meter espacios: «imagi» + acorde + «nación»', () => {
    const h = html('la imagi[F]nación vuela');
    const palabra = h.match(/<span class="inline-block whitespace-nowrap align-bottom">((?:(?!<span class="inline-block).)*?nación.*?)<\/span><\/span><\/span>/);
    expect(palabra).not.toBeNull();
    expect(h.replace(/<[^>]+>/g, '')).toContain('imagi');
    // el texto sin etiquetas es la letra sin acordes (con un hueco nbsp por columna sin texto)
    expect(h.replace(/<[^>]+>/g, '').replace(/ /g, '').replace('F', '')).toContain('imaginación');
  });

  it('las palabras se separan con espacios normales para que la línea se ajuste sola al ancho', () => {
    const h = html('[Am]uno dos [G]tres');
    // entre unidad y unidad hay un espacio normal (no nbsp): ahí es donde el navegador puede saltar de línea
    expect(h).toContain('</span> <span class="inline-block whitespace-nowrap align-bottom">');
  });

  it('el orden de los acordes sigue siendo el del texto (resaltado sincronizado)', () => {
    const sync = {
      pares: [{ texto: 0, segmento: 0, coincide: true }, { texto: 1, segmento: 1, coincide: true }],
      tiempos: [0, 2],
      activo: 1,
      audioRef: { current: null },
      duracion: 10,
      onSeek: () => {},
    };
    const h = html('[Am]uno [F]dos', sync);
    expect(h.indexOf('id="cifrado-acorde-0"')).toBeLessThan(h.indexOf('id="cifrado-acorde-1"'));
    expect(h).toMatch(/id="cifrado-acorde-1"[^>]*class="[^"]*bg-\[var\(--surface\)\]/);
  });
});

describe('reloj en cada acorde de la letra', () => {
  const sync = {
    pares: [{ texto: 0, segmento: 0, coincide: true }, { texto: 1, segmento: 1, coincide: true }],
    tiempos: [0, 2],
    activo: 0,
    audioRef: { current: null },
    duracion: 10,
    onSeek: () => {},
  };

  it('cada acorde sincronizado va envuelto en su reloj con el mismo relleno, esté activo o no (la letra no se desplaza)', () => {
    const h = html('[Am]uno [F]dos', sync);
    expect((h.match(/<span class="inline-flex rounded-\[var\(--r-s\)\] p-\[3px\] align-bottom"/g) ?? []).length).toBe(2);
    expect(h).toContain('data-reloj="activo"');
    expect((h.match(/data-reloj="activo"/g) ?? []).length).toBe(1);
  });
});
