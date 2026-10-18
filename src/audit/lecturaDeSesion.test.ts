/**
 * Auditoría: el token y el usuario de la sesión se leen solo a través de src/services/sesionLocal.ts.
 * Antes había ~47 lecturas sueltas de localStorage con variantes distintas de clave y de manejo de
 * errores; una nueva lectura directa vuelve a abrir esa puerta.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const RAIZ = path.resolve(__dirname, '..');
// La landing pública de fans mira además claves de versiones antiguas de la app.
const EXENTOS = new Set(['services/sesionLocal.ts', 'components/fans_landing/hooks/useFanBandProfile.ts']);

function* ficheros(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      yield* ficheros(p);
    } else if (/\.(tsx|ts)$/.test(e.name) && !/\.test\./.test(e.name)) yield p;
  }
}

describe('lectura de la sesión', () => {
  it('nadie lee bandmanager_token ni bandmanager_user de localStorage salvo sesionLocal', () => {
    const directas: string[] = [];
    for (const f of ficheros(RAIZ)) {
      const rel = path.relative(RAIZ, f).split(path.sep).join('/');
      if (EXENTOS.has(rel)) continue;
      fs.readFileSync(f, 'utf8')
        .split('\n')
        .forEach((l, i) => {
          if (/localStorage\.getItem\(\s*['"](bandmanager_token|bandmanager_user|token)['"]\s*\)/.test(l)) directas.push(`${rel}:${i + 1}`);
        });
    }
    expect(directas).toEqual([]);
  });
});
