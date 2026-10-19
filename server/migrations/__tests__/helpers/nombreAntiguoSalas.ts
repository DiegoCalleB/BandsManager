import type { PGlite } from '@electric-sql/pglite';

/**
 * `salas_catalogo` pasó a llamarse `catalogo_salas` (migración 20261114). Las migraciones anteriores siguen refiriéndose
 * al nombre antiguo, así que para volver a ejecutarlas en una prueba de idempotencia se le devuelve su nombre un momento.
 * En producción cada migración se aplica una sola vez, en orden.
 */
export async function conNombreAntiguo(db: PGlite, fn: () => Promise<void>): Promise<void> {
  await db.exec('ALTER TABLE catalogo_salas RENAME TO salas_catalogo');
  try {
    await fn();
  } finally {
    await db.exec('ALTER TABLE salas_catalogo RENAME TO catalogo_salas');
  }
}
