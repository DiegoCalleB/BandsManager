import crypto from 'crypto';

/**
 * Contraseña con la que se crean las cuentas de ejemplo de la semilla (`src/db_seed.ts`).
 *
 * El repositorio es público, así que ninguna contraseña va escrita en él. Con `SEED_USER_PASSWORD`
 * (mínimo 8 caracteres) todas las cuentas de ejemplo entran con esa clave: es lo que usan el
 * desarrollo local y los E2E. Sin ella, cada cuenta recibe una contraseña aleatoria que nadie
 * conoce, así que un servidor de producción nunca crea cuentas con una clave predecible.
 */
export function contrasenaSemilla(env: NodeJS.ProcessEnv = process.env): string {
  const fija = env.SEED_USER_PASSWORD || '';
  if (fija.length >= 8) return fija;
  return crypto.randomBytes(18).toString('base64url');
}
