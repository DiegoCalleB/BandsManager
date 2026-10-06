/**
 * AUDITORÍA 2 — Round-trip de guardado en la base de datos real (esquema + triggers + CHECK).
 * Cada columna de cada tabla debe conservar un UPDATE. Es la red de seguridad contra el bug
 * que nos hizo perder días: un trigger BEFORE UPDATE que devolvía OLD y descartaba en silencio
 * todas las ediciones de epk_configs, leads, conciertos...
 */
import { describe, expect, it } from 'vitest';
import { cargarEsquema } from '../pgliteSchema';
import { auditarTodas } from '../dbRoundTrip';

/** Tablas que no admiten fila de prueba por diseño (con motivo). */
const SALTADAS_ACEPTADAS: Record<string, string> = {
  data_change_history: 'registro append-only alimentado por triggers; no se edita',
};

describe('round-trip de guardado en BD', () => {
  it('todas las columnas conservan un UPDATE', async () => {
    const { db } = await cargarEsquema();
    const res = await auditarTodas(db);

    const fallos = res.filter((r) => r.estado === 'fallos').map((r) => `${r.tabla}: ${r.noPersistidas.join(', ')}`);
    expect(fallos).toEqual([]);

    const saltadasSinMotivo = res.filter((r) => r.estado === 'saltada' && !(r.tabla in SALTADAS_ACEPTADAS)).map((r) => `${r.tabla}: ${r.motivo}`);
    expect(saltadasSinMotivo).toEqual([]);

    // Si la auditoría casi no comprueba nada, tampoco protege nada.
    expect(res.reduce((a, r) => a + r.columnasComprobadas, 0)).toBeGreaterThan(400);
  }, 180_000);

  it('CANARIO: detecta un trigger BEFORE UPDATE que devuelve OLD (el bug de epk_configs)', async () => {
    const { db } = await cargarEsquema();
    await db.exec(`
      CREATE OR REPLACE FUNCTION public.fn_capture_row_history() RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN RETURN OLD; END $$;
    `);
    const res = await auditarTodas(db);
    const conFallos = res.filter((r) => r.estado === 'fallos');
    expect(conFallos.length).toBeGreaterThan(0);
    expect(conFallos.some((r) => r.tabla === 'epk_configs')).toBe(true);
  }, 180_000);
});
