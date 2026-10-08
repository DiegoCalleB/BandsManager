/**
 * Normaliza lo que haya guardado como Instagram de una banda: `@usuario`, `usuario`,
 * `instagram.com/usuario` o la URL completa (con `?igsh=…`, barra final, etc.).
 * Devuelve el usuario limpio y el enlace al perfil, o null si no parece un perfil.
 * Solo acepta nombres de usuario válidos de Instagram, así que el enlace no puede salirse
 * del dominio con texto libre.
 */

const USUARIO_VALIDO = /^[A-Za-z0-9._]{1,30}$/;
const RUTAS_NO_PERFIL = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'accounts', 'tv']);

export function instagramPerfil(valor?: string | null): { handle: string; url: string } | null {
  let texto = (valor || '').trim();
  if (!texto) return null;

  if (/instagram\.com\//i.test(texto) || /^https?:\/\//i.test(texto)) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    } catch {
      return null;
    }
    const host = url.hostname.toLowerCase();
    if (host !== 'instagram.com' && host !== 'www.instagram.com') return null;
    const primera = url.pathname.split('/').filter(Boolean)[0] || '';
    if (RUTAS_NO_PERFIL.has(primera.toLowerCase())) return null;
    texto = primera;
  }

  const handle = texto.replace(/^@/, '').trim();
  if (!USUARIO_VALIDO.test(handle)) return null;
  return { handle, url: `https://instagram.com/${handle}` };
}
