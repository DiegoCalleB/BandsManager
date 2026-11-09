/**
 * Un email solo vale si hay evidencia de que es real: aparece literalmente en una página de la propia sala
 * (su web, su contacto, su aviso legal) y su dominio recibe correo.
 *
 * Una IA, un buscador o una lista escrita a mano pueden dar `info@dominio.com` porque «suena bien»: un email
 * deducido es un email inventado, y mandar un pitch a una dirección que no existe quema el remitente de la
 * banda. Esta pieza no adivina nada: o lo encuentra escrito por la sala, o lo rechaza.
 */
import { isValidEmailSyntax } from './emailValidator.js';
import { limpiarCampoContacto } from './scoutLeads.js';

export type MotivoDescarte = 'formato_invalido' | 'relleno' | 'sin_web' | 'no_aparece_en_su_web' | 'dominio_sin_correo';

export type ResultadoEvidencia = { ok: true; evidencia: string } | { ok: false; motivo: MotivoDescarte };

export interface OpcionesEvidencia {
  /** Web oficial de la sala: de ahí sale la evidencia. Sin ella no se puede comprobar nada. */
  website?: string;
  /** Texto (HTML) de una página, o null si no existe o no se pudo leer. La red va inyectada: aquí no se hace I/O. */
  leerPagina: (url: string) => Promise<string | null>;
  /** ¿El dominio del email recibe correo (MX o A)? */
  dominioConCorreo: (email: string) => Promise<boolean>;
}

/** Extensiones de fichero que parecen un TLD en `logo@2x.png`. */
const FALSOS_TLD = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'css', 'js', 'map', 'woff', 'woff2', 'ttf', 'eot', 'avif']);

const REGEX_EMAIL = /[a-z0-9._%+-]{1,64}@(?:[a-z0-9-]+\.)+[a-z]{2,24}/gi;

/** Páginas, además de la web, donde una sala pone su contacto (el aviso legal lo exige la LSSI). */
const RUTAS_DE_CONTACTO = ['/contacto', '/contact', '/contactos', '/contact-us', '/aviso-legal', '/legal', '/prensa', '/press'];

export const normalizarEmail = (valor: string): string =>
  String(valor ?? '')
    .trim()
    .replace(/^mailto:/i, '')
    .replace(/[\s,;.]+$/g, '')
    .toLowerCase();

/** Protección de email de Cloudflare: el primer byte es la clave XOR del resto. */
function descifrarCloudflare(html: string): string[] {
  const descifrados: string[] = [];
  for (const m of html.matchAll(/data-cfemail=["']([0-9a-f]{4,512})["']/gi)) {
    const hex = m[1];
    if (hex.length % 2 !== 0) continue;
    const clave = parseInt(hex.slice(0, 2), 16);
    let texto = '';
    for (let i = 2; i < hex.length; i += 2) texto += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ clave);
    descifrados.push(texto);
  }
  return descifrados;
}

/** Todos los emails que una página escribe, también los ofuscados con entidades, `[at]`, `(arroba)` o `%40`. */
export function emailsEnTexto(texto: string): string[] {
  if (!texto) return [];
  let t = `${texto}\n${descifrarCloudflare(texto).join('\n')}`
    .replace(/&#x0*40;|&#0*64;|&commat;/gi, '@')
    .replace(/&#x0*2e;|&#0*46;|&period;/gi, '.')
    .replace(/%40/g, '@')
    .replace(/%2e/gi, '.');
  t = t
    .replace(/\s*[[({]\s*(?:at|arroba)\s*[\])}]\s*/gi, '@')
    .replace(/\s*[[({]\s*(?:dot|punto)\s*[\])}]\s*/gi, '.');
  const encontrados = new Set<string>();
  for (const m of t.matchAll(REGEX_EMAIL)) {
    const email = m[0].toLowerCase().replace(/[.]+$/, '');
    const tld = email.slice(email.lastIndexOf('.') + 1);
    if (!FALSOS_TLD.has(tld)) encontrados.add(email);
  }
  return [...encontrados];
}

/** ¿Escribe la página ese email, entero y tal cual? (no vale estar dentro de otra dirección) */
export function emailAparece(email: string, texto: string): boolean {
  const buscado = normalizarEmail(email);
  return !!buscado && emailsEnTexto(texto).includes(buscado);
}

/** La web de la sala y las páginas habituales de contacto, sin pasar de 10 peticiones. */
export function paginasDondeBuscar(website: string | undefined): string[] {
  if (!website) return [];
  let url: URL;
  try {
    url = new URL(website);
  } catch {
    return [];
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return [];
  const paginas = new Set<string>([website, `${url.origin}/`, ...RUTAS_DE_CONTACTO.map((r) => `${url.origin}${r}`)]);
  return [...paginas].slice(0, 10);
}

/** Acepta el email solo con evidencia; si no, dice por qué lo rechaza. Nunca adivina. */
export async function verificarEmailConEvidencia(email: string, opciones: OpcionesEvidencia): Promise<ResultadoEvidencia> {
  const normalizado = normalizarEmail(email);
  if (!isValidEmailSyntax(normalizado)) return { ok: false, motivo: 'formato_invalido' };
  if (limpiarCampoContacto(normalizado) === '') return { ok: false, motivo: 'relleno' };

  const paginas = paginasDondeBuscar(opciones.website);
  if (paginas.length === 0) return { ok: false, motivo: 'sin_web' };

  let evidencia: string | null = null;
  for (const pagina of paginas) {
    const texto = await opciones.leerPagina(pagina).catch(() => null);
    if (texto && emailAparece(normalizado, texto)) {
      evidencia = pagina;
      break;
    }
  }
  if (!evidencia) return { ok: false, motivo: 'no_aparece_en_su_web' };

  // Un fallo de DNS no es una prueba a favor: ante la duda, no se acepta.
  const recibeCorreo = await opciones.dominioConCorreo(normalizado).catch(() => false);
  if (!recibeCorreo) return { ok: false, motivo: 'dominio_sin_correo' };
  return { ok: true, evidencia };
}
