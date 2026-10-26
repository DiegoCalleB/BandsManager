// Logo de una sala a partir de su web: el icono del dominio, por referencia. No se descarga ni se guarda ningún fichero
// (así no se copian imágenes ajenas), y es lo mismo que ya usan los leads al enriquecerse.

/** URL del icono del dominio de la web de la sala, o null si no hay una web utilizable. */
export function logoDeSala(website: string | null | undefined, tamano = 128): string | null {
  const w = (website ?? '').trim();
  if (!w) return null;
  try {
    const host = new URL(/^https?:\/\//i.test(w) ? w : `https://${w}`).hostname.replace(/^www\./i, '');
    return host.includes('.') ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${tamano}` : null;
  } catch {
    return null;
  }
}
