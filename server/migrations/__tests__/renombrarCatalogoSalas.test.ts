import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { cargarEsquema } from '../../audit/pgliteSchema';

const FICHERO = '20261114_renombrar_salas_catalogo.sql';
const SQL = fs.readFileSync(path.resolve(__dirname, '../../../supabase/migrations', FICHERO), 'utf8');

let db: PGlite;
let errores: Array<{ fichero: string; mensaje: string }>;

beforeAll(async () => {
  const carga = await cargarEsquema();
  db = carga.db;
  errores = carga.errores;
}, 120_000);

const consultar = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;

describe('migración que renombra salas_catalogo a catalogo_salas', () => {
  it('se aplica sin errores y deja solo el nombre nuevo', async () => {
    expect(errores.filter((e) => e.fichero.includes('renombrar_salas_catalogo'))).toEqual([]);
    const t = await consultar<{ table_name: string }>("select table_name from information_schema.tables where table_name in ('salas_catalogo', 'catalogo_salas')");
    expect(t.map((x) => x.table_name)).toEqual(['catalogo_salas']);
  });

  it('las claves ajenas de leads, festivales y géneros por sala siguen apuntando a la tabla (ahora con el nombre nuevo)', async () => {
    const fk = await consultar<{ tabla: string; destino: string }>(`
      select c.conrelid::regclass::text as tabla, c.confrelid::regclass::text as destino
      from pg_constraint c where c.contype = 'f' and c.confrelid = 'catalogo_salas'::regclass order by 1`);
    const origenes = fk.map((f) => f.tabla);
    for (const esperado of ['leads', 'festivales', 'catalogo_sala_generos']) expect(origenes).toContain(esperado);
    expect(fk.every((f) => f.destino === 'catalogo_salas')).toBe(true);
  });

  it('ningún índice ni restricción de la tabla conserva el nombre antiguo', async () => {
    const i = await consultar<{ indexname: string }>("select indexname from pg_indexes where tablename = 'catalogo_salas' and indexname like '%salas\\_catalogo%'");
    expect(i).toEqual([]);
    const c = await consultar<{ conname: string }>("select conname from pg_constraint where conrelid = 'catalogo_salas'::regclass and conname like '%salas\\_catalogo%'");
    expect(c).toEqual([]);
    const nombres = (await consultar<{ indexname: string }>("select indexname from pg_indexes where tablename = 'catalogo_salas'")).map((x) => x.indexname);
    expect(nombres).toContain('catalogo_salas_pkey');
    expect(nombres).toContain('idx_catalogo_salas_nivel');
  });

  it('conserva las filas y la RLS al renombrar una tabla con datos, y es idempotente', async () => {
    await db.exec('ALTER TABLE catalogo_salas RENAME TO salas_catalogo');
    await db.exec("insert into salas_catalogo (id, clave, nombre) values ('sala-r1', 'nc:renombrada|soria', 'Sala renombrada')");
    await db.exec(SQL);
    await db.exec(SQL);
    const [f] = await consultar<{ nombre: string }>("select nombre from catalogo_salas where id='sala-r1'");
    expect(f.nombre).toBe('Sala renombrada');
    const [t] = await consultar<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where relname='catalogo_salas'");
    expect(t.relrowsecurity).toBe(true);
    expect(await consultar("select 1 from pg_class where relname='salas_catalogo'")).toEqual([]);
  });

  it('si el catálogo ya se llama catalogo_salas, ejecutarla otra vez no hace nada', async () => {
    await db.exec(SQL);
    const [n] = await consultar<{ n: number }>("select count(*)::int n from catalogo_salas where id='sala-r1'");
    expect(n.n).toBe(1);
  });
});
