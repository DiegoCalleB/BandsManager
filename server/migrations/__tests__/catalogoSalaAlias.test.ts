import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { cargarEsquema } from '../../audit/pgliteSchema';

const SQL = fs.readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261115_catalogo_sala_alias.sql'), 'utf8');

let db: PGlite;
let errores: Array<{ fichero: string; mensaje: string }>;

beforeAll(async () => {
  const carga = await cargarEsquema();
  db = carga.db;
  errores = carga.errores;
}, 120_000);

const consultar = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows;

describe('migración de alias de salas', () => {
  it('se aplica sin errores sobre el esquema real y es idempotente', async () => {
    expect(errores.filter((e) => e.fichero.includes('sala_alias'))).toEqual([]);
    await db.exec(SQL);
    await db.exec(SQL);
    const [r] = await consultar<{ n: number }>('select count(*)::int n from catalogo_sala_alias');
    expect(r.n).toBe(7);
  });

  it('tiene RLS activada y ninguna política: solo el servidor la escribe', async () => {
    const [t] = await consultar<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where relname='catalogo_sala_alias'");
    expect(t.relrowsecurity).toBe(true);
    const [p] = await consultar<{ n: number }>("select count(*)::int n from pg_policies where tablename='catalogo_sala_alias'");
    expect(p.n).toBe(0);
  });

  it('un alias no puede apuntar a sí mismo', async () => {
    await expect(db.exec("insert into catalogo_sala_alias (alias_clave, clave) values ('nc:x|madrid', 'nc:x|madrid')")).rejects.toThrow();
  });

  it('funde la fila duplicada en la canónica: pasan los leads, se borra el duplicado y se fija el nombre público', async () => {
    await db.exec(`
      insert into catalogo_salas (id, clave, nombre, ciudad) values
        ('sala-canon', 'nc:clamores|madrid', 'Clamores', 'Madrid'),
        ('sala-dup', 'nc:sala clamores|madrid', 'Sala Clamores', 'Madrid');
      insert into catalogo_sala_generos (sala_id, genero_id, fuente) values ('sala-dup', 'rock', 'test');
    `);
    await db.exec(SQL);
    const salas = await consultar<{ id: string; nombre: string }>("select id, nombre from catalogo_salas where id in ('sala-canon','sala-dup')");
    expect(salas).toEqual([{ id: 'sala-canon', nombre: 'Sala Clamores' }]);
    const g = await consultar<{ sala_id: string }>("select sala_id from catalogo_sala_generos where genero_id='rock' and fuente='test'");
    expect(g).toEqual([{ sala_id: 'sala-canon' }]);
  });
});
