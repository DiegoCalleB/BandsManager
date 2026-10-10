/**
 * Página pública de un concierto (`/e/<slug>`), generada en el servidor.
 *
 * Por qué en el servidor y no en la SPA: Google y los previsualizadores de WhatsApp, Instagram o
 * Telegram no ejecutan (bien) el JavaScript de la app, así que una ruta de React no sale en
 * Google Events ni muestra cartel y fecha al pegar el enlace. Esto devuelve HTML completo con
 * metadatos Open Graph y datos estructurados `MusicEvent` (schema.org).
 *
 * Funciones puras, sin I/O: la ruta (`server/routes/paginaConcierto.ts`) trae los datos.
 *
 * Seguridad: TODO texto de banda pasa por `escapeHtml`; el JSON-LD se serializa escapando `<`
 * (un nombre de sala con `</script>` no puede cerrar la etiqueta); las URL que acaban en un
 * atributo se filtran antes a http(s). Y solo se publica lo imprescindible: nada de caché,
 * notas, contrato ni aforo (`esConciertoPublicable` + lista blanca de campos).
 */
import { escapeHtml } from './html.js';
import { slugify } from './slug.js';
import { urlHttpSegura } from './enlacesCortos.js';

/* ------------------------------------------------------------------ qué se puede publicar */

