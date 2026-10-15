/**
 * true si el hostname de `url` es uno de `dominios` o un subdominio suyo. Compara el hostname ya
 * parseado, no una subcadena: `https://evil.com/?x=clearbit.com` o `https://clearbit.com.evil.com`
 * no coinciden. Acepta URLs sin esquema ("logo.clearbit.com/x"); si no se puede parsear, false.
 */
export function hostEsDeDominio(url: string, dominios: readonly string[]): boolean {
  try {
    const { hostname } = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`);
    const host = hostname.toLowerCase();
    return dominios.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}
