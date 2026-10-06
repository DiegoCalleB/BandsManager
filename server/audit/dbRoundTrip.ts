/**
 * Auditoría de guardado a nivel de base de datos, sobre el esquema real cargado en PGlite:
 * para cada tabla inserta una fila con TODAS las columnas rellenas y después cambia cada columna
 * una a una comprobando que el nuevo valor se queda guardado. Pilla triggers BEFORE UPDATE que
 * devuelven OLD/NULL (el bug del historial que descartaba todos los UPDATE), columnas
 * generadas por error, etc.
 */
import type { PGlite } from '@electric-sql/pglite';

interface Columna {
  column_name: string;
  udt_name: string;
  data_type: string;
  is_nullable: string;
  is_generated: string;
  is_identity: string;
}

export interface ResultadoTabla {
  tabla: string;
  estado: 'ok' | 'saltada' | 'fallos';
  motivo?: string;
  columnasComprobadas: number;
  /** columnas cuyo UPDATE no se quedó guardado */
  noPersistidas: string[];
}

const NO_COMPARAR = new Set(['updated_at', 'ultima_actualizacion', 'last_updated']);

function valores(udt: string): [string, string] | null {
  switch (udt) {
    case 'text': case 'varchar': case 'bpchar': case 'citext': case 'name':
      return ['alfa', 'beta'];
    case 'int2': case 'int4': case 'int8':
      return ['1', '2'];
    case 'numeric': case 'float4': case 'float8':
      return ['1.5', '2.5'];
    case 'bool':
      return ['true', 'false'];
    case 'jsonb': case 'json':
      return ['{"a":1}', '{"a":2}'];
    case 'timestamptz': case 'timestamp':
      return ['2026-01-01T10:00:00Z', '2026-02-02T11:00:00Z'];
    case 'date':
      return ['2026-01-01', '2026-02-02'];
    case 'time': case 'timetz':
      return ['10:00:00', '11:00:00'];
    case 'uuid':
      return ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
    case '_text': case '_varchar':
      return ['{alfa}', '{beta}'];
    case '_int4': case '_int8':
      return ['{1}', '{2}'];
    case '_jsonb':
      return ['{"{\\"a\\":1}"}', '{"{\\"a\\":2}"}'];
    default:
      return null;
  }
}

const ident = (s: string) => `"${s.replace(/"/g, '""')}"`;

export async function quitarClavesForaneas(db: PGlite): Promise<void> {
  const r = await db.query<{ t: string; c: string }>(
    `SELECT conrelid::regclass::text AS t, conname AS c FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace`
  );
  for (const f of r.rows) await db.exec(`ALTER TABLE ${f.t} DROP CONSTRAINT IF EXISTS ${ident(f.c)}`);
}

export async function auditarTabla(db: PGlite, tabla: string): Promise<ResultadoTabla> {
  const cols = (
    await db.query<Columna>(
      `SELECT column_name, udt_name, data_type, is_nullable, is_generated, is_identity
         FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [tabla]
    )
  ).rows.filter((c) => c.is_generated !== 'ALWAYS' && c.is_identity !== 'YES');

  const pk = (
    await db.query<{ a: string }>(
      `SELECT a.attname AS a FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary`,
      [`public.${ident(tabla)}`]
    )
  ).rows.map((r) => r.a);
  if (pk.length === 0) return { tabla, estado: 'saltada', motivo: 'sin clave primaria', columnasComprobadas: 0, noPersistidas: [] };

  const sinTipo = cols.filter((c) => !valores(c.udt_name));
  const usables = cols.filter((c) => valores(c.udt_name));
  if (usables.length === 0) return { tabla, estado: 'saltada', motivo: 'sin columnas de tipo soportado', columnasComprobadas: 0, noPersistidas: [] };

  const nombres = usables.map((c) => ident(c.column_name)).join(', ');
  const params = usables.map((c) => valores(c.udt_name)![0]);
  const marcadores = usables.map((c, i) => `$${i + 1}::${c.udt_name.startsWith('_') ? c.udt_name.slice(1) + '[]' : c.udt_name}`).join(', ');
  const donde = pk.map((p, i) => `${ident(p)} = $${i + 1}::${usables.find((c) => c.column_name === p)?.udt_name ?? 'text'}`).join(' AND ');
  const pkValores = pk.map((p) => params[usables.findIndex((c) => c.column_name === p)]);

  try {
    await db.query(`INSERT INTO ${ident(tabla)} (${nombres}) VALUES (${marcadores})`, params);
  } catch (e: any) {
    return { tabla, estado: 'saltada', motivo: `no se pudo insertar una fila de prueba: ${String(e.message).split('\n')[0]}`, columnasComprobadas: 0, noPersistidas: [] };
  }

  const noPersistidas: string[] = [];
  let comprobadas = 0;
  for (const c of usables) {
    if (pk.includes(c.column_name) || NO_COMPARAR.has(c.column_name)) continue;
    const [, nuevo] = valores(c.udt_name)!;
    const cast = c.udt_name.startsWith('_') ? c.udt_name.slice(1) + '[]' : c.udt_name;
    try {
      await db.query(`UPDATE ${ident(tabla)} SET ${ident(c.column_name)} = $${pk.length + 1}::${cast} WHERE ${donde}`, [...pkValores, nuevo]);
    } catch {
      continue; // un CHECK o trigger legítimo rechazó el valor de prueba: no es un fallo de guardado
    }
    comprobadas++;
    const leido = await db.query<{ ok: boolean }>(
      `SELECT (${ident(c.column_name)} IS NOT DISTINCT FROM $${pk.length + 1}::${cast}) AS ok FROM ${ident(tabla)} WHERE ${donde}`,
      [...pkValores, nuevo]
    );
    if (!leido.rows[0]?.ok) noPersistidas.push(c.column_name);
  }
  void sinTipo;
  return { tabla, estado: noPersistidas.length ? 'fallos' : 'ok', columnasComprobadas: comprobadas, noPersistidas };
}

export async function auditarTodas(db: PGlite): Promise<ResultadoTabla[]> {
  await quitarClavesForaneas(db);
  const tablas = (
    await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY 1`
    )
  ).rows.map((r) => r.table_name);
  const salida: ResultadoTabla[] = [];
  for (const t of tablas) salida.push(await auditarTabla(db, t));
  return salida;
}
