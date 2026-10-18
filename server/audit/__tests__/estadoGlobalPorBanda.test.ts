import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// `state.tours`, `state.fans`... contienen los datos de TODAS las bandas. Asignarles el resultado de
// una consulta de una sola banda borra de memoria lo de las demás. Las rutas y controladores deben
// usar server/utils/estadoPorBanda.ts.
const COLECCIONES = 'leads|rehearsals|concerts|posts|payments|metrics|songs|setlists|tours|fans|bands|messages';
const ASIGNACION = new RegExp(`\\bstate\\.(${COLECCIONES})\\s*=(?!\\s*(?:fusionarColeccionDeBanda|reemplazarDeBanda|quitarDeBanda|state\\.|\\[\\]|\\(state\\.))\\s*\\S`, 'g');

const recorrer = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === '__tests__' ? [] : recorrer(path.join(dir, e.name)))
      : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []);

describe('estado global en rutas y controladores', () => {
  it('ninguna ruta sustituye una colección global por datos de una banda', () => {
    const infractores: string[] = [];
    for (const f of [...recorrer('server/routes'), ...recorrer('server/controllers')]) {
      fs.readFileSync(f, 'utf8').split('\n').forEach((linea, i) => {
        ASIGNACION.lastIndex = 0;
        if (ASIGNACION.test(linea)) infractores.push(`${f}:${i + 1}: ${linea.trim()}`);
      });
    }
    expect(infractores, 'usa fusionarColeccionDeBanda/reemplazarDeBanda/quitarDeBanda').toEqual([]);
  });

  // Fase 2B: colecciones ya migradas a solo-Supabase. Se añade aquí cada una que se migre; ninguna
  // ruta (salvo la semilla del arranque local, que usa `loadState().x`) vuelve a tocar `state.x`.
  const MIGRADAS = ['tours', 'fans'];
  it.each(MIGRADAS)('state.%s ya no se lee ni se escribe desde rutas o controladores', (coleccion) => {
    const uso = new RegExp(`\\bstate\\.${coleccion}\\b`);
    const infractores: string[] = [];
    for (const f of [...recorrer('server/routes'), ...recorrer('server/controllers')]) {
      fs.readFileSync(f, 'utf8').split('\n').forEach((linea, i) => {
        if (uso.test(linea) && !linea.trim().startsWith('//')) infractores.push(`${f}:${i + 1}: ${linea.trim()}`);
      });
    }
    expect(infractores, `lee ${coleccion} de Supabase (db/${coleccion}.ts)`).toEqual([]);
  });
});
