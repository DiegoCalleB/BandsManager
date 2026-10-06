/**
 * Aplicador de migraciones: ejecuta las de supabase/migrations/*.sql que aún no se hayan
 * aplicado, en orden, cada una en su transacción, y las registra en `schema_migrations`.
 *
 * Por qué existe: el código llegaba a producción antes que su migración (que se lanzaba a mano
 * en el SQL Editor), y entre medias cada guardado con columnas nuevas fallaba en silencio.
 * Con esto el arranque del servidor las aplica antes de atender peticiones.
 *
 * BASELINE: producción ya tiene aplicado a mano todo hasta BASELINE_HASTA. En la primera
 * ejecución (tabla de control vacía) esas migraciones se marcan como aplicadas SIN ejecutarlas,
 * porque no son idempotentes (políticas, triggers) y alguna ni siquiera encaja ya con el esquema.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const BASELINE_HASTA = '20261008_deal_support_neto_eur.sql';
const CLAVE_BLOQUEO = 727274;

/** Lo mínimo que necesita el runner de una conexión: vale `pg.Client` envuelto o PGlite. */
export interface Ejecutor {
  /** Consulta con parámetros. */
  consultar(sql: string, parametros?: unknown[]): Promise<any[]>;
  /** Script de varias sentencias, sin parámetros. */
  ejecutar(sql: string): Promise<void>;
}

export class MigracionFallida extends Error {
  constructor(public fichero: string, causa: string) {
    super(`La migración ${fichero} falló y se revirtió: ${causa}`);
    this.name = 'MigracionFallida';
  }
}

export interface InformeMigraciones {
  baseline: string[];
  aplicadas: string[];
  pendientes: string[];
  alteradas: string[];
}

export interface OpcionesRunner {
  directorio: string;
  /** Solo informa de lo pendiente, sin ejecutar nada. */
  soloComprobar?: boolean;
  log?: (mensaje: string) => void;
}

const sha = (texto: string) => crypto.createHash('sha256').update(texto, 'utf8').digest('hex');

export function listarMigraciones(directorio: string): Array<{ nombre: string; sql: string; checksum: string }> {
  return fs
    .readdirSync(directorio)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((nombre) => {
      const sql = fs.readFileSync(path.join(directorio, nombre), 'utf8');
      return { nombre, sql, checksum: sha(sql) };
    });
}

export async function aplicarMigraciones(db: Ejecutor, opciones: OpcionesRunner): Promise<InformeMigraciones> {
  const log = opciones.log ?? (() => {});
  const ficheros = listarMigraciones(opciones.directorio);
  const informe: InformeMigraciones = { baseline: [], aplicadas: [], pendientes: [], alteradas: [] };

  await db.ejecutar(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      origen TEXT NOT NULL DEFAULT 'runner',
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Un solo runner a la vez (varias réplicas arrancando a la vez no deben pisarse).
  if (!opciones.soloComprobar) await db.consultar('SELECT pg_advisory_lock($1)', [CLAVE_BLOQUEO]);

  try {
    let registradas = new Map<string, string>(
      (await db.consultar('SELECT nombre, checksum FROM schema_migrations')).map((r) => [r.nombre, r.checksum])
    );

    if (registradas.size === 0) {
      for (const f of ficheros.filter((x) => x.nombre <= BASELINE_HASTA)) {
        informe.baseline.push(f.nombre);
        if (!opciones.soloComprobar) {
          await db.consultar(
            `INSERT INTO schema_migrations (nombre, checksum, origen) VALUES ($1, $2, 'baseline') ON CONFLICT (nombre) DO NOTHING`,
            [f.nombre, f.checksum]
          );
        }
      }
      if (informe.baseline.length) log(`[migraciones] Línea base: ${informe.baseline.length} migraciones existentes marcadas como aplicadas.`);
      registradas = new Map(informe.baseline.map((n) => [n, ficheros.find((f) => f.nombre === n)!.checksum]));
    }

    for (const f of ficheros) {
      const previa = registradas.get(f.nombre);
      if (previa !== undefined) {
        if (previa !== f.checksum) informe.alteradas.push(f.nombre);
        continue;
      }
      informe.pendientes.push(f.nombre);
      if (opciones.soloComprobar) continue;

      log(`[migraciones] Aplicando ${f.nombre}…`);
      await db.ejecutar('BEGIN');
      try {
        await db.ejecutar(f.sql);
        await db.consultar(`INSERT INTO schema_migrations (nombre, checksum) VALUES ($1, $2)`, [f.nombre, f.checksum]);
        await db.ejecutar('COMMIT');
      } catch (e: any) {
        await db.ejecutar('ROLLBACK').catch(() => {});
        throw new MigracionFallida(f.nombre, String(e?.message || e).split('\n')[0]);
      }
      informe.aplicadas.push(f.nombre);
    }

    for (const n of informe.alteradas) {
      log(`[migraciones] AVISO: ${n} cambió desde que se aplicó. Las migraciones aplicadas no se editan: crea una nueva.`);
    }
    if (!informe.aplicadas.length && !opciones.soloComprobar) log('[migraciones] Esquema al día.');
    return informe;
  } finally {
    if (!opciones.soloComprobar) await db.consultar('SELECT pg_advisory_unlock($1)', [CLAVE_BLOQUEO]).catch(() => {});
  }
}
