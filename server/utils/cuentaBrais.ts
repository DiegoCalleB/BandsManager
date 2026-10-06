/**
 * ¿Es esta la cuenta de Brais (mouredev)? Decide si se le dan por defecto las bandas del
 * proyecto de ejemplo (Os Herdeiros do Código y Master of Prompts).
 *
 * Antes bastaba que el email CONTUVIERA «mouredev» o «brais»: como el registro es abierto y no
 * verifica el correo, quien se registrara con brais@loquesea.com recibía acceso a esas bandas.
 * Ahora solo cuenta el id de la cuenta sembrada o un email EXACTO (configurable con
 * BRAIS_EMAILS, separados por comas).
 */
const EMAILS_POR_DEFECTO = ['mouredev@gmail.com'];

export function emailsDeBrais(): string[] {
  const extra = (process.env.BRAIS_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return [...new Set([...EMAILS_POR_DEFECTO, ...extra])];
}

export function esCuentaDeBrais(usuario: { id?: string; email?: string } | null | undefined): boolean {
  if (!usuario) return false;
  if (usuario.id === 'user-mouredev') return true;
  const email = (usuario.email || '').trim().toLowerCase();
  return !!email && emailsDeBrais().includes(email);
}
