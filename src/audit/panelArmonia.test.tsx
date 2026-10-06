import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PanelArmonia } from '../components/chords/PanelArmonia';
import { SelectorArmonia } from '../components/chords/SelectorArmonia';
import { analizarArmonia } from '../utils/teoriaArmonica';
import { ESTILO_POR_DEFECTO } from '../utils/estiloArmonia';

const seq = (...a: string[]) => a.map((acorde, i) => ({ t0: i * 2, t1: i * 2 + 2, acorde }));
const armonia = analizarArmonia(seq('E', 'E', 'A', 'D', 'E', 'E', 'A', 'D', 'E', 'E', 'A', 'D'), 'E')!;

describe('PanelArmonia', () => {
  const html = renderToStaticMarkup(<PanelArmonia armonia={armonia} bpm={146} notation="ES" transpose={0} />);

  it('cuenta la tonalidad, el modo y el bucle con datos calculados', () => {
    expect(html).toContain('Mi mayor · mixolidio');
    expect(html).toContain('I – IV – bVII');
    expect(html).toMatch(/rock mixolidio/);
  });

  it('cada acorde lleva su grado, su función y qué tocar encima', () => {
    expect(html).toContain('bVII');
    expect(html).toContain('Color modal');
    expect(html).toContain('Pentatónica');
    expect(html).toMatch(/notas guía/);
  });

  it('el consejo es honesto sobre su origen y no promete más de lo que sabe', () => {
    expect(html).toContain('Basado en los acordes escritos en el cifrado');
    expect(html).toContain('Idea'); // las sugerencias de arreglo van etiquetadas
  });

  it('la transposición cambia los nombres de nota, no los grados', () => {
    const t = renderToStaticMarkup(<PanelArmonia armonia={armonia} notation="EN" transpose={2} />);
    expect(t).toContain('F# mayor'); // E +2
    expect(t).toContain('bVII');
  });

  it('sin bordes y solo tokens de color (ley 1 del sistema de diseño)', () => {
    expect(html).not.toMatch(/\bborder/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});

describe('SelectorArmonia', () => {
  it('ofrece acorde/grado/ambos y color por función, y una leyenda con letra además del color', () => {
    const h = renderToStaticMarkup(<SelectorArmonia estilo={ESTILO_POR_DEFECTO} onCambio={() => {}} presentes={['T', 'S', 'M']} resumen="Mi mayor · mixolidio" />);
    expect(h).toContain('Acorde');
    expect(h).toContain('Grado');
    expect(h).toContain('Ambos');
    expect(h).toContain('Color por función');
    expect(h).toMatch(/>T<\/span><span>Tónica/);
    expect(h).not.toContain('Dominante'); // solo las funciones presentes en la canción
  });
  it('sin color no hay leyenda', () => {
    const h = renderToStaticMarkup(<SelectorArmonia estilo={{ mostrar: 'nombre', colorear: 'nada' }} onCambio={() => {}} presentes={['T']} />);
    expect(h).not.toContain('Leyenda');
  });
});

import { ProfesorIA } from '../components/chords/ProfesorIA';

describe('ProfesorIA', () => {
  const profesor = {
    huella: 'abc', nivel: 'intermedio' as const, instrumento: 'guitarra' as const, generadoEn: 'x', descartadas: 2,
    explicacion: {
      resumen: 'Es rock mixolidio.',
      comoFunciona: [{ texto: 'El D da el color.', hechos: ['a3'] }],
      paraImprovisar: ['Prueba la pentatónica menor de E.'],
      paraComponer: ['Empieza con un riff en E.'],
      dinamismo: [{ idea: 'Sube un tono', ejemplo: 'Pasa a F# en el último estribillo' }],
    },
  };

  it('sin explicación: explica qué hará y qué no, y pide bajo demanda (no gasta hasta pulsar)', () => {
    const h = renderToStaticMarkup(<ProfesorIA onPedir={async () => profesor} />);
    expect(h).toContain('Pedir la explicación del profesor');
    expect(h).toMatch(/solo a los datos calculados/);
  });

  it('con explicación: separa datos de ideas y avisa de lo descartado', () => {
    const h = renderToStaticMarkup(<ProfesorIA profesor={profesor} onPedir={async () => profesor} />);
    expect(h).toContain('Es rock mixolidio.');
    expect(h).toContain('Cómo funciona');
    expect((h.match(/>Idea</g) ?? []).length).toBe(3); // improvisar, componer y dinamismo
    expect(h).toMatch(/Se descartaron 2 frases/);
    expect(h).toContain('Volver a explicar');
    expect(h).not.toMatch(/\bborder/);
  });
});
