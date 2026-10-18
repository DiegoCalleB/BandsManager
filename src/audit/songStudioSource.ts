import fs from 'node:fs';
import path from 'node:path';

const componentes = path.join(__dirname, '..', 'components');

/** Lista recursivamente los .ts/.tsx de un directorio, excluyendo los tests. */
const fuentes = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : fuentes(ruta);
    return /\.tsx?$/.test(e.name) ? [ruta] : [];
  });

/**
 * Código completo del módulo Song Studio: el contenedor `SongStudioModal.tsx` más todo lo que
 * extrajo a `song_studio/` (hooks y vistas). Los tests de contrato que leen el código fuente usan
 * esto para que sigan protegiendo el comportamiento aunque el código cambie de archivo.
 */
export const leerModuloSongStudio = (): string =>
  [path.join(componentes, 'SongStudioModal.tsx'), ...fuentes(path.join(componentes, 'song_studio'))]
    .map((f) => fs.readFileSync(f, 'utf-8'))
    .join('\n');
