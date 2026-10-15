import { describe, expect, it } from "vitest";
import { elegirDuracionDeLoop } from "../loopPerfecto.js";
import type { PuntoEnergia } from "../audioEnergy.js";

/** Curva de 10 muestras/s con el nivel que diga `nivel(t)`. */
const curva = (hasta: number, nivel: (t: number) => number): PuntoEnergia[] =>
  Array.from({ length: Math.round(hasta * 10) }, (_, i) => ({ t: i / 10, db: nivel(i / 10) }));

describe("elegirDuracionDeLoop", () => {
  it("evita acabar en un golpe fuerte cuando el bucle vuelve a arrancar en un tramo suave", () => {
    // Suave (-30 dB) salvo un golpe (-10 dB) de 19,4 a 20,1: la duración pedida (20 s) cae dentro.
    const c = curva(24, (t) => (t >= 19.4 && t < 20.1 ? -10 : -30));
    const d = elegirDuracionDeLoop(c, { inicio: 0, duracion: 20 });
    expect(d).toBeGreaterThan(20.1); // se aleja del golpe
    expect(d).toBeLessThanOrEqual(21.5);
  });

  it("si ya enlaza bien, respeta la duración pedida", () => {
    const c = curva(24, () => -25);
    expect(elegirDuracionDeLoop(c, { inicio: 0, duracion: 20 })).toBe(20);
  });

  it("sin curva de audio devuelve la duración pedida", () => {
    expect(elegirDuracionDeLoop([], { inicio: 0, duracion: 20 })).toBe(20);
  });

  it("nunca pasa del material disponible ni se queda por debajo del mínimo útil", () => {
    const c = curva(24, (t) => (t >= 19.4 && t < 21 ? -10 : -30));
    expect(elegirDuracionDeLoop(c, { inicio: 0, duracion: 20, finDisponible: 20.2 })).toBeLessThanOrEqual(20.2);
    expect(elegirDuracionDeLoop(curva(10, () => -20), { inicio: 0, duracion: 4, margen: 5 })).toBeGreaterThanOrEqual(3.8);
  });

  it("usa el nivel del punto de arranque real, no el del segundo 0 del fichero", () => {
    // El clip empieza en 5 s, donde hay un tramo fuerte; el final debe parecerse a eso.
    const c = curva(30, (t) => (t >= 5 && t < 6.5 ? -12 : -30));
    // Con inicio=5 la referencia es el nivel en 5,4–5,8 (-12 dB): ningún final suave le gana a uno fuerte.
    const d = elegirDuracionDeLoop(c.map((p) => (p.t >= 24.6 && p.t < 25.2 ? { ...p, db: -12 } : p)), { inicio: 5, duracion: 20 });
    expect(d).toBeCloseTo(20, 0);
  });
});
