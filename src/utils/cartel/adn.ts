// El «ADN visual» de la banda: lo que hace que sus carteles se parezcan a ellos. Una fila por banda
// (`band_cartel_estilo`). Lo usan el cliente (al pintar y al elegir) y el servidor (al guardar y al
// armar las imágenes de referencia de la IA): el mismo saneador en los dos lados.
//
//   referencias  hasta 3 imágenes que la IA mira para parecerse a la banda (subidas o carteles anteriores)
//   favoritos    fondos de IA que la banda acabó compartiendo: se reutilizan gratis y enseñan su gusto
//   aprender     si los favoritos rellenan las referencias y fijan el estilo preferido
//
// Las URLs solo valen si son de la carpeta `carteles/{bandId}/` de nuestro almacenamiento: la
// validación la inyecta quien llama (`esUrlDeCartel` en server/utils/cartelUrl.ts).

import { esEstiloCartel, type EstiloCartel } from './estilos';

export const MAX_REFERENCIAS = 3;
export const MAX_FAVORITOS = 6;
const MAX_AMBIENTE = 300;

export interface FavoritoCartel {
  url: string;
  estilo: EstiloCartel;
  /** Lo que pidió la persona al generarlo, por si quiere repetirlo. */
  ambiente: string;
}

export interface AdnCartel {
  v: 1;
  referencias: string[];
  favoritos: FavoritoCartel[];
  aprender: boolean;
}

export const ADN_INICIAL: AdnCartel = { v: 1, referencias: [], favoritos: [], aprender: true };

const url = (v: unknown, ok: (u: string) => boolean) => (typeof v === 'string' && v.length <= 2048 && ok(v) ? v : null);
const sinControl = (s: string) => Array.from(s).filter((ch) => { const c = ch.charCodeAt(0); return c >= 32 && c !== 127; }).join('');
const unicas = (urls: string[]) => urls.filter((u, i) => urls.indexOf(u) === i);

/** Lo mismo con o sin `?v=`: es la misma imagen. */
export const sinVersion = (u: string) => u.split('?')[0];

export function sanearAdn(raw: unknown, esUrlPermitida: (url: string) => boolean): AdnCartel | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  const referencias = unicas(
    (Array.isArray(r.referencias) ? r.referencias : []).map((u) => url(u, esUrlPermitida)).filter((u): u is string => !!u)
  ).slice(0, MAX_REFERENCIAS);

  const favoritos: FavoritoCartel[] = [];
  for (const f of Array.isArray(r.favoritos) ? r.favoritos : []) {
    const o = f as Record<string, unknown>;
    const u = url(o?.url, esUrlPermitida);
    if (!u || !esEstiloCartel(o.estilo) || favoritos.some((x) => sinVersion(x.url) === sinVersion(u))) continue;
    favoritos.push({ url: u, estilo: o.estilo, ambiente: typeof o.ambiente === 'string' ? sinControl(o.ambiente).trim().slice(0, MAX_AMBIENTE) : '' });
    if (favoritos.length >= MAX_FAVORITOS) break;
  }

  return {
    v: 1,
    referencias,
    favoritos,
    aprender: typeof r.aprender === 'boolean' ? r.aprender : true,
  };
}

/** Añade una referencia (como mucho 3: entra la nueva y sale la más antigua). */
export function conReferencia(adn: AdnCartel, u: string): AdnCartel {
  const resto = adn.referencias.filter((x) => sinVersion(x) !== sinVersion(u));
  return { ...adn, referencias: [...resto, u].slice(-MAX_REFERENCIAS) };
}

export function sinReferencia(adn: AdnCartel, u: string): AdnCartel {
  return { ...adn, referencias: adn.referencias.filter((x) => sinVersion(x) !== sinVersion(u)) };
}

