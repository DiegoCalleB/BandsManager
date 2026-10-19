import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { cargarEsquema } from '../../audit/pgliteSchema';
import { conNombreAntiguo } from './helpers/nombreAntiguoSalas';
import { normalizarTexto } from '../../utils/salaCatalogo';

const FICHERO = '20261113_catalogo_global_base.sql';
const SQL = fs.readFileSync(path.resolve(__dirname, '../../../supabase/migrations', FICHERO), 'utf8');
const TABLAS = ['catalogo_generos', 'catalogo_generos_alias', 'catalogo_sala_generos', 'catalogo_ingestas', 'catalogo_staging', 'catalogo_supresion'];
const EN_TABLAS = TABLAS.map((t) => `'${t}'`).join(',');
const HASH = 'a'.repeat(64);

let db: PGlite;
let errores: Array<{ fichero: string; mensaje: string }>;

beforeAll(async () => {
  const carga = await cargarEsquema();
  db = carga.db;
  errores = carga.errores;
}, 120_000);

const consultar = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const falla = async (sql: string) => { await expect(db.exec(sql)).rejects.toThrow(); };

describe('migración de la base del catálogo global', () => {
  it('se aplica sin errores sobre el esquema real y es idempotente', async () => {
    expect(errores.filter((e) => e.fichero.includes('catalogo_global'))).toEqual([]);
    await conNombreAntiguo(db, async () => {
      await db.exec(SQL);
      await db.exec(SQL);
    });
    const t = await consultar<{ n: number }>(`select count(*)::int n from information_schema.tables where table_name in (${EN_TABLAS})`);
    expect(t[0].n).toBe(TABLAS.length);
    const g = await consultar<{ n: number }>('select count(*)::int n from catalogo_generos');
    expect(g[0].n).toBe(34);
  });

  it('las tablas nuevas tienen RLS activada y ninguna política: solo el servidor escribe', async () => {
    const r = await consultar<{ relrowsecurity: boolean }>(`select relrowsecurity from pg_class where relname in (${EN_TABLAS})`);
    expect(r).toHaveLength(TABLAS.length);
    expect(r.every((x) => x.relrowsecurity)).toBe(true);
    const pol = await consultar<{ n: number }>(`select count(*)::int n from pg_policies where tablename in (${EN_TABLAS})`);
    expect(pol[0].n).toBe(0);
  });

  it('una sala escrita como hasta ahora (sin país ni coordenadas) sigue entrando y queda en España', async () => {
    await db.exec("insert into catalogo_salas (id, clave, nombre) values ('sala-g1', 'nc:sala global|madrid', 'Sala Global')");
    const [s] = await consultar<{ pais: string; lat: number | null; lon: number | null }>("select pais, lat, lon from catalogo_salas where id='sala-g1'");
    expect(s).toEqual({ pais: 'ES', lat: null, lon: null });
  });

  it('no añade CHECK nuevos a catalogo_salas: un tipo que hoy escribe el servidor sigue siendo válido', async () => {
    await db.exec("insert into catalogo_salas (id, clave, nombre, tipo) values ('sala-g2', 'nc:espacio|soria', 'Espacio', 'espacio_cultural')");
    const [s] = await consultar<{ tipo: string }>("select tipo from catalogo_salas where id='sala-g2'");
    expect(s.tipo).toBe('espacio_cultural');
  });

  it('cada alias ya está normalizado como normalizarTexto y apunta a un género existente', async () => {
    const alias = await consultar<{ alias: string }>('select alias from catalogo_generos_alias');
    expect(alias.length).toBeGreaterThan(50);
    for (const { alias: a } of alias) expect(normalizarTexto(a)).toBe(a);
    await falla("insert into catalogo_generos_alias (alias, genero_id) values ('Electrónica', 'electronica')");
    await falla("insert into catalogo_generos_alias (alias, genero_id) values ('noise', 'no-existe')");
  });

  it('la jerarquía de géneros solo apunta a padres que existen y nunca a sí misma', async () => {
    const huerfanos = await consultar<{ n: number }>('select count(*)::int n from catalogo_generos g where padre_id is not null and not exists (select 1 from catalogo_generos p where p.id = g.padre_id)');
    expect(huerfanos[0].n).toBe(0);
    await falla("insert into catalogo_generos (id, nombre_es, nombre_en, padre_id) values ('bucle', 'Bucle', 'Loop', 'bucle')");
    await falla("insert into catalogo_generos (id, nombre_es, nombre_en, wikidata_qid) values ('g-mal', 'x', 'x', 'q11399')");
  });

  it('los géneros de una sala desaparecen con la sala', async () => {
    await db.exec("insert into catalogo_sala_generos (sala_id, genero_id, fuente) values ('sala-g1', 'jazz', 'legacy_texto')");
    await db.exec("delete from catalogo_salas where id='sala-g1'");
    const r = await consultar<{ n: number }>("select count(*)::int n from catalogo_sala_generos where sala_id='sala-g1'");
    expect(r[0].n).toBe(0);
  });

  it('el staging de una ingesta rechaza estados inválidos y duplicados, y sobrevive a que se borre la sala', async () => {
    const [i] = await consultar<{ id: string }>("insert into catalogo_ingestas (fuente, pais) values ('wikidata', 'ES') returning id");
    await db.exec("insert into catalogo_salas (id, clave, nombre) values ('sala-g3', 'nc:festival global|soria', 'Festival Global')");
    const fila = (ext: string, extra = '') =>
      `insert into catalogo_staging (ingesta_id, fuente, external_id, licencia, datos${extra ? ', estado' : ''}) values ('${i.id}', 'wikidata', '${ext}', 'CC0', '{"nombre":"x"}'${extra ? `, '${extra}'` : ''})`;
    await db.exec(fila('Q1'));
    await falla(fila('Q1'));
    await falla(fila('Q2', 'aprobada'));
    await db.exec(`update catalogo_staging set sala_id='sala-g3', estado='enlazada' where external_id='Q1'`);
    await db.exec("delete from catalogo_salas where id='sala-g3'");
    const [s] = await consultar<{ sala_id: string | null; estado: string }>("select sala_id, estado from catalogo_staging where external_id='Q1'");
    expect(s).toEqual({ sala_id: null, estado: 'enlazada' });
    await falla(`insert into catalogo_ingestas (fuente, estado) values ('wikidata', 'quizá')`);
  });

  it('la supresión solo admite un SHA-256 hexadecimal y un motivo conocido, y no repite emails', async () => {
    await db.exec(`insert into catalogo_supresion (email_sha256, motivo) values ('${HASH}', 'baja')`);
    await falla(`insert into catalogo_supresion (email_sha256, motivo) values ('${HASH}', 'queja')`);
    await falla("insert into catalogo_supresion (email_sha256, motivo) values ('persona@ejemplo.test', 'baja')");
    await falla(`insert into catalogo_supresion (email_sha256, motivo) values ('${'b'.repeat(64)}', 'porque sí')`);
  });

  it('no toca leads: ni columnas nuevas ni triggers nuevos', async () => {
    const cols = await consultar<{ column_name: string }>("select column_name from information_schema.columns where table_name='leads' and column_name in ('pais','lat','lon')");
    expect(cols).toEqual([]);
    const trg = await consultar<{ n: number }>("select count(*)::int n from pg_trigger t join pg_proc p on p.oid = t.tgfoid where t.tgrelid = 'leads'::regclass and not t.tgisinternal and p.prosrc ilike '%catalogo_%'");
    expect(trg[0].n).toBe(0);
  });
});
