/**
 * Auditoría: el hijo directo de <ModalPortal> es el overlay `fixed inset-0`.
 * ModalPortal solo monta en document.body; sin ese overlay el modal cae en el flujo normal
 * y aparece al final de la página, fuera de la vista (pasó con BulkAlbumAudioUploaderModal).
 * El CSS global de modales (index.css › «MODALES») también cuelga de `> .fixed.inset-0`.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const RAIZ = path.resolve(__dirname, '..');
// Spotlight del tutorial: su primer hijo es una capa condicional a propósito.
const EXENTOS = new Set(['components/common/ModuleTutorialModal.tsx']);

function* ficheros(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      yield* ficheros(p);
    } else if (e.name.endsWith('.tsx') && !/\.test\./.test(e.name)) yield p;
  }
}

/** Índice del `>` que cierra la etiqueta de apertura, ignorando los de `=>` y los de dentro de `{}`. */
function finDeEtiqueta(s: string, desde: number): number {
  let llaves = 0;
  let comilla = '';
  for (let i = desde; i < s.length; i++) {
    const c = s[i];
    if (comilla) {
      if (c === comilla && s[i - 1] !== '\\') comilla = '';
    } else if (llaves === 0 && (c === '"' || c === "'" || c === '`')) comilla = c;
    else if (c === '{') llaves++;
    else if (c === '}') llaves--;
    else if (c === '>' && llaves === 0 && s[i - 1] !== '=') return i;
  }
  return -1;
}

describe('modales con overlay', () => {
  it('el hijo directo de <ModalPortal> es un `fixed inset-0`', () => {
    const sinOverlay: string[] = [];
    for (const f of ficheros(RAIZ)) {
      const rel = path.relative(RAIZ, f).split(path.sep).join('/');
      if (rel === 'components/common/ModalPortal.tsx' || EXENTOS.has(rel)) continue;
      const s = fs.readFileSync(f, 'utf8');
      for (const m of s.matchAll(/<ModalPortal\b/g)) {
        const fin = finDeEtiqueta(s, m.index + m[0].length);
        let resto = s.slice(fin + 1);
        // Salta espacios y comentarios que preceden al primer elemento hijo.
        for (let n = resto.match(/^(\s+|\{\/\*[\s\S]*?\*\/\}|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)/); n; n = resto.match(/^(\s+|\{\/\*[\s\S]*?\*\/\}|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)/)) {
          resto = resto.slice(n[0].length);
        }
        const hijo = resto.match(/^<[A-Za-z0-9_.]+/);
        const atributos = hijo ? resto.slice(hijo[0].length, finDeEtiqueta(resto, hijo[0].length)) : '';
        if (!/\bfixed\b/.test(atributos) || !/\binset-0\b/.test(atributos)) {
          sinOverlay.push(`${rel}:${s.slice(0, m.index).split('\n').length}`);
        }
      }
    }
    expect(sinOverlay).toEqual([]);
  });
});
