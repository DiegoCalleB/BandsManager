// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Guarda de arquitectura, no de una función concreta: server/db/*.ts recibe (objeto, bandId) en
 * casi todas sus funciones de escritura, donde 'bandId' ya viene resuelto por la ruta a partir
 * de la sesión (req.user.band_id) y es el único origen de confianza. Se encontró — y se corrigió
 * en campaigns.ts, leads.ts, fans.ts, contacts.ts, concerts.ts, payments.ts, rehearsals.ts,
 * repertoire.ts (songs y setlists), social.ts (posts/métricas/contenido) y tours.ts — el mismo
 * fallo repetido: 'cleanBandId(objeto.band_id || bandId)' prioriza el band_id que venga en el
 * CUERPO de la petición, sin validar, sobre la banda real de la sesión. Cualquier usuario
 * autenticado podía escribir en la banda de otro con solo incluir "band_id" en el body.
 *
 * En vez de fijar ese comportamiento con un test por función (que no protege ningún fichero
 * nuevo ni ya existente que no se haya tocado todavía), este test escanea el código fuente:
 * ninguna llamada a cleanBandId() puede tener como argumento un campo de un objeto seguido de
 * '||' — la única entrada válida es la variable de sesión sola. Server/db/users.ts queda fuera
 * a propósito: dbUpsertUser/dbUpsertUserBand no reciben un segundo 'bandId' de sesión con el que
 * comparar (el band_id ES el dato que gestionan), así que no es el mismo patrón y necesita su
 * propia revisión de autorización en server/routes/users.ts, no este barrido mecánico.
 */
describe('límite de confianza de band_id en server/db', () => {
  const DIR = path.join(__dirname, '..');
  const EXCLUIDOS = new Set(['users.ts']);
  const PATRON_PELIGROSO = /cleanBandId\(\s*[a-zA-Z_$][\w.]*\.(band_id|bandId)\s*\|\|/;

  const ficheros = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.ts') && !fs.statSync(path.join(DIR, f)).isDirectory() && !EXCLUIDOS.has(f));

  it('no deja ningún server/db/*.ts con la lista de ficheros vacía por error de ruta', () => {
    // Si esto falla, es que __dirname ya no apunta a server/db/__tests__ y el resto del test
    // estaría revisando cero ficheros sin que nadie se diera cuenta.
    expect(ficheros.length).toBeGreaterThan(5);
  });

  for (const fichero of ficheros) {
    it(`${fichero}: cleanBandId() nunca prioriza un band_id del objeto sobre el de la sesión`, () => {
      const contenido = fs.readFileSync(path.join(DIR, fichero), 'utf-8');
      const match = contenido.match(PATRON_PELIGROSO);
      expect(match, match ? `Encontrado: "${match[0]}"` : undefined).toBeNull();
    });
  }
});
