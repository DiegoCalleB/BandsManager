import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { cargarEsquema } from '../../audit/pgliteSchema';
import { normalizarTexto } from '../../utils/salaCatalogo';
import { ESTILOS_VALIDOS } from '../../utils/seo/festivales/mapeo';

const FICHERO = '20261121_catalogo_generos_estilos_festival.sql';
const SQL = fs.readFileSync(path.resolve(__dirname, '../../../supabase/migrations', FICHERO), 'utf8');

let db: PGlite;
let errores: Array<{ fichero: string; mensaje: string }>;

beforeAll(async () => {
  const carga = await cargarEsquema();
  db = carga.db;
  errores = carga.errores;
}, 120_000);

const consultar = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const ids = async () => new Set((await consultar<{ id: string }>('select id from catalogo_generos')).map((g) => g.id));

describe('taxonomía de géneros alineada con los estilos de festivales', () => {
  it('se aplica sin errores sobre el esquema real', () => {
    expect(errores.filter((e) => e.fichero.includes('generos_estilos_festival'))).toEqual([]);
  });

  it('todo estilo que puede llevar un festival es un género de la taxonomía', async () => {
    const generos = await ids();
    expect([...ESTILOS_VALIDOS].filter((e) => !generos.has(e))).toEqual([]);
  });

  it('`world` se sustituye por `mundo` y sus alias apuntan a `mundo`', async () => {
    expect((await ids()).has('world')).toBe(false);
    const alias = await consultar<{ genero_id: string }>("select genero_id from catalogo_generos_alias where alias in ('world', 'world music', 'musica del mundo')");
    expect(alias.map((a) => a.genero_id)).toEqual(['mundo', 'mundo', 'mundo']);
  });

  it('cada alias sigue normalizado y apunta a un género que existe', async () => {
    const huerfanos = await consultar<{ n: number }>('select count(*)::int n from catalogo_generos_alias a where not exists (select 1 from catalogo_generos g where g.id = a.genero_id)');
    expect(huerfanos[0].n).toBe(0);
    for (const { alias } of await consultar<{ alias: string }>('select alias from catalogo_generos_alias')) expect(normalizarTexto(alias)).toBe(alias);
  });

  it('es idempotente', async () => {
    const antes = (await ids()).size;
    await db.exec(SQL);
    await db.exec(SQL);
    expect((await ids()).size).toBe(antes);
  });
});
