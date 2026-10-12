// Comparar el host de una URL con un dominio NO se puede hacer con `url.includes('dominio.com')`:
// «https://evil.com/instagram.com» o «https://instagram.com.evil.com» lo pasarían. Aquí se parsea
// la URL y se compara el hostname completo (igual al dominio o subdominio suyo).

/** Hostname en minúsculas de una URL (o «dominio.com/ruta» sin esquema). Cadena vacía si no hay host. */
export function hostnameDe(valor: string | null | undefined): string {
  const texto = (valor ?? "").trim();
  if (!texto || texto.length > 2048 || texto.startsWith("/")) return ""; // ruta relativa: sin host
  const conEsquema = /^[a-z][a-z0-9+.-]*:\/\//i.test(texto) ? texto : `https://${texto}`;
  try {
    return new URL(conEsquema).hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  } catch {
    return ""; // no es una URL: sin host
  }
}

/** Verdadero si el host de la URL es uno de los dominios o un subdominio suyo. */
export function hostEnDominio(valor: string | null | undefined, ...dominios: string[]): boolean {
  const host = hostnameDe(valor);
  if (!host) return false;
  return dominios.some((d) => {
    const dominio = d.toLowerCase();
    return host === dominio || host.endsWith(`.${dominio}`);
  });
}

/** Dominio de una dirección de correo («a@b.com» → «b.com»); vacío si no tiene forma de email. */
export function dominioDeEmail(email: string | null | undefined): string {
  const texto = (email ?? "").trim().toLowerCase();
  const arroba = texto.lastIndexOf("@");
  if (arroba < 1) return "";
  return texto.slice(arroba + 1);
}

/** Verdadero si el dominio del email es uno de los dominios dados o un subdominio suyo. */
export function emailEnDominio(email: string | null | undefined, ...dominios: string[]): boolean {
  const host = dominioDeEmail(email);
  if (!host) return false;
  return dominios.some((d) => host === d || host.endsWith(`.${d}`));
}
