/**
 * Comprueba que TODOS los modelos de Google registrados en server/utils/modelosGemini.ts siguen
 * existiendo (models.list()). Sale con código 1 si alguno ya no está: así un modelo retirado salta
 * en CI/cron y no en la pantalla de un usuario.
 *
 *   GEMINI_API_KEY=... npm run check:modelos
 * Sin clave: avisa y sale 0 (no bloquea forks ni entornos sin secreto).
 */
import { GoogleGenAI } from '@google/genai';
import { modelosGoogleEnUso } from '../server/utils/modelosGemini.js';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn('[check:modelos] Sin GEMINI_API_KEY: no se puede comprobar. Saltando.');
  process.exit(0);
}

const client = new GoogleGenAI({ apiKey });
const disponibles = new Set<string>();
const pagina = await client.models.list({ config: { pageSize: 100 } });
for await (const m of pagina) {
  if (m.name) disponibles.add(m.name.replace(/^models\//, ''));
}
if (disponibles.size === 0) {
  console.error('[check:modelos] models.list() devolvió 0 modelos: no se puede validar.');
  process.exit(1);
}

const faltan = modelosGoogleEnUso().filter(({ id }) => !disponibles.has(id));
for (const { id, uso } of modelosGoogleEnUso()) {
  console.log(`${disponibles.has(id) ? '✔' : '✘'} ${id}  (${uso})`);
}
if (faltan.length > 0) {
  console.error(`\n[check:modelos] ${faltan.length} modelo(s) ya no existen en Google. Actualiza server/utils/modelosGemini.ts (o su variable de entorno).`);
  process.exit(1);
}
console.log('\n[check:modelos] OK');