export interface ConciertoPublicoEntrada {
  id?: string | null;
  fecha?: string | null;
  sala?: string | null;
  ciudad?: string | null;
  tipo?: string | null;
  is_posible?: boolean | null;
}

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha AAAA-MM-DD real (rechaza 2026-02-31). */
export function fechaValida(fecha: unknown): fecha is string {
  if (typeof fecha !== 'string' || !FECHA_ISO.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

/**
 * ¿Se puede enseñar este concierto al público? No si es un evento privado (boda, cumpleaños...),
 * si está sin confirmar («posible») o si le faltan los datos mínimos. Es la única puerta: la
 * página, el sitemap y los enlaces cortos pasan por aquí.
 */
export function esConciertoPublicable(c: ConciertoPublicoEntrada | null | undefined): boolean {
  if (!c || !c.id) return false;
  if (String(c.tipo || '').toLowerCase() === 'privado') return false;
  if (c.is_posible) return false;
  if (!fechaValida(c.fecha)) return false;
  if (!String(c.sala || '').trim()) return false;
  return true;
}

export function hoyIso(ahora: Date = new Date()): string {
  return ahora.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}

export function haPasado(fecha: string, ahora: Date = new Date()): boolean {
  return fecha < hoyIso(ahora);
}

/* ------------------------------------------------------------------ URL */

/** Origen público de la app. `APP_URL` si es una URL válida (en Railway lo es); si no, la de producción. */
export function baseUrlPublica(env: Record<string, string | undefined> = process.env): string {
  const candidata = urlHttpSegura(env.APP_URL || env.VITE_APP_URL || '');
  if (candidata) {
    const u = new URL(candidata);
    return u.origin;
  }
  return 'https://bandmanager.io';
}

const PATRON_ID = /^[A-Za-z0-9_.:@-]{1,160}$/;

/** `banda-ejemplo-sala-capitol-2026-10-16--cnc-1`: legible para el humano y para Google, el id va al final. */
export function slugConcierto(bandaNombre: string, c: { id: string; sala: string; fecha: string }): string {
  const legible = slugify(`${bandaNombre} ${c.sala}`).slice(0, 80).replace(/-+$/, '');
  return `${legible || 'concierto'}-${c.fecha}--${c.id}`;
}

/** Saca el id del concierto del slug. Lo de antes de `--` es solo decoración y no se usa para nada. */
export function idDesdeSlug(slug: unknown): string | null {
  if (typeof slug !== 'string') return null;
  const i = slug.indexOf('--');
  if (i < 0) return null;
  const id = slug.slice(i + 2);
  return PATRON_ID.test(id) ? id : null;
}

export function urlConcierto(base: string, bandaNombre: string, c: { id: string; sala: string; fecha: string }): string {
  return `${base.replace(/\/$/, '')}/e/${slugConcierto(bandaNombre, c)}`;
}

/* ------------------------------------------------------------------ texto */

export function fechaLarga(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Caja de frase: «viernes, 16 de octubre» → «Viernes, 16 de octubre» (sin mayúsculas en cada palabra). */
function primeraMayuscula(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase('es-ES') + texto.slice(1);
}

function recortar(texto: string, max: number): string {
  return texto.length <= max ? texto : `${texto.slice(0, max - 1).trimEnd()}…`;
}

/* ------------------------------------------------------------------ datos de la página */

export interface DatosPaginaConcierto {
  baseUrl: string;
  canonicalUrl: string;
  id: string;
  fecha: string;
  sala: string;
  ciudad: string;
  direccion?: string | null;
  cartelUrl?: string | null;
  bandaNombre: string;
  logoUrl?: string | null;
  /** Enlace que se pulsa (el corto con atribución, o el directo si no hay corto). */
  entradasHref?: string | null;
  /** Enlace directo de entradas, para los datos estructurados (Google no sigue enlaces con atribución). */
  entradasDirectaUrl?: string | null;
  epkUrl: string;
  fansUrl: string;
  pasado: boolean;
  /** Insignia «Powered by BandManager.io» (solo planes gratuitos). */
  insigniaHref?: string | null;
}

/** JSON-LD seguro para incrustar en <script>: `<` y los separadores de línea Unicode escapados. */
export function jsonLdSeguro(objeto: unknown): string {
  return JSON.stringify(objeto).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function construirJsonLd(d: DatosPaginaConcierto): Record<string, unknown> {
  const imagenes = [urlHttpSegura(d.cartelUrl), urlHttpSegura(d.logoUrl)].filter((x): x is string => !!x);
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: `${d.bandaNombre} en ${d.sala}`,
    startDate: d.fecha,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: d.canonicalUrl,
    location: {
      '@type': 'Place',
      name: d.sala,
      address: {
        '@type': 'PostalAddress',
        ...(d.direccion ? { streetAddress: d.direccion } : {}),
        addressLocality: d.ciudad,
      },
    },
    performer: { '@type': 'MusicGroup', name: d.bandaNombre, url: d.epkUrl },
  };
  if (imagenes.length) ld.image = imagenes;
  const oferta = urlHttpSegura(d.entradasDirectaUrl);
  if (oferta && !d.pasado) {
    ld.offers = { '@type': 'Offer', url: oferta, availability: 'https://schema.org/InStock' };
  }
  return ld;
}

/* ------------------------------------------------------------------ HTML */

// Tokens de Espectro (src/styles/tokens.css) copiados a mano: esta página no pasa por Tailwind ni
// por la SPA. Si cambian los tokens de la app, actualiza aquí `bg/surface/ink/acc`.
const ESTILOS = `
:root{--bg:#F6F7F9;--surface:#FFFFFF;--sunken:#E8EBEF;--ink:#2A2E35;--ink-2:#5A626E;--acc:#2158DC;--on-acc:#FFFFFF;--acc-soft:#DBEAFE;--acc-ink:#1D4ED8;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#101216;--surface:#191C21;--sunken:#0B0D10;--ink:#E3E7EC;--ink-2:#A6AEB9;--acc:#60A5FA;--on-acc:#0A1F3D;--acc-soft:#1E3A5F;--acc-ink:#60A5FA;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Onest Variable","Onest",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased}
main{max-width:34rem;margin:0 auto;padding:1.25rem 1rem 3rem}
.cartel{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:24px;background:var(--sunken)}
.tarjeta{background:var(--surface);border-radius:24px;padding:1.5rem}
.banda{display:flex;align-items:center;gap:.6rem;color:var(--ink-2);font-size:14px;margin:0 0 .75rem}
.banda img{width:28px;height:28px;border-radius:999px;object-fit:cover}
h1{font-size:28px;line-height:1.15;margin:0 0 .35rem;font-weight:700;text-wrap:balance}
.donde{margin:0;color:var(--ink-2);font-size:16px}
.cuando{margin:1rem 0 1.25rem;font-size:20px;font-weight:600;font-variant-numeric:tabular-nums}
.acciones{display:flex;flex-direction:column;gap:.6rem}
.boton{display:flex;align-items:center;justify-content:center;min-height:48px;padding:0 1.25rem;border-radius:999px;font-weight:600;font-size:16px;text-decoration:none;transition:transform 120ms cubic-bezier(.23,1,.32,1)}
.boton:active{transform:scale(.97)}
.principal{background:var(--acc);color:var(--on-acc)}
.suave{background:var(--sunken);color:var(--ink)}
.aviso{margin:0;padding:.9rem 1.1rem;border-radius:18px;background:var(--sunken);color:var(--ink-2);font-size:14px;text-align:center}
.pie{margin-top:2rem;text-align:center;font-size:12px;color:var(--ink-2)}
.pie a{color:var(--acc-ink);text-decoration:none;font-weight:600}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.boton{transition:none}}
`;

function atributoUrl(url: string | null | undefined): string {
  return escapeHtml(urlHttpSegura(url) || '');
}

export function renderizarPaginaConcierto(d: DatosPaginaConcierto): string {
  const titulo = `${d.bandaNombre} en ${d.sala} (${d.ciudad}) · ${fechaLarga(d.fecha)}`;
  const descripcion = recortar(
    d.pasado
      ? `${d.bandaNombre} tocó en ${d.sala} (${d.ciudad}) el ${fechaLarga(d.fecha)}.`
      : `${d.bandaNombre} toca en ${d.sala} (${d.ciudad}) el ${fechaLarga(d.fecha)}. Entradas e información del concierto.`,
    160
  );
  const imagenOg = urlHttpSegura(d.cartelUrl) || urlHttpSegura(d.logoUrl) || `${d.baseUrl}/og-cover.png`;
  const entradas = urlHttpSegura(d.entradasHref);
  const logo = urlHttpSegura(d.logoUrl);
  const cartel = urlHttpSegura(d.cartelUrl);

  const bloqueEntradas = d.pasado
    ? '<p class="aviso">Este concierto ya ha pasado.</p>'
    : entradas
      ? `<a class="boton principal" href="${atributoUrl(entradas)}" rel="noopener">Comprar entradas</a>`
      : '<p class="aviso">Las entradas todavía no están a la venta.</p>';

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titulo)}</title>
<meta name="description" content="${escapeHtml(descripcion)}">
<link rel="canonical" href="${atributoUrl(d.canonicalUrl)}">
<meta name="robots" content="${d.pasado ? 'noindex,follow' : 'index,follow,max-image-preview:large'}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BandManager">
<meta property="og:title" content="${escapeHtml(titulo)}">
<meta property="og:description" content="${escapeHtml(descripcion)}">
<meta property="og:url" content="${atributoUrl(d.canonicalUrl)}">
<meta property="og:image" content="${atributoUrl(imagenOg)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(titulo)}">
<meta name="twitter:description" content="${escapeHtml(descripcion)}">
<meta name="twitter:image" content="${atributoUrl(imagenOg)}">
<meta name="theme-color" content="#F6F7F9">
<script type="application/ld+json">${jsonLdSeguro(construirJsonLd(d))}</script>
<style>${ESTILOS}</style>
</head>
<body>
<main>
${cartel ? `<img class="cartel" src="${atributoUrl(cartel)}" alt="Cartel del concierto de ${escapeHtml(d.bandaNombre)} en ${escapeHtml(d.sala)}" width="640" height="800">\n` : ''}<section class="tarjeta"${cartel ? ' style="margin-top:.75rem"' : ''}>
<p class="banda">${logo ? `<img src="${atributoUrl(logo)}" alt="" width="28" height="28">` : ''}<span>${escapeHtml(d.bandaNombre)}</span></p>
<h1>${escapeHtml(d.sala)}</h1>
<p class="donde">${escapeHtml(d.ciudad)}${d.direccion ? ` · ${escapeHtml(d.direccion)}` : ''}</p>
<p class="cuando">${escapeHtml(primeraMayuscula(fechaLarga(d.fecha)))}</p>
<div class="acciones">
${bloqueEntradas}
<a class="boton suave" href="${atributoUrl(d.epkUrl)}">Conocer a ${escapeHtml(d.bandaNombre)}</a>
${d.pasado ? '' : `<a class="boton suave" href="${atributoUrl(d.fansUrl)}">Avisadme de las próximas fechas</a>`}
</div>
</section>
${d.insigniaHref ? `<p class="pie">Powered by <a href="${atributoUrl(d.insigniaHref)}" rel="noopener">BandManager.io</a></p>` : ''}
</main>
</body>
</html>`;
}

/** Página para un concierto que no existe o no es público: sin datos de nadie y sin indexar. */
export function renderizarNoEncontrado(baseUrl: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Concierto no encontrado · BandManager</title>
<meta name="robots" content="noindex">
<style>${ESTILOS}</style>
</head>
<body>
<main>
<section class="tarjeta">
<h1>Este concierto no está disponible</h1>
<p class="donde">Puede que la banda lo haya cambiado de fecha o lo haya quitado.</p>
<div class="acciones" style="margin-top:1.25rem"><a class="boton suave" href="${atributoUrl(baseUrl)}">Ir a BandManager</a></div>
</section>
</main>
</body>
</html>`;
}

/* ------------------------------------------------------------------ sitemap */

export interface EntradaSitemap {
  loc: string;
  lastmod?: string;
}

/** Máximo del protocolo sitemap.org por fichero. */
export const MAX_URLS_SITEMAP = 50_000;

export function renderizarSitemap(entradas: EntradaSitemap[]): string {
  const filas = entradas
    .slice(0, MAX_URLS_SITEMAP)
    .filter((e) => urlHttpSegura(e.loc))
    .map((e) => `<url><loc>${escapeHtml(e.loc)}</loc>${e.lastmod ? `<lastmod>${escapeHtml(e.lastmod)}</lastmod>` : ''}</url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${filas}\n</urlset>\n`;
}
