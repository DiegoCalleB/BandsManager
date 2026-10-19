import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { cargarEsquema } from '../../audit/pgliteSchema';
import { RENOMBRADAS, conNombreAntiguo } from './helpers/nombreAntiguoSalas';

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

describe('migración que pone el catálogo bajo el prefijo catalogo_', () => {
  it('se aplica sin errores y deja solo el nombre nuevo', async () => {
    expect(errores.filter((e) => e.fichero.includes('renombrar_salas_catalogo'))).toEqual([]);
    const t = await consultar<{ table_name: string }>("select table_name from information_schema.tables where table_schema='public' and table_name in ('salas_catalogo', 'catalogo_salas', 'festivales', 'festival_ediciones', 'festival_convocatorias', 'catalogo_festivales', 'catalogo_festival_ediciones', 'catalogo_festival_convocatorias') order by 1");
    expect(t.map((x) => x.table_name)).toEqual(['catalogo_festival_convocatorias', 'catalogo_festival_ediciones', 'catalogo_festivales', 'catalogo_salas']);
  });

  it('las claves ajenas de leads, festivales y géneros por sala siguen apuntando a la tabla (ahora con el nombre nuevo)', async () => {
    const fk = await consultar<{ tabla: string; destino: string }>(`
      select c.conrelid::regclass::text as tabla, c.confrelid::regclass::text as destino
      from pg_constraint c where c.contype = 'f' and c.confrelid = 'catalogo_salas'::regclass order by 1`);
    const origenes = fk.map((f) => f.tabla);
    for (const esperado of ['leads', 'catalogo_festivales', 'catalogo_sala_generos']) expect(origenes).toContain(esperado);
    expect(fk.every((f) => f.destino === 'catalogo_salas')).toBe(true);
  });

  it('ningún índice ni restricción de las tablas conserva el nombre antiguo', async () => {
    const tablas = "'catalogo_salas', 'catalogo_festivales', 'catalogo_festival_ediciones', 'catalogo_festival_convocatorias'";
    const i = await consultar<{ indexname: string }>(`select indexname from pg_indexes where tablename in (${tablas}) and (indexname like '%salas\\_catalogo%' or (indexname ~ '(^|[^_])festival(es|_ediciones|_convocatorias)' and indexname not like '%catalogo\\_festival%'))`);
    expect(i).toEqual([]);
    const c = await consultar<{ conname: string }>(`select conname from pg_constraint where conrelid in (${tablas.split(', ').map((t) => `${t}::regclass`).join(', ')}) and (conname like '%salas\\_catalogo%' or (conname ~ '(^|[^_])festival(es|_ediciones|_convocatorias)' and conname not like '%catalogo\\_festival%'))`);
    expect(c).toEqual([]);
    const nombres = (await consultar<{ indexname: string }>("select indexname from pg_indexes where tablename = 'catalogo_salas'")).map((x) => x.indexname);
    expect(nombres).toContain('catalogo_salas_pkey');
    expect(nombres).toContain('idx_catalogo_salas_nivel');
    const ids = (await consultar<{ indexname: string }>("select indexname from pg_indexes where tablename in ('catalogo_festivales', 'catalogo_festival_ediciones', 'catalogo_festival_convocatorias')")).map((x) => x.indexname);
    expect(ids).toEqual(expect.arrayContaining(['catalogo_festivales_pkey', 'idx_catalogo_festivales_revision', 'catalogo_festival_ediciones_pkey', 'idx_catalogo_festival_convocatorias_festival']));
  });

  it('conserva las filas, las claves ajenas y la RLS al renombrar tablas con datos, y es idempotente', async () => {
    await conNombreAntiguo(db, async () => {
      await db.exec("insert into salas_catalogo (id, clave, nombre) values ('sala-r1', 'nc:renombrada|soria', 'Sala renombrada')");
      await db.exec("insert into festivales (id, nombre, sala_id) values ('f-r1', 'Festival renombrado', 'sala-r1')");
      await db.exec("insert into festival_ediciones (id, festival_id, anio) values ('e-r1', 'f-r1', 2027)");
      await db.exec("insert into festival_convocatorias (id, festival_id, url) values ('c-r1', 'f-r1', 'https://x.example/bases')");
      await db.exec(SQL);
      await db.exec(SQL);
      expect(await consultar("select 1 from pg_class where relname in ('salas_catalogo', 'festivales', 'festival_ediciones', 'festival_convocatorias')")).toEqual([]);
      // Quedaron con el nombre nuevo: se les devuelve el antiguo para que el helper los restaure.
      for (const [antiguo, nuevo] of RENOMBRADAS) await db.exec(`ALTER TABLE ${nuevo} RENAME TO ${antiguo}`);
    });
    const [f] = await consultar<{ nombre: string; sala_id: string }>("select nombre, sala_id from catalogo_festivales where id='f-r1'");
    expect(f).toEqual({ nombre: 'Festival renombrado', sala_id: 'sala-r1' });
    expect((await consultar<{ n: number }>("select count(*)::int n from catalogo_festival_ediciones where festival_id='f-r1'"))[0].n).toBe(1);
    expect((await consultar<{ n: number }>("select count(*)::int n from catalogo_festival_convocatorias where festival_id='f-r1'"))[0].n).toBe(1);
    const [s] = await consultar<{ nombre: string }>("select nombre from catalogo_salas where id='sala-r1'");
    expect(s.nombre).toBe('Sala renombrada');
    const rls = await consultar<{ relname: string; relrowsecurity: boolean }>("select relname, relrowsecurity from pg_class where relname in ('catalogo_salas', 'catalogo_festivales', 'catalogo_festival_ediciones', 'catalogo_festival_convocatorias')");
    expect(rls).toHaveLength(4);
    expect(rls.every((x) => x.relrowsecurity)).toBe(true);
  });

  it('si el catálogo ya se llama catalogo_salas, ejecutarla otra vez no hace nada', async () => {
    await db.exec(SQL);
    const [n] = await consultar<{ n: number }>("select count(*)::int n from catalogo_salas where id='sala-r1'");
    expect(n.n).toBe(1);
  });
});
