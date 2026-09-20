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
