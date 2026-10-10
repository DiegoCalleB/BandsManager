import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

// Ninguna banda es especial en el código: ni ids, ni nombres, ni claves de almacenamiento, ni datos de ejemplo.
// El nombre se arma por partes para que este test no se delate a sí mismo.
const PROHIBIDO = new RegExp(['baka', 'ndeya'].join(''), 'i');
const RAICES = ['src', 'server', 'scripts', 'e2e'];
const EXTENSIONES = new Set(['.ts', '.tsx', '.mjs', '.cjs', '.js', '.json', '.md']);

function archivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return entrada.name === 'node_modules' ? [] : archivos(ruta);
    return EXTENSIONES.has(path.extname(entrada.name)) ? [ruta] : [];
  });
}

describe('ninguna banda privilegiada en el código', () => {
  const todos = RAICES.flatMap((raiz) => archivos(path.join(process.cwd(), raiz)));

  it('recorre los directorios de código', () => {
    expect(todos.length).toBeGreaterThan(300);
  });

  it('no nombra a ninguna banda concreta como caso especial', () => {
    const infractores = todos.filter((f) => PROHIBIDO.test(fs.readFileSync(f, 'utf8')));
    expect(infractores).toEqual([]);
  });

  it('no deja assets con el nombre de una banda en public/', () => {
    const publicos = fs.readdirSync(path.join(process.cwd(), 'public'));
    expect(publicos.filter((f) => PROHIBIDO.test(f))).toEqual([]);
  });
});
