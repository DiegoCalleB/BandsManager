import type { PGlite } from '@electric-sql/pglite';

/** Tablas renombradas por la migración 20261114 (nombre antiguo → nombre nuevo). */
export const RENOMBRADAS: ReadonlyArray<readonly [string, string]> = [
  ['salas_catalogo', 'catalogo_salas'],
  ['festivales', 'catalogo_festivales'],
  ['festival_ediciones', 'catalogo_festival_ediciones'],
  ['festival_convocatorias', 'catalogo_festival_convocatorias'],
];

/**
 * Las migraciones anteriores a la 20261114 siguen refiriéndose a los nombres antiguos de las tablas del catálogo, así que para
 * volver a ejecutarlas en una prueba de idempotencia se les devuelve su nombre un momento. En producción cada migración se
 * aplica una sola vez, en orden.
 */
export async function conNombreAntiguo(db: PGlite, fn: () => Promise<void>): Promise<void> {
  for (const [antiguo, nuevo] of RENOMBRADAS) await db.exec(`ALTER TABLE ${nuevo} RENAME TO ${antiguo}`);
  try {
    await fn();
  } finally {
    for (const [antiguo, nuevo] of RENOMBRADAS) await db.exec(`ALTER TABLE ${antiguo} RENAME TO ${nuevo}`);
  }
}
