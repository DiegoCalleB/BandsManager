/**
 * Postgres local en memoria (PGlite) con el esquema REAL del proyecto: supabase_schema.sql y
 * después todas las migraciones en orden. Es la base de la auditoría de guardado: aquí se
 * ejecutan triggers, CHECK y NOT NULL de verdad, a diferencia de un fake en memoria.
 *
 * Diferencias asumidas con Supabase: pgvector no está en PGlite, así que las columnas
 * `vector(N)` se cargan como `text` (no afecta a lo que auditamos: columnas y triggers).
 */
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(__dirname, '../..');

export interface CargaEsquema {
  db: PGlite;
  /** Ficheros SQL que fallaron al cargarse (un esquema roto invalida el resto de la auditoría). */
  errores: Array<{ fichero: string; mensaje: string }>;
  ficheros: string[];
}

function adaptarParaPglite(sql: string): string {
  return sql
    .replace(/CREATE EXTENSION IF NOT EXISTS\s+"?vector"?\s*;/gi, '')
    .replace(/CREATE INDEX[^;]*USING hnsw[^;]*;/gi, '')
    .replace(/\bvector\(\d+\)/gi, 'text');
}

/** Parte un script en sentencias respetando los cuerpos $$ ... $$ (funciones y bloques DO). */
export function dividirSentencias(sql: string): string[] {
  const partes: string[] = [];
  let actual = '';
  let dentroDeDolar = false;
  for (const linea of sql.split('\n')) {
    actual += linea + '\n';
    if (((linea.match(/\$[a-zA-Z_]*\$/g) || []).length) % 2 === 1) dentroDeDolar = !dentroDeDolar;
    if (!dentroDeDolar && linea.trim().endsWith(';')) {
      partes.push(actual);
      actual = '';
    }
  }
  if (actual.trim()) partes.push(actual);
  return partes;
}

export function ficherosDeEsquema(): string[] {
  const migraciones = fs
    .readdirSync(path.join(RAIZ, 'supabase/migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => path.join('supabase/migrations', f));
  return ['supabase_schema.sql', ...migraciones];
}

export async function cargarEsquema(): Promise<CargaEsquema> {
  const db = new PGlite({ extensions: { uuid_ossp, pgcrypto } });
  const errores: CargaEsquema['errores'] = [];
  const ficheros = ficherosDeEsquema();
  // Roles que Supabase trae de serie y que los GRANT/REVOKE de las migraciones referencian.
  await db.exec(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
    END $$;
  `);
  // Stub mínimo del esquema `auth` de Supabase, que las políticas RLS de las migraciones referencian.
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
    CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT 'service_role'::text $$;
    CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
  `);
  for (const f of ficheros) {
    // Sentencia a sentencia: un fallo suelto no tumba el resto del fichero (como en el SQL Editor).
    for (const sentencia of dividirSentencias(adaptarParaPglite(fs.readFileSync(path.join(RAIZ, f), 'utf8')))) {
      try {
        await db.exec(sentencia);
      } catch (e: unknown) {
        errores.push({
          fichero: f,
          mensaje: `${String((e as Error)?.message || e).split('\n')[0]} :: ${sentencia.trim().slice(0, 90).replace(/\s+/g, ' ')}`,
        });
      }
    }
  }
  return { db, errores, ficheros };
}

/** tabla → columnas reales (en minúsculas), solo esquema `public` (tablas y vistas). */
export async function columnasPorTabla(db: PGlite): Promise<Map<string, Set<string>>> {
  const r = await db.query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`
  );
  const mapa = new Map<string, Set<string>>();
  for (const f of r.rows) {
    if (!mapa.has(f.table_name)) mapa.set(f.table_name, new Set());
    mapa.get(f.table_name)!.add(f.column_name);
  }
  return mapa;
}
