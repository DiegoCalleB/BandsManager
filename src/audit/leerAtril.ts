import { readdirSync, readFileSync } from 'node:fs';

/**
 * Código fuente del Atril: el contenedor más todos los módulos de `components/atril/`
 * (tras la modularización, ADR 0040). Los tests de auditoría vigilan el comportamiento del Atril
 * leyendo su fuente, que ahora vive repartida.
 */
export function leerAtril(): string {
  const dir = new URL('../components/atril/', import.meta.url);
  const modulos = readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !f.includes('__tests__'))
    .sort()
    .map((f) => readFileSync(new URL(f, dir), 'utf8'));
  return [readFileSync(new URL('../components/Atril.tsx', import.meta.url), 'utf8'), ...modulos].join('\n');
}
