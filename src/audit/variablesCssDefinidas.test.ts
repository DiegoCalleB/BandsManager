/**
 * Auditoría: toda variable CSS que se usa sin valor de reserva está definida en algún sitio.
 * Una `var(--x)` sin definir no da error: el navegador la descarta y el color desaparece o el radio
 * se queda en 0. `--accent-alt` (18 usos), `--card`, `--raised` y `--r-xs` llevaban así desde que
 * el sistema «Espectro» dejó un solo acento (`--acc`), y los avisos y etiquetas perdían su tinte.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..');

function* ficheros(dir: string, exts: RegExp): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'audit' || e.name === 'node_modules') continue;
      yield* ficheros(p, exts);
    } else if (exts.test(e.name) && !/\.test\./.test(e.name)) yield p;
  }
}

describe('variables CSS', () => {
  it('ninguna var(--x) sin valor de reserva queda sin definir', () => {
    const definidas = new Set<string>();
    const usos: Array<{ nombre: string; donde: string }> = [];

    for (const f of ficheros(SRC, /\.(css|tsx?)$/)) {
      const texto = fs.readFileSync(f, 'utf8');
      // Definiciones: en CSS (`--x: …`) y desde código (`'--x': …`, `setProperty('--x'`, `[--x:…]`).
      for (const m of texto.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) definidas.add(m[1]);
      for (const m of texto.matchAll(/setProperty\(\s*['"`](--[A-Za-z0-9_-]+)/g)) definidas.add(m[1]);

      const rel = path.relative(SRC, f).split(path.sep).join('/');
      texto.split('\n').forEach((linea, i) => {
        // Una línea de comentario puede citar `var(--token)` como ejemplo.
        if (/^\s*(\*|\/\/|\/\*)/.test(linea)) return;
        for (const m of linea.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)\s*([,)])/g)) {
          if (m[2] === ',') continue; // lleva valor de reserva
          usos.push({ nombre: m[1], donde: `${rel}:${i + 1}` });
        }
      });
    }

    const sinDefinir = usos.filter((u) => !definidas.has(u.nombre)).map((u) => `${u.nombre} en ${u.donde}`);
    expect(sinDefinir).toEqual([]);
  });
});
