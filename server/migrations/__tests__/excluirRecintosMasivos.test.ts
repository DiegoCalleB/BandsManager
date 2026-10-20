import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { cargarEsquema } from '../../audit/pgliteSchema';

const SQL = fs.readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261116_excluir_recintos_masivos.sql'), 'utf8');

let db: PGlite;

beforeAll(async () => {
  db = (await cargarEsquema()).db;
}, 120_000);

describe('migración que excluye los recintos masivos', () => {
  it('borra los pabellones y los de más de 5.000 de aforo, y deja salas, festivales y nombres parecidos', async () => {
    await db.exec(`
      insert into catalogo_salas (id, clave, nombre, ciudad, tipo, aforo) values
        ('m1', 'nc:wizink center|madrid', 'WiZink Center', 'Madrid', 'sala', 11),
        ('m2', 'nc:movistar arena|madrid', 'Movistar Arena', 'Madrid', 'sala', 17000),
        ('m3', 'nc:pabellon|x', 'Pabellón Grande', 'X', 'sala', 6000),
        ('k1', 'nc:razzmatazz|barcelona', 'Razzmatazz', 'Barcelona', 'sala', 3000),
        ('k2', 'nc:vina rock|villarrobledo', 'Viña Rock', 'Villarrobledo', 'festival', 50000),
        ('k3', 'nc:movistar arenal|x', 'Sala Movistar Arenal', 'X', 'sala', 300);
    `);
    await db.exec(SQL);
    await db.exec(SQL);
    const quedan = (await db.query<{ id: string }>("select id from catalogo_salas where id in ('m1','m2','m3','k1','k2','k3') order by id")).rows.map((r) => r.id);
    expect(quedan).toEqual(['k1', 'k2', 'k3']);
  });
});
