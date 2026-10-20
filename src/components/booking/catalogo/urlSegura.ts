/** La url solo si es http(s): lo que viene de una web externa nunca se usa como enlace sin comprobarlo (`javascript:` y similares). */
export function urlSegura(valor: string | null | undefined): string | null {
  if (!valor) return null;
  try {
    const u = new URL(valor);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}
