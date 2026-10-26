import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * El repositorio es público: ninguna cuenta de la semilla puede llevar su contraseña escrita.
 * Las contraseñas de las cuentas de ejemplo salen de SEED_USER_PASSWORD o son aleatorias
 * (server/utils/contrasenaSemilla.ts).
 */
describe('semilla sin contraseñas', () => {
  const semilla = fs.readFileSync(path.join(__dirname, '..', 'db_seed.ts'), 'utf-8');

  it('db_seed.ts no define initialPassword', () => {
    expect(semilla).not.toMatch(/initialPassword/);
  });

  it('el servidor no lee initialPassword de la semilla', () => {
    const estado = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'state.ts'), 'utf-8');
    expect(estado).not.toMatch(/initialPassword/);
  });
});
