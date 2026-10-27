import { describe, it, expect } from "vitest";
import { ajustarACompases, decodificarCompases, elegirNivel, normalizarNivel, pulsoDesdeRed, rellenarHuecos } from "../compases";
import { picos, postprocesar, TRAMAS_POR_SEGUNDO } from "../beatThis";

const FPS = TRAMAS_POR_SEGUNDO;
const rejilla = (desde: number, T: number, n: number) => Array.from({ length: n }, (_, i) => Math.round((desde + i * T) * 1000) / 1000);

/** Salida falsa de la red: probabilidad de «1» alta en `unos`, baja en el resto. */
function red(pulsos: number[], unos: number[], duracion: number) {
  const probabilidad = new Float32Array(Math.ceil(duracion * FPS) + 1);
  const probabilidadCompas = new Float32Array(probabilidad.length);
  for (const t of pulsos) probabilidad[Math.round(t * FPS)] = 0.95;
  for (const t of unos) probabilidadCompas[Math.round(t * FPS)] = 0.9;
  return { pulsos, compases: unos, probabilidad, probabilidadCompas };
}

describe("postproceso de la red", () => {
  it("picos: máximos positivos a 50 tramas/s, fundiendo mesetas", () => {
    const l = new Float32Array(200).fill(-5);
    l[50] = 3;
    l[100] = 2;
    l[101] = 2;
    expect(picos(l)).toEqual([1, 2.01]);
  });

  it("cada inicio de compás se lleva a su pulso más cercano", () => {
    const beat = new Float32Array(300).fill(-5);
    const down = new Float32Array(300).fill(-5);
    [25, 50, 75, 100, 125].forEach((i) => (beat[i] = 4));
    down[27] = 3; // 2 tramas tarde
    expect(postprocesar(beat, down)).toEqual({ pulsos: [0.5, 1, 1.5, 2, 2.5], compases: [0.5] });
  });
});

describe("nivel métrico", () => {
  it("manda el nivel que más canción cubre: una balada contada a ratos a corcheas sigue en negras", () => {
    const corcheas = rejilla(0, 0.357, 14);
    const negras = rejilla(5, 0.714, 30);
    expect(elegirNivel([...corcheas, ...negras], undefined)).toBeCloseTo(0.714, 2);
  });

  it("la ficha decide mitad o doble solo cuando la red está claramente a otra octava", () => {
    const p = rejilla(0, 0.3, 100); // 200 BPM
    expect(60 / elegirNivel(p, 100)).toBeCloseTo(100, 0);
    expect(60 / elegirNivel(p, 190)).toBeCloseTo(200, 0);
  });

  it("los tramos a corcheas se quedan con la paridad que empalma con lo de alrededor", () => {
    // Negras a 0,7 s; en medio la red cuenta corcheas empezando en un contratiempo (3,15).
    const p = [...rejilla(0, 0.7, 4), ...rejilla(3.15, 0.35, 5), ...rejilla(4.9, 0.7, 4)];
    const n = normalizarNivel(p, 0.7, new Float32Array(1000));
    expect(n.every((t, i) => i === 0 || Math.abs(t - n[i - 1] - 0.7) < 0.36 * 0.7 || Math.abs(t - n[i - 1] - 1.05) < 0.01)).toBe(true);
    expect(n).toContain(4.9);
    expect(n).not.toContain(4.55);
  });

  it("quita un pulso suelto de más", () => {
    const p = [...rejilla(0, 0.5, 6), 2.75, ...rejilla(3, 0.5, 4)];
    expect(normalizarNivel(p, 0.5, new Float32Array(400))).not.toContain(2.75);
  });
});

describe("huecos", () => {
  it("rellena un break sin pulsos al tempo de alrededor y prolonga hasta el principio y el final", () => {
    const p = [...rejilla(1, 0.5, 8), ...rejilla(7, 0.5, 8)];
    const { pulsos, relleno } = rellenarHuecos(p, 12, 0.5);
    expect(pulsos[0]).toBeCloseTo(0.5, 5);
    expect(pulsos.filter((t) => t > 4.4 && t < 7)).toHaveLength(5);
    expect(pulsos[pulsos.length - 1]).toBeLessThan(12);
    expect(relleno.filter(Boolean).length).toBeGreaterThan(5);
  });
});

