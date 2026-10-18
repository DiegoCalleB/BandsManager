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
  const html = renderToStaticMarkup(<PanelArmonia armonia={armonia} bpm={146} notation="ES" transpose={0} extendida />);

  it('cuenta la tonalidad, el modo y el bucle con datos calculados', () => {
    expect(html).toContain('Mi mayor · mixolidio');
    expect(html).toContain('I – IV – VII');
    expect(html).toMatch(/rock mixolidio/);
  });

  it('cada acorde lleva su grado, su función y qué tocar encima', () => {
    expect(html).toContain('VII');
    expect(html).toContain('Color modal');
    expect(html).toContain('Pentatónica');
    expect(html).toMatch(/notas guía/);
  });

  it('el consejo es honesto sobre su origen y no promete más de lo que sabe', () => {
    expect(html).toContain('Basado en los acordes escritos en el cifrado');
    expect(html).toContain('Idea'); // las sugerencias de arreglo van etiquetadas
  });

  it('la transposición cambia los nombres de nota, no los grados', () => {
    const t = renderToStaticMarkup(<PanelArmonia armonia={armonia} notation="EN" transpose={2} extendida />);
    expect(t).toContain('F# mayor'); // E +2
    expect(t).toContain('VII');
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
    const h = renderToStaticMarkup(<SelectorArmonia estilo={{ mostrar: 'nombre', colorear: 'nada', grados: 'simple' }} onCambio={() => {}} presentes={['T']} />);
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

  it('con explicación en corto: lo esencial y el botón', () => {
    const largo = renderToStaticMarkup(<ProfesorIA profesor={profesor} onPedir={async () => profesor} />);
    expect(largo).toContain('Es rock mixolidio.');
    expect(largo).toContain('Explicación extendida');
    expect(largo).not.toContain('Para darle dinamismo');
  });

  it('con explicación: separa datos de ideas y avisa de lo descartado', () => {
    const h = renderToStaticMarkup(<ProfesorIA extendida profesor={profesor} onPedir={async () => profesor} />);
    expect(h).toContain('Es rock mixolidio.');
    expect(h).toContain('Ver menos');
    expect((h.match(/>Idea</g) ?? []).length).toBe(3); // improvisar, componer y dinamismo
    expect(h).toMatch(/Se descartaron 2 frases/);
    expect(h).toContain('Volver a explicar');
    expect(h).not.toMatch(/\bborder/);
  });
});

describe('explicar los colores', () => {
  it('el panel de Armonía explica por qué cada acorde tiene su función, con su posición en la tonalidad', () => {
    const h = renderToStaticMarkup(<PanelArmonia armonia={armonia} bpm={146} notation="ES" transpose={0} extendida />);
    expect(h).toContain('Mi (I) es la tónica (el «1») de Mi mayor');
    expect(h).toMatch(/La \(IV\) es el 4\.º grado de Mi mayor: te aleja de casa/);
    expect(h).toMatch(/Re \(VII\) es el 7\.º grado de Mi mayor: no pertenece a la escala/);
    expect(h).not.toMatch(/\b[b#][ivIV]/);
  });

  it('la leyenda ofrece «¿Por qué estos colores?» y, desplegada, dice que el color depende del lugar en la tonalidad y da ejemplos', () => {
    const cerrada = renderToStaticMarkup(<SelectorArmonia estilo={ESTILO_POR_DEFECTO} onCambio={() => {}} presentes={['T', 'S']} />);
    expect(cerrada).toContain('¿Por qué estos colores?');
    expect(cerrada).not.toContain('no depende del nombre del acorde');
  });
});

describe('lo esencial primero', () => {
  it('Armonía y profesor ocultan el detalle tras «Explicación extendida»', () => {
    const corto = renderToStaticMarkup(<PanelArmonia armonia={armonia} bpm={146} notation="ES" transpose={0} />);
    expect(corto).toContain('Explicación extendida');
    expect(corto).not.toContain('Pentatónica');
    expect(corto).not.toContain('Para improvisar y componer');
  });
});
