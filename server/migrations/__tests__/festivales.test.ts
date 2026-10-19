import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { cargarEsquema } from '../../audit/pgliteSchema';
import { conNombreAntiguo } from './helpers/nombreAntiguoSalas';

const FICHERO = '20261111_festivales.sql';
const SQL = fs.readFileSync(path.resolve(__dirname, '../../../supabase/migrations', FICHERO), 'utf8');

let db: PGlite;
let errores: Array<{ fichero: string; mensaje: string }>;

beforeAll(async () => {
  const carga = await cargarEsquema();
  db = carga.db;
  errores = carga.errores;
}, 120_000);

const consultar = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const falla = async (sql: string) => { await expect(db.exec(sql)).rejects.toThrow(); };

describe('migración del directorio de festivales', () => {
  it('se aplica sin errores sobre el esquema real y es idempotente', async () => {
    expect(errores.filter((e) => e.fichero.includes('festivales'))).toEqual([]);
    await conNombreAntiguo(db, async () => {
      await db.exec(SQL);
      await db.exec(SQL);
    });
    const t = await consultar<{ n: number }>("select count(*)::int n from information_schema.tables where table_name in ('catalogo_festivales','catalogo_festival_ediciones','catalogo_festival_convocatorias')");
    expect(t[0].n).toBe(3);
  });

  it('las tres tablas tienen RLS activada y ninguna política: solo el servidor escribe', async () => {
    const r = await consultar<{ relname: string; relrowsecurity: boolean }>("select relname, relrowsecurity from pg_class where relname in ('catalogo_festivales','catalogo_festival_ediciones','catalogo_festival_convocatorias')");
    expect(r).toHaveLength(3);
    expect(r.every((x) => x.relrowsecurity)).toBe(true);
    const pol = await consultar<{ n: number }>("select count(*)::int n from pg_policies where tablename in ('catalogo_festivales','catalogo_festival_ediciones','catalogo_festival_convocatorias')");
    expect(pol[0].n).toBe(0);
  });

  it('una candidata solo necesita nombre; el resto de valores por defecto son prudentes', async () => {
    await db.exec("insert into catalogo_festivales (id, nombre) values ('f-prueba', 'Festival de Prueba')");
    const [f] = await consultar<{ estado_revision: string; tipo_evento: string; pais: string }>("select estado_revision, tipo_evento, pais from catalogo_festivales where id='f-prueba'");
    expect(f).toEqual({ estado_revision: 'candidata', tipo_evento: 'festival', pais: 'ES' });
  });

  it('rechaza slugs inseguros, estados inválidos, meses fuera de rango y plazos al revés', async () => {
    await falla("insert into catalogo_festivales (id, nombre) values ('Mal Slug', 'x')");
    await falla("insert into catalogo_festivales (id, nombre, estado_revision) values ('f-x', 'x', 'publicada')");
    await falla("insert into catalogo_festivales (id, nombre, mes_tipico) values ('f-y', 'x', 13)");
    await falla("insert into catalogo_festival_convocatorias (id, festival_id, url, abre, cierra) values ('c-1', 'f-prueba', 'https://x.example', '2027-02-01', '2027-01-01')");
    await falla("insert into catalogo_festival_convocatorias (id, festival_id, url, admite_independientes) values ('c-2', 'f-prueba', 'https://x.example', 'quizá')");
  });

  it('los requisitos de una convocatoria son «desconocido» por defecto, nunca «no»', async () => {
    await db.exec("insert into catalogo_festival_convocatorias (id, festival_id, url) values ('c-ok', 'f-prueba', 'https://x.example/bases')");
    const [c] = await consultar<Record<string, string>>("select admite_independientes, exige_sello_o_agencia, exige_residencia, cuota, estado from catalogo_festival_convocatorias where id='c-ok'");
    expect(c).toEqual({ admite_independientes: 'desconocido', exige_sello_o_agencia: 'desconocido', exige_residencia: 'desconocido', cuota: 'desconocido', estado: 'no_anunciada' });
  });

  it('una edición por año y festival, y al borrar el festival se borran sus ediciones y convocatorias', async () => {
    await db.exec("insert into catalogo_festival_ediciones (id, festival_id, anio) values ('e-1', 'f-prueba', 2027)");
    await falla("insert into catalogo_festival_ediciones (id, festival_id, anio) values ('e-2', 'f-prueba', 2027)");
    await db.exec("delete from catalogo_festivales where id='f-prueba'");
    const r = await consultar<{ n: number }>("select (select count(*) from catalogo_festival_ediciones where festival_id='f-prueba')::int + (select count(*) from catalogo_festival_convocatorias where festival_id='f-prueba')::int n");
    expect(r[0].n).toBe(0);
  });

  it('borrar una sala del catálogo no borra el festival enlazado', async () => {
    await db.exec("insert into catalogo_salas (id, clave, nombre) values ('sala-f', 'nc:festival enlazado|soria', 'Festival Enlazado')");
    await db.exec("insert into catalogo_festivales (id, nombre, sala_id) values ('f-enlazado', 'Festival Enlazado', 'sala-f')");
    await db.exec("delete from catalogo_salas where id='sala-f'");
    const [f] = await consultar<{ sala_id: string | null }>("select sala_id from catalogo_festivales where id='f-enlazado'");
    expect(f.sala_id).toBeNull();
  });
});

describe('migración de la procedencia de las salas', () => {
  const SQL_FUENTES = fs.readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261112_salas_fuentes.sql'), 'utf8');
  it('añade `fuentes` a las salas con lista vacía por defecto, es idempotente y no toca las filas existentes', async () => {
    await db.exec("insert into catalogo_salas (id, clave, nombre) values ('sala-previa', 'nc:previa|madrid', 'Sala previa') on conflict do nothing");
    await conNombreAntiguo(db, async () => {
      await db.exec(SQL_FUENTES);
      await db.exec(SQL_FUENTES);
    });
    const [f] = await consultar<{ fuentes: string[]; nombre: string }>("select fuentes, nombre from catalogo_salas where id='sala-previa'");
    expect(f).toEqual({ fuentes: [], nombre: 'Sala previa' });
    await db.exec("update catalogo_salas set fuentes = array['osm'] where id='sala-previa'");
    const [g] = await consultar<{ fuentes: string[] }>("select fuentes from catalogo_salas where id='sala-previa'");
    expect(g.fuentes).toEqual(['osm']);
  });
});