describe("Viterbi de compases", () => {
  it("un «1» suelto en mitad del compás no parte el compás", () => {
    const e = Array.from({ length: 32 }, (_, i) => (i % 4 === 0 ? 0.9 : 0.1));
    e[10] = 0.7; // la red «parpadea»
    const { posiciones } = decodificarCompases(e, 4);
    expect(posiciones.filter((s) => s === 0)).toHaveLength(8);
    expect(posiciones[10]).toBe(2);
  });

  it("3/4 gana cuando los «1» van de tres en tres", () => {
    const e = Array.from({ length: 30 }, (_, i) => (i % 3 === 0 ? 0.9 : 0.1));
    expect(decodificarCompases(e, 3).puntuacion).toBeGreaterThan(decodificarCompases(e, 4).puntuacion);
  });
});

describe("pulsoDesdeRed", () => {
  it("una canción que acelera: compases regulares en pulsos de duración real", () => {
    const pulsos: number[] = [];
    for (let t = 0.5, k = 0; t < 40; k++) {
      pulsos.push(Math.round(t * 1000) / 1000);
      t += 60 / (100 + k * 0.3);
    }
    const unos = pulsos.filter((_, i) => i % 4 === 0);
    const p = pulsoDesdeRed(red(pulsos, unos, 40), { duracion: 40 })!;
    expect(p.fuente).toBe("red");
    expect(p.tiempos).toBe(4);
    expect(p.compases).toEqual(expect.arrayContaining(unos.slice(1, -1)));
    expect(p.confianza).toBeGreaterThan(0.8);
  });

  it("los cambios de acorde deciden el «1» cuando la red duda", () => {
    const pulsos = rejilla(0, 0.5, 64);
    const dudosa = red(pulsos, [], 32);
    pulsos.forEach((t) => (dudosa.probabilidadCompas[Math.round(t * FPS)] = 0.3));
    const cambios = pulsos.filter((_, i) => i % 4 === 1); // la banda cambia en el «2» de la red
    const p = pulsoDesdeRed(dudosa, { duracion: 32, cambios })!;
    expect(p.compases!.slice(0, 3)).toEqual([0.5, 2.5, 4.5]);
  });
});

describe("ajustarACompases", () => {
  const pulsos = rejilla(0, 0.5, 32); // 120 BPM, «1» cada 2 s
  const unos = pulsos.filter((_, i) => i % 4 === 0);
  const tramo = (t0: number, t1: number, acorde: string) => ({ t0, t1, acorde });

  it("un cambio medio pulso antes del 1 se lleva al 1; uno en el 3 se queda en su pulso", () => {
    const s = ajustarACompases([tramo(0, 1.76, "Em"), tramo(1.76, 3.04, "C"), tramo(3.04, 6, "G")], { pulsos, compases: unos });
    expect(s.map((x) => x.t0)).toEqual([0, 2, 3]);
    expect(s[1].t1).toBe(3);
  });

  it("un cambio confirmado por la armonía no se arrastra al 1 si está lejos (directo sin claqueta)", () => {
    const base = [tramo(0, 1.76, "Em"), { ...tramo(1.76, 3.04, "C"), anclado: true }, tramo(3.04, 6, "G")];
    const s = ajustarACompases(base, { pulsos, compases: unos });
    expect(s[1].t0).toBe(1.76); // a 0,24 s del 1 (0,48 pulsos): se respeta
    expect(s[2].t0).toBe(3); // el no confirmado sigue yendo a su pulso
  });

  it("un cambio confirmado casi encima del pulso sí se cuadra", () => {
    const s = ajustarACompases([tramo(0, 1.94, "Em"), { ...tramo(1.94, 4, "C"), anclado: true }], { pulsos, compases: unos });
    expect(s[1].t0).toBe(2);
  });

  it("no se come un acorde entero", () => {
    const s = ajustarACompases([tramo(0, 1.8, "Em"), tramo(1.8, 1.95, "B7"), tramo(1.95, 4, "C")], { pulsos, compases: unos });
    expect(s.every((x) => x.t1 - x.t0 > 0.1)).toBe(true);
  });
});
