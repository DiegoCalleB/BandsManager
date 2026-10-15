/**
 * Prueba de humo contra un proyecto Supabase REAL de pruebas.
 *
 * No corre en CI ni sin credenciales: exige `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y la
 * confirmación explícita `SUPABASE_TEST_CONFIRM=1` (para no ejecutarla por error contra producción).
 * Usa bandas con prefijo `smoke-test-` y limpia lo que crea.
 *
 * Ejecutar: `SUPABASE_TEST_CONFIRM=1 npx vitest run server/audit/__tests__/supabaseReal.smoke.test.ts`
 */
import { afterAll, describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { dbDeleteLead, dbGetLeads, dbUpsertLead } from '../../db/leads.js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const habilitada = Boolean(url && key && process.env.SUPABASE_TEST_CONFIRM === '1');

const TABLAS_CLAVE = ['leads', 'songs', 'social_posts', 'social_metrics', 'rehearsals', 'campaigns', 'lead_messages', 'autonomy_configs'];
const sufijo = Date.now().toString(36);
const bandaA = `smoke-test-a-${sufijo}`;
const bandaB = `smoke-test-b-${sufijo}`;
const idLead = `smoke-lead-${sufijo}`;

describe.skipIf(!habilitada)('Supabase real (proyecto de pruebas)', () => {
  const sb = createClient(url ?? 'http://localhost', key ?? 'sin-clave');

  afterAll(async () => {
    await dbDeleteLead(idLead, bandaA).catch(() => undefined);
    await sb.from('leads').delete().eq('id', idLead);
  });

  it.each(TABLAS_CLAVE)('la tabla %s existe y es legible', async (tabla) => {
    const { error } = await sb.from(tabla).select('*').limit(1);
    expect(error).toBeNull();
  });

  it('las columnas de la migración 20261102 existen', async () => {
    const { error } = await sb.from('rehearsals').select('tipo_evento, asunto, enlace_reunion').limit(1);
    expect(error).toBeNull();
    const posts = await sb.from('social_posts').select('*').limit(1);
    expect(posts.error).toBeNull();
  });

  it('escribe y lee un lead de la banda A, y la banda B no lo ve', async () => {
    await dbUpsertLead({ id: idLead, nombreSala: 'Sala de humo', ciudad: 'Madrid', estado: 'nuevo' }, bandaA);
    const deA = await dbGetLeads(bandaA);
    expect(deA.some((l) => l.id === idLead)).toBe(true);
    const deB = await dbGetLeads(bandaB);
    expect(deB.some((l) => l.id === idLead)).toBe(false);
  });
});
