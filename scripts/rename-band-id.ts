/**
 * Reasigna el id de una banda en todos los datos persistidos.
 *
 * Uso: tsx scripts/rename-band-id.ts <id_antiguo> <id_nuevo> [--apply]
 *
 * Sin `--apply` solo informa de lo que cambiaría (simulación). Cubre `data.json` (instalación local)
 * y, si hay credenciales de Supabase, todas las tablas con columna `band_id` de `supabase_schema.sql`,
 * más `users.main_band_id` y `users.band_order`.
 */
import fs from 'fs';
import path from 'path';
import { getSupabase } from '../server/db/core.js';
import { bandIdVariants, renameBandIdInValue } from '../server/utils/renameBandId.js';

const [oldId, newId, ...flags] = process.argv.slice(2);
const apply = flags.includes('--apply');

if (!oldId || !newId || oldId === newId) {
  console.error('Uso: tsx scripts/rename-band-id.ts <id_antiguo> <id_nuevo> [--apply]');
  process.exit(1);
}

const variants = bandIdVariants(oldId, newId);

/** Tablas de `supabase_schema.sql` que declaran una columna `band_id`. */
function tablesWithBandId(): string[] {
  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase_schema.sql'), 'utf8');
  const tables: string[] = [];
  const re = /CREATE TABLE IF NOT EXISTS (?:public\.)?(\w+)\s*\(([\s\S]*?)\n\);/g;
  for (let m = re.exec(sql); m; m = re.exec(sql)) {
    if (/^\s*band_id\s/m.test(m[2])) tables.push(m[1]);
  }
  return tables;
}

function migrateDataFile(): void {
  const file = path.join(process.cwd(), 'data.json');
  if (!fs.existsSync(file)) return console.log('data.json: no existe, se omite.');
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  const migrated = renameBandIdInValue(state, variants);
  const changed = JSON.stringify(state) !== JSON.stringify(migrated);
  console.log(`data.json: ${changed ? 'hay cambios' : 'sin cambios'}`);
  if (changed && apply) fs.writeFileSync(file, JSON.stringify(migrated, null, 2));
}

async function migrateSupabase(): Promise<void> {
  if (!process.env.SUPABASE_URL) return console.log('Supabase: SUPABASE_URL no definido, se omite.');
  const sb = getSupabase();
  for (const table of tablesWithBandId()) {
    for (const [from, to] of variants) {
      const query = sb.from(table);
      const { count, error } = apply
        ? await query.update({ band_id: to }, { count: 'exact' }).eq('band_id', from)
        : await query.select('band_id', { count: 'exact', head: true }).eq('band_id', from);
      if (error) console.warn(`${table}: ${error.message}`);
      else if (count) console.log(`${table}: ${count} filas (${from} → ${to})`);
    }
  }
  for (const [from, to] of variants) {
    const { error } = apply ? await sb.from('users').update({ main_band_id: to }).eq('main_band_id', from) : { error: null };
    if (error) console.warn(`users.main_band_id: ${error.message}`);
  }
  const { data: users } = await sb.from('users').select('id, band_order').not('band_order', 'is', null);
  for (const user of users ?? []) {
    const order = renameBandIdInValue(user.band_order, variants);
    if (JSON.stringify(order) === JSON.stringify(user.band_order)) continue;
    console.log(`users.band_order: ${user.id}`);
    if (apply) await sb.from('users').update({ band_order: order }).eq('id', user.id);
  }
}

console.log(`${apply ? 'APLICANDO' : 'SIMULACIÓN'}: ${[...variants].map(([a, b]) => `${a} → ${b}`).join(', ')}`);
migrateDataFile();
await migrateSupabase();
console.log(apply ? 'Hecho. Reinicia el servidor para vaciar la caché de estado.' : 'Simulación terminada: añade --apply para ejecutar.');
