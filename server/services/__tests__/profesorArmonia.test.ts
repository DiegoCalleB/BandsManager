import { describe, it, expect } from 'vitest';
import { construirHechos, huellaDeHechos, construirPrompt, validarExplicacion, mencionaAcordeAjeno } from '../profesorArmonia';
import { analizarArmonia } from '../../../src/utils/teoriaArmonica';

const seq = (...a: string[]) => a.map((acorde, i) => ({ t0: i * 2, t1: i * 2 + 2, acorde }));
const armonia = analizarArmonia(seq('E', 'E', 'A', 'D', 'E', 'E', 'A', 'D', 'E', 'E', 'A', 'D'), 'E')!;
const h = construirHechos(armonia, { bpm: 146 });

describe('construirHechos y huella', () => {
  it('lleva solo hechos calculados, con ids estables, y no el título ni nada de la grabación', () => {
    expect(h.modo).toMatch(/mixolidio/);
    expect(h.acordes.map((a) => `${a.id}:${a.acorde}:${a.grado}`)).toEqual(['a1:E:I', 'a2:A:IV', 'a3:D:bVII']);
    expect(h.bucle?.grados).toEqual(['I', 'IV', 'bVII']);
    expect(JSON.stringify(h)).not.toMatch(/titulo|título|artist/i);
  });
  it('la huella cambia si cambian los acordes, el nivel o el instrumento, y no si todo igual', () => {
    const base = huellaDeHechos(h, 'intermedio', 'guitarra');
    expect(huellaDeHechos(h, 'intermedio', 'guitarra')).toBe(base);
    expect(huellaDeHechos(h, 'principiante', 'guitarra')).not.toBe(base);
    expect(huellaDeHechos(h, 'intermedio', 'bajo')).not.toBe(base);
    const otra = construirHechos(analizarArmonia(seq('C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F'), 'C')!);
    expect(huellaDeHechos(otra, 'intermedio', 'guitarra')).not.toBe(base);
  });
});

describe('prompt', () => {
  it('prohíbe inventar, separa hechos de sugerencias y pide JSON', () => {
    const p = construirPrompt(h, 'principiante', 'bajo');
    expect(p.sistema).toMatch(/SOLO los datos/);
    expect(p.sistema).toMatch(/SUGERENCIAS/);
    expect(p.sistema).toMatch(/Nivel: principiante/);
    expect(p.sistema).toMatch(/Instrumento del músico: bajo/);
    expect(p.usuario).toContain('"a1"');
  });
});

describe('validarExplicacion: lo que afirma hechos tiene que cumplirse', () => {
  it('detecta acordes ajenos a la canción (en notación inglesa y española)', () => {
    expect(mencionaAcordeAjeno('Toca E y A, luego D', h)).toBeNull();
    expect(mencionaAcordeAjeno('Aparece un F#m muy bonito', h)).toBe('F#m');
    expect(mencionaAcordeAjeno('Aquí entra un Lam', h)).toBe('Lam');
    expect(mencionaAcordeAjeno('La escala de E mixolidio', h)).toBeNull(); // una letra sola es una nota/escala
    expect(mencionaAcordeAjeno('Sobre Mi y Re', h)).toBeNull();
  });

  it('descarta frases con acordes inventados o hechos que no existen, y conserva lo bueno', () => {
    const r = validarExplicacion({
      resumen: 'Es rock mixolidio en E con un bucle I–IV–bVII.',
      comoFunciona: [
        { texto: 'El D (bVII) da el color de rock.', hechos: ['a3'] },
        { texto: 'Aquí hay un G#m de paso.', hechos: ['a1'] },
        { texto: 'Dato sin respaldo.', hechos: ['a99'] },
      ],
      paraImprovisar: ['Prueba la pentatónica menor de E.'],
      paraComponer: [],
      dinamismo: [{ idea: 'Sube un tono en el último estribillo', ejemplo: 'Pasa a F#' }],
    }, h)!;
    expect(r.explicacion.comoFunciona).toHaveLength(1);
    expect(r.explicacion.comoFunciona[0].hechos).toEqual(['a3']);
    expect(r.descartadas).toBe(2);
    expect(r.explicacion.paraImprovisar).toHaveLength(1);
    expect(r.explicacion.dinamismo[0].ejemplo).toBe('Pasa a F#'); // las ideas pueden proponer algo nuevo
  });

  it('un resumen con un acorde inventado se descarta; sin nada útil devuelve null', () => {
    const r = validarExplicacion({ resumen: 'Hay un Bm7 clave.', comoFunciona: [], paraImprovisar: [], paraComponer: [], dinamismo: [] }, h);
    expect(r).toBeNull();
    expect(validarExplicacion(null, h)).toBeNull();
    expect(validarExplicacion('texto', h)).toBeNull();
  });

  it('acota longitudes y número de elementos', () => {
    const largo = 'x'.repeat(900);
    const r = validarExplicacion({ resumen: largo, comoFunciona: [], paraImprovisar: Array(9).fill('Prueba esto'), paraComponer: [], dinamismo: [] }, h)!;
    expect(r.explicacion.resumen.length).toBeLessThanOrEqual(320);
    expect(r.explicacion.paraImprovisar).toHaveLength(4);
  });
});
