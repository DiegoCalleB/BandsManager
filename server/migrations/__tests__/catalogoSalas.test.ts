import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { cargarEsquema } from '../../audit/pgliteSchema';

const FICHERO = '20261108_catalogo_salas.sql';
const SQL = fs.readFileSync(path.resolve(__dirname, '../../../supabase/migrations', FICHERO), 'utf8');

let db: PGlite;
let errores: Array<{ fichero: string; mensaje: string }>;

beforeAll(async () => {
  const carga = await cargarEsquema();
  db = carga.db;
  errores = carga.errores;
}, 120_000);

const consultar = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;

describe('migración del catálogo de salas', () => {
  it('se aplica sin errores sobre el esquema real', () => {
    expect(errores.filter((e) => e.fichero.includes('catalogo_salas'))).toEqual([]);
  });

  it('es idempotente: ejecutarla otra vez no falla ni cambia nada', async () => {
    await db.exec(SQL);
    await db.exec(SQL);
    const tablas = await consultar<{ n: number }>("select count(*)::int n from information_schema.tables where table_name='salas_catalogo'");
    expect(tablas[0].n).toBe(1);
  });

  it('añade leads.sala_id como columna opcional: los leads existentes no necesitan nada', async () => {
    const col = await consultar<{ is_nullable: string }>("select is_nullable from information_schema.columns where table_name='leads' and column_name='sala_id'");
    expect(col[0].is_nullable).toBe('YES');
    await db.exec("insert into registered_bands (id, band_id, nombre_banda, email) values ('b-test', 'b-test', 'Banda de prueba', 'b@test.example') on conflict do nothing");
    await db.exec("insert into leads (id, band_id, nombre_sala) values ('lead-1', 'b-test', 'Sala Test')");
    const [lead] = await consultar<{ sala_id: string | null; estado: string }>("select sala_id, estado from leads where id='lead-1'");
    expect(lead).toEqual({ sala_id: null, estado: 'nuevo' });
  });

  it('la tabla no guarda nada de ninguna banda: no tiene band_id ni columnas de notas, pitch o estado de lead', async () => {
    const cols = (await consultar<{ column_name: string }>("select column_name from information_schema.columns where table_name='salas_catalogo'")).map((c) => c.column_name);
    expect(cols).not.toContain('band_id');
    for (const privada of ['notas', 'pitch_generado', 'estado', 'historial_contacto', 'hilo_emails']) expect(cols).not.toContain(privada);
  });

  it('solo el servidor accede: RLS activada', async () => {
    const [t] = await consultar<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where relname='salas_catalogo'");
    expect(t.relrowsecurity).toBe(true);
  });

  it('las restricciones rechazan datos incoherentes', async () => {
    const insertar = (extra: string) => db.exec(`insert into salas_catalogo (id, clave, nombre ${extra.split('|')[0]}) values ('x${Math.random()}', 'k${Math.random()}', 'n' ${extra.split('|')[1]})`);
    await expect(insertar(', nivel|, \'inventado\'')).rejects.toThrow();
    await expect(insertar(', puntuacion|, 101')).rejects.toThrow();
    await expect(insertar(', aforo|, 0')).rejects.toThrow();
    await expect(insertar(', rebotes|, -1')).rejects.toThrow();
    await expect(insertar('|')).resolves.not.toThrow();
  });

  it('la clave es única: no puede haber dos filas de la misma sala', async () => {
    await db.exec("insert into salas_catalogo (id, clave, nombre) values ('s1', 'nc:a|b', 'A')");
    await expect(db.exec("insert into salas_catalogo (id, clave, nombre) values ('s2', 'nc:a|b', 'A')")).rejects.toThrow();
  });

  it('borrar una sala del catálogo desenlaza los leads pero nunca los borra', async () => {
    await db.exec("insert into salas_catalogo (id, clave, nombre) values ('s3', 'nc:c|d', 'C')");
    await db.exec("update leads set sala_id='s3' where id='lead-1'");
    await db.exec("delete from salas_catalogo where id='s3'");
    const [lead] = await consultar<{ sala_id: string | null }>("select sala_id from leads where id='lead-1'");
    expect(lead.sala_id).toBeNull();
  });

  it('no se puede enlazar un lead con una sala que no existe', async () => {
    await expect(db.exec("update leads set sala_id='no-existe' where id='lead-1'")).rejects.toThrow();
  });
});
