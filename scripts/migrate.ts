/**
 * Aplica las migraciones pendientes antes de arrancar el servidor (`npm start`).
 *
 * Necesita una conexión directa a Postgres: DATABASE_URL (o SUPABASE_DB_URL), la «Connection
 * string» de Supabase en modo Session pooler. La clave de servicio de la API no sirve: PostgREST
 * no ejecuta DDL.
 *
 *  - Sin URL: avisa y deja arrancar (como hasta ahora; las migraciones siguen siendo manuales).
 *  - Sin conexión: avisa y deja arrancar; no se puede comprobar, pero tampoco empeora nada.
 *  - Migración que falla: se revierte y sale con código 1, así Railway no promociona el despliegue.
 *  - `--check`: solo lista lo pendiente (útil en CI).
 */
import path from 'node:path';
import { Client } from 'pg';
import { aplicarMigraciones, MigracionFallida, type Ejecutor } from '../server/migrations/runner';

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const soloComprobar = process.argv.includes('--check');
const directorio = process.env.MIGRATIONS_DIR || path.join(process.cwd(), 'supabase', 'migrations');

async function conectar(): Promise<Client> {
  let ultimo: unknown;
  for (let intento = 1; intento <= 3; intento++) {
    const cliente = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10_000 });
    try {
      await cliente.connect();
      return cliente;
    } catch (e) {
      ultimo = e;
      await cliente.end().catch(() => {});
      await new Promise((r) => setTimeout(r, intento * 1000));
    }
  }
  throw ultimo;
}

async function main() {
  if (!url) {
    console.warn('[migraciones] DATABASE_URL no está definida: NO se aplican migraciones automáticas. Aplícalas a mano en Supabase.');
    return;
  }
  let cliente: Client;
  try {
    cliente = await conectar();
  } catch (e: any) {
    console.warn(`[migraciones] No se pudo conectar a la base de datos (${e?.message || e}). Se arranca sin comprobar migraciones.`);
    return;
  }

  const db: Ejecutor = {
    consultar: async (sql, parametros) => (await cliente.query(sql, parametros as any[])).rows,
    ejecutar: async (sql) => {
      await cliente.query(sql);
    },
  };

  try {
    const informe = await aplicarMigraciones(db, { directorio, soloComprobar, log: (m) => console.log(m) });
    if (soloComprobar) {
      console.log(informe.pendientes.length ? `Pendientes:\n- ${informe.pendientes.join('\n- ')}` : 'Sin migraciones pendientes.');
    }
  } finally {
    await cliente.end().catch(() => {});
  }
}

main().catch((e) => {
  if (e instanceof MigracionFallida) console.error(`[migraciones] ${e.message}`);
  else console.error('[migraciones] Error inesperado:', e);
  process.exit(1);
});
