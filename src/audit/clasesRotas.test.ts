/**
 * Auditoría automática de clases de Tailwind rotas por un restyle masivo.
 *
 * Un restyle automático dejó restos como `mb-310` (un `mb-3` con un `10` pegado = 1.240 px de
 * margen: un panel entero fuera de pantalla), `p-410`, o `rounded-[var(--r-m)]10` (la clase deja de
 * existir y la caja pierde el redondeo/fondo). Tailwind los acepta sin quejarse y ninguna revisión
 * de código los delata; este test los caza antes de llegar a producción.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const RAIZ = path.resolve(__dirname, '..');

function* ficheros(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      yield* ficheros(p);
    } else if (/\.(tsx|ts|css)$/.test(e.name) && !/\.test\./.test(e.name)) yield p;
  }
}

const PATRONES: Array<{ nombre: string; re: RegExp }> = [
  {
    nombre: 'valor arbitrario seguido de dos dígitos pegados (p. ej. rounded-[var(--r-m)]10)',
    re: /\b(rounded|bg|text|border|ring|from|to|via|shadow|divide|outline|fill|stroke)-\[[^\]]*\]\)?\d{2}\b/,
  },
  {
    nombre: 'espaciado con «10» pegado (p. ej. mb-310, p-3.510, pt-110)',
    re: /(?<![\w-])-?(m[trblxy]?|p[trblxy]?|gap|gap-[xy]|space-[xy])-(\d+(\.5)?)10(?![\w.])/,
  },
];

describe('clases de Tailwind rotas por un restyle', () => {
  it('no hay restos tipo «mb-310» ni «rounded-[…]10» en el código', () => {
    const hallazgos: string[] = [];
    for (const f of ficheros(RAIZ)) {
      const lineas = fs.readFileSync(f, 'utf8').split('\n');
      lineas.forEach((l, i) => {
        // solo dentro de cadenas/plantillas con clases (evita comentarios o regex como este)
        if (!/["'`]/.test(l) || /^\s*(\/\/|\*|\/\*)/.test(l)) return;
        for (const { nombre, re } of PATRONES) {
          const m = l.match(re);
          if (m) hallazgos.push(`${path.relative(RAIZ, f)}:${i + 1}  «${m[0]}»  → ${nombre}`);
        }
      });
    }
    expect(hallazgos, hallazgos.join('\n')).toEqual([]);
  });

  it('el detector de verdad detecta los casos que ya nos hicieron daño', () => {
    for (const roto of ['mb-310', 'pt-2.510', 'p-410', 'p-3.510', 'pt-110', 'rounded-[var(--r-m)]10', 'bg-[var(--sunken)]10']) {
      expect(PATRONES.some(({ re }) => re.test(`className="flex ${roto} gap-2"`)), roto).toBe(true);
    }
    for (const bien of ['mb-3', 'p-4', 'p-3.5', 'pt-1', 'w-110', 'top-10', 'mt-10', 'gap-10', 'p-10', 'rounded-[var(--r-m)]', 'bg-[var(--sunken)]/10']) {
      expect(PATRONES.some(({ re }) => re.test(`className="flex ${bien} gap-2"`)), bien).toBe(false);
    }
  });
});
