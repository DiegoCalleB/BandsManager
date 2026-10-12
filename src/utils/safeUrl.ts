// Enlaces de perfil de banda (dossier, rider, web, redes, Revolut/PayPal...) se guardan como
// texto libre editable por el admin de la banda y se renderizan como href en páginas públicas
// (EPK, landing de fans) que ve cualquier visitante sin sesión. Sin filtrar el esquema, un campo
// con "javascript:..." se ejecuta en el navegador de quien pulse el enlace. Solo se permiten
// enlaces http(s); cualquier otra cosa (incluida una cadena vacía) se descarta.
export function safeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

// Fuente de <audio>/<video>: además de http(s) admite blob: (grabaciones locales) y rutas relativas
// a la propia app. Se reconstruye con URL() para devolver una dirección normalizada, nunca el texto crudo.
export function safeMediaSrc(url?: string | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed || trimmed.startsWith('//')) return undefined;
  try {
    const parsed = new URL(trimmed, 'https://app.invalid');
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.origin === 'https://app.invalid' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.href;
    }
    if (parsed.protocol === 'blob:') return parsed.href;
    // Subidas que cayeron al respaldo local de audioStorage: el audio va incrustado, no es ejecutable.
    if (parsed.protocol === 'data:' && /^data:audio\//i.test(trimmed)) return trimmed;
  } catch {
    // dirección ilegible: se descarta
  }
  return undefined;
}
