import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { aplicarMigraciones, BASELINE_HASTA, MigracionFallida, type Ejecutor } from '../runner';

let db: PGlite;
let dir: string;
let ejecutor: Ejecutor;

const escribir = (nombre: string, sql: string) => fs.writeFileSync(path.join(dir, nombre), sql);
const existeTabla = async (t: string) =>
  (await db.query(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`, [t])).rows.length > 0;

beforeEach(() => {
  db = new PGlite();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migraciones-'));
  ejecutor = {
    consultar: async (sql, p) => (await db.query(sql, p as any[])).rows,
    ejecutar: async (sql) => {
      await db.exec(sql);
    },
  };
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('aplicador de migraciones', () => {
  it('primera vez: marca la línea base sin ejecutarla y aplica solo las posteriores', async () => {
    escribir('20260101_vieja.sql', 'ESTO NO ES SQL VALIDO;'); // si se ejecutara, fallaría
    escribir(BASELINE_HASTA, 'CREATE TABLE no_debe_existir (id INT);');
    escribir('20261009_nueva.sql', 'CREATE TABLE nueva (id INT PRIMARY KEY);');

    const informe = await aplicarMigraciones(ejecutor, { directorio: dir });

    expect(informe.baseline).toEqual(['20260101_vieja.sql', BASELINE_HASTA]);
    expect(informe.aplicadas).toEqual(['20261009_nueva.sql']);
    expect(await existeTabla('nueva')).toBe(true);
    expect(await existeTabla('no_debe_existir')).toBe(false);
  });

  it('es idempotente: la segunda ejecución no hace nada', async () => {
    escribir('20261009_nueva.sql', 'CREATE TABLE nueva (id INT PRIMARY KEY);');
    await aplicarMigraciones(ejecutor, { directorio: dir });
    const segunda = await aplicarMigraciones(ejecutor, { directorio: dir });
    expect(segunda.aplicadas).toEqual([]);
    expect(segunda.pendientes).toEqual([]);
  });

  it('una migración que falla se revierte entera, no se registra y corta la cadena', async () => {
    escribir('20261009_rota.sql', 'CREATE TABLE a_medias (id INT); SELECT * FROM tabla_que_no_existe;');
    escribir('20261010_siguiente.sql', 'CREATE TABLE siguiente (id INT);');

    await expect(aplicarMigraciones(ejecutor, { directorio: dir })).rejects.toBeInstanceOf(MigracionFallida);

    expect(await existeTabla('a_medias')).toBe(false); // revertida
    expect(await existeTabla('siguiente')).toBe(false); // no se llegó
    const registradas = (await db.query('SELECT nombre FROM schema_migrations')).rows.map((r: any) => r.nombre);
    expect(registradas).not.toContain('20261009_rota.sql');
  });

  it('tras arreglar la migración rota, el siguiente arranque la aplica', async () => {
    escribir('20261009_rota.sql', 'SELECT * FROM tabla_que_no_existe;');
    await expect(aplicarMigraciones(ejecutor, { directorio: dir })).rejects.toThrow();
    escribir('20261009_rota.sql', 'CREATE TABLE ya_bien (id INT);');
    const informe = await aplicarMigraciones(ejecutor, { directorio: dir });
    expect(informe.aplicadas).toEqual(['20261009_rota.sql']);
    expect(await existeTabla('ya_bien')).toBe(true);
  });

  it('--check lista lo pendiente sin ejecutar nada', async () => {
    escribir('20261009_nueva.sql', 'CREATE TABLE nueva (id INT);');
    const informe = await aplicarMigraciones(ejecutor, { directorio: dir, soloComprobar: true });
    expect(informe.pendientes).toEqual(['20261009_nueva.sql']);
    expect(await existeTabla('nueva')).toBe(false);
  });

  it('avisa si una migración ya aplicada se editó después', async () => {
    escribir('20261009_nueva.sql', 'CREATE TABLE nueva (id INT);');
    await aplicarMigraciones(ejecutor, { directorio: dir });
    escribir('20261009_nueva.sql', 'CREATE TABLE nueva (id INT, extra INT);');
    const logs: string[] = [];
    const informe = await aplicarMigraciones(ejecutor, { directorio: dir, log: (m) => logs.push(m) });
    expect(informe.alteradas).toEqual(['20261009_nueva.sql']);
    expect(logs.join('\n')).toMatch(/cambió desde que se aplicó/);
  });

  it('las migraciones reales del repo se aplican en una base vacía tras el esquema', async () => {
    // Garantiza que la migración pendiente de verdad (20261009) funciona con el runner.
    const real = path.resolve(__dirname, '../../../supabase/migrations');
    const { cargarEsquema } = await import('../../audit/pgliteSchema');
    const carga = await cargarEsquema();
    const informe = await aplicarMigraciones(
      {
        consultar: async (sql, p) => (await carga.db.query(sql, p as any[])).rows,
        ejecutar: async (sql) => {
          await carga.db.exec(sql);
        },
      },
      { directorio: real, soloComprobar: true }
    );
    expect(informe.baseline.length).toBeGreaterThan(20);
    expect(informe.pendientes.every((n) => n > BASELINE_HASTA)).toBe(true);
  }, 120_000);
});