/** Un fondo de IA que la banda acabó compartiendo: el más nuevo primero, sin repetir, como mucho 6. */
export function conFavorito(adn: AdnCartel, f: FavoritoCartel): AdnCartel {
  const resto = adn.favoritos.filter((x) => sinVersion(x.url) !== sinVersion(f.url));
  return { ...adn, favoritos: [f, ...resto].slice(0, MAX_FAVORITOS) };
}

export function sinFavorito(adn: AdnCartel, u: string): AdnCartel {
  return { ...adn, favoritos: adn.favoritos.filter((x) => sinVersion(x.url) !== sinVersion(u)) };
}

/**
 * Imágenes que mira la IA: primero las que la banda eligió a mano y, si caben y `aprender` está
 * activo, sus favoritos más recientes. Siempre ≤ 3 y sin repetir.
 */
export function referenciasParaIa(adn: AdnCartel): string[] {
  const manuales = adn.referencias;
  const deFavoritos = adn.aprender ? adn.favoritos.map((f) => f.url) : [];
  return unicas([...manuales, ...deFavoritos].filter((u, i, a) => a.findIndex((x) => sinVersion(x) === sinVersion(u)) === i)).slice(0, MAX_REFERENCIAS);
}

const PLANTILLA_A_ESTILO: Record<string, EstiloCartel> = { stage: 'gigposter', minimal: 'minimal', neon: 'neon', vintage: 'vintage' };
const PISTAS_GENERO: Array<[RegExp, EstiloCartel]> = [
  [/punk|hardcore|grunge|garage|ska|hc\b/i, 'collage'],
  [/electr[oó]nic|techno|house|synth|disco|dance|dj/i, 'neon'],
  [/jazz|blues|soul|funk|swing|bolero|cl[aá]sic|folk|country/i, 'vintage'],
  [/ac[uú]stic|cantautor|ambient|minimal|indie folk/i, 'minimal'],
  [/rock|metal|hard|stoner|reggae|rap|hip.?hop|pop/i, 'gigposter'],
];

/**
 * Estilo con el que arrancar, de lo más a lo menos seguro:
 *  1) el que más ha acabado compartiendo (≥ 2 favoritos y `aprender`);
 *  2) la plantilla de su dossier;  3) pistas en su género;  4) serigrafía.
 */
export function estiloSugerido(adn: AdnCartel, banda: { plantilla?: string; genero?: string } = {}): EstiloCartel {
  if (adn.aprender && adn.favoritos.length >= 2) {
    const cuenta = new Map<EstiloCartel, number>();
    for (const f of adn.favoritos) cuenta.set(f.estilo, (cuenta.get(f.estilo) ?? 0) + 1);
    // Con empate gana el más reciente: los favoritos van del más nuevo al más viejo.
    const mejor = [...cuenta.values()].reduce((a, b) => Math.max(a, b), 0);
    const ganador = adn.favoritos.find((f) => cuenta.get(f.estilo) === mejor);
    if (ganador && mejor >= 2) return ganador.estilo;
  }
  const porPlantilla = banda.plantilla ? PLANTILLA_A_ESTILO[banda.plantilla] : undefined;
  if (porPlantilla) return porPlantilla;
  const g = banda.genero ?? '';
  return PISTAS_GENERO.find(([re]) => re.test(g))?.[1] ?? 'gigposter';
}

/** Carteles de OTROS bolos de la banda que se pueden ofrecer como referencia (ya viven en su carpeta), sin repetir las que ya lo son. */
export function cartelesAnteriores(concerts: Array<{ id: string; cartel_url?: string | null; cartelUrl?: string | null }>, idActual: string, referencias: string[]): string[] {
  const yaSon = new Set(referencias.map(sinVersion));
  const lista: string[] = [];
  for (const c of concerts) {
    const u = c.id !== idActual ? c.cartel_url || c.cartelUrl : undefined;
    if (!u || !u.startsWith('https://') || !u.includes('/storage/v1/object/public/') || !u.includes('/carteles/')) continue;
    if (yaSon.has(sinVersion(u))) continue;
    yaSon.add(sinVersion(u));
    lista.push(u);
  }
  return lista.slice(0, 6);
}
