/**
 * Datos de una sala que se pueden sacar de su propia web: reglas puras, sin red. Se aplican las reglas de privacidad del
 * catálogo: email solo de rol, teléfono solo fijo e Instagram solo si se parece al nombre de la sala. El género sale de
 * contar palabras, así que solo se anota si una o dos aparecen de forma clara.
 */
import { elegirInstagram, usuariosDeInstagram } from './instagramEnWeb.js';
import { emailDeRol, instagramPublico, normalizarTexto, telefonoFijoEs } from './salaCatalogo.js';

export interface DatosDeWebSala {
  instagram: string | null;
  email_contacto: string | null;
  telefono: string | null;
  genero: string | null;
  /** Personas. Solo si la web da UN número claro de aforo. */
  aforo: number | null;
}

const EXTENSIONES_NO_EMAIL = /\.(png|jpe?g|gif|webp|svg|js|css|woff2?)$/i;

function emailDeLaWeb(paginas: readonly string[]): string | null {
  const candidatos: string[] = [];
  for (const html of paginas) {
    for (const m of html.matchAll(/href=["']mailto:([^"'?\s]+)/gi)) candidatos.push(decodeURIComponent(m[1]));
    for (const m of html.matchAll(/[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,24}/g)) if (!EXTENSIONES_NO_EMAIL.test(m[0])) candidatos.push(m[0]);
  }
  for (const c of candidatos) {
    const email = emailDeRol(c);
    if (email) return email;
  }
  return null;
}

function telefonoDeLaWeb(paginas: readonly string[]): string | null {
  const candidatos: string[] = [];
  for (const html of paginas) {
    for (const m of html.matchAll(/href=["']tel:([^"']+)/gi)) candidatos.push(decodeURIComponent(m[1]));
    for (const m of html.matchAll(/(?:tel[eé]fono|tel\.|llámanos|llamanos)[^0-9+]{0,20}((?:\+34|0034)?[\s.-]?9\d{2}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{0,3})/gi)) candidatos.push(m[1]);
  }
  for (const c of candidatos) {
    const tel = telefonoFijoEs(c);
    if (tel) return tel;
  }
  return null;
}

const GENEROS: Array<[string, RegExp]> = [
  ['Rock', /\brock\b/g], ['Punk', /\bpunk\b/g], ['Metal', /\bmetal\b/g], ['Indie', /\bindie\b/g], ['Pop', /\bpop\b/g],
  ['Jazz', /\bjazz\b/g], ['Blues', /\bblues\b/g], ['Reggae', /\breggae\b/g], ['Ska', /\bska\b/g], ['Funk', /\bfunk\b/g],
  ['Soul', /\bsoul\b/g], ['Hip hop', /\b(hip hop|rap)\b/g], ['Electrónica', /\b(electronica|techno|house|electronic)\b/g],
  ['Flamenco', /\bflamenco\b/g], ['Folk', /\bfolk\b/g], ['Rumba', /\brumba\b/g], ['Latina', /\b(salsa|latina|latino|cumbia)\b/g],
  ['Country', /\bcountry\b/g], ['Hardcore', /\bhardcore\b/g],
];
const MINIMO_APARICIONES = 3;

/** Texto visible de una página: sin scripts, estilos ni etiquetas, normalizado para comparar. */
const textoVisible = (html: string) => normalizarTexto(html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).slice(0, 30_000);

export function generoDeLaWeb(paginas: readonly string[]): string | null {
  const texto = paginas.map(textoVisible).join(' ');
  const cuentas = GENEROS.map(([nombre, re]) => [nombre, (texto.match(re) ?? []).length] as const).filter(([, n]) => n >= MINIMO_APARICIONES).sort((a, b) => b[1] - a[1]);
  if (cuentas.length === 0) return null;
  const maximo = cuentas[0][1];
  // Solo los que pesan de verdad frente al más citado: una mención suelta no define el género de una sala.
  return cuentas.filter(([, n]) => n >= maximo * 0.4).slice(0, 3).map(([nombre]) => nombre).join(' / ');
}

const UNIDAD = '(personas|pax|asistentes|espectadores|plazas|localidades)';
const NUMERO = '(\\d{1,3}(?:\\.\\d{3})+|\\d{2,5})';
const ANTES = new RegExp(`${NUMERO}\\s*${UNIDAD}\\s*(?:de|en)\\s*(?:aforo|capacidad)`, 'g');
const DESPUES = new RegExp(`(?:aforo|capacidad)\\s*(?:(?:maxim[oa]|total|aproximad[oa]|de|para|hasta|del local|de la sala)\\s*)*:?\\s*(?:de|para|hasta)?\\s*${NUMERO}\\s*${UNIDAD}?`, 'g');
const AFORO_MINIMO = 20;
const AFORO_MAXIMO = 20_000;

/**
 * El aforo que declara la web («aforo 300 personas», «capacidad para 1.200», «250 personas de aforo»). Solo se da si todas las
 * menciones coinciden: una web con dos salas («Sala A: 300 · Sala B: 800») no dice cuál es la que importa, y es mejor dejarlo
 * vacío que apostar. Un año suelto («aforo 2024») no cuenta como aforo si no lleva la unidad.
 */
export function aforoDeLaWeb(paginas: readonly string[]): number | null {
  const texto = paginas.map((h) => h.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  const valores = new Set<number>();
  for (const [re, iNumero, iUnidad] of [[ANTES, 1, 2], [DESPUES, 1, 2]] as const) {
    for (const m of texto.matchAll(re)) {
      const n = Number(m[iNumero].replace(/\./g, ''));
      const esAnio = n >= 1900 && n <= 2100;
      if (n >= AFORO_MINIMO && n <= AFORO_MAXIMO && (!esAnio || m[iUnidad])) valores.add(n);
    }
  }
  return valores.size === 1 ? [...valores][0] : null;
}

/** Lo que dicen las páginas de la web de una sala (portada, contacto…) de la propia sala. */
export function datosDeWebSala(paginas: readonly string[], nombreSala: string): DatosDeWebSala {
  const instagram = instagramPublico(elegirInstagram(paginas.flatMap(usuariosDeInstagram), nombreSala) ?? null);
  return { instagram, email_contacto: emailDeLaWeb(paginas), telefono: telefonoDeLaWeb(paginas), genero: generoDeLaWeb(paginas), aforo: aforoDeLaWeb(paginas) };
}
