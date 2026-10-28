// El ADN visual de la banda aplicado a las láminas: qué fotos suyas hay, qué letra les corresponde
// y con qué fotos arrancan las imágenes. Lógica pura, sin DOM. Todo sale de lo que la banda ya tiene:
//   · la galería de su dossier (`bandPhotos`),
//   · las imágenes que la representan en Cartelería (referencias) y los fondos que ha compartido
//     (favoritos), que además dicen su estilo,
//   · su estilo: favoritos > plantilla del dossier > género (`estiloSugerido`), y de él, la letra.

import { estiloSugerido, sinVersion, type AdnCartel } from '../cartel/adn';
import { resolverVoz, type VozCartel } from '../cartel/voces';
import type { FormatoLamina } from './laminas';

export interface FotoBanda {
  url: string;
  origen: 'dossier' | 'referencia' | 'favorito';
}

export const MAX_FOTOS_BANDA = 12;

/** Una URL de foto que se puede pintar: https, o una ruta de nuestro propio servidor. */
function urlValida(v: unknown): string | null {
  const u = typeof v === 'string' ? v.trim() : '';
  if (!u || u.length > 2048) return null;
  return u.startsWith('https://') || (u.startsWith('/') && !u.startsWith('//')) ? u : null;
}

/** La galería del dossier guarda la URL a secas o un objeto con `url`. */
const urlDeFoto = (p: unknown): string | null => urlValida(typeof p === 'string' ? p : (p as { url?: unknown } | null)?.url);

/**
 * Las fotos e imágenes de la banda, de más a menos suyas: su galería, las referencias que eligió y
 * los fondos que acabó compartiendo. Sin repetir (con o sin `?v=`) y como mucho 12.
 */
export function fotosDeLaBanda({ galeria, logoUrl, adn }: { galeria: unknown[]; logoUrl?: string | null; adn: AdnCartel | null }): FotoBanda[] {
  const candidatas: FotoBanda[] = [];
  for (const p of galeria) {
    const url = urlDeFoto(p);
    if (url) candidatas.push({ url, origen: 'dossier' });
  }
  for (const url of adn?.referencias ?? []) candidatas.push({ url, origen: 'referencia' });
  for (const f of adn?.favoritos ?? []) candidatas.push({ url: f.url, origen: 'favorito' });

  const vistas = new Set<string>();
  // El logo no es una foto: si alguien lo metió en la galería, no se ofrece de fondo.
  if (logoUrl) vistas.add(sinVersion(logoUrl));
  const fotos: FotoBanda[] = [];
  for (const c of candidatas) {
    const clave = sinVersion(c.url);
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    fotos.push(c);
    if (fotos.length >= MAX_FOTOS_BANDA) break;
  }
  return fotos;
}

/** La letra que les corresponde: la de su estilo, sacado de lo que más han compartido, su dossier o su género. */
export function vozDeLaBanda(adn: AdnCartel | null, banda: { plantilla?: string; genero?: string }): VozCartel {
  const base: AdnCartel = adn ?? { v: 1, referencias: [], favoritos: [], aprender: true };
  return resolverVoz('auto', estiloSugerido(base, banda));
}

/**
 * Con qué foto arranca cada imagen. Unas stories viven de la foto: cada pantalla lleva una, rotando
 * por las de la banda. En un carrusel solo la portada: los pasos en color dan ritmo y el cierre
 * invierte colores. La banda lo cambia con un toque.
 */
export function fotosIniciales(formato: FormatoLamina, total: number, fotos: FotoBanda[]): Array<string | null> {
  return Array.from({ length: total }, (_, i) => {
    if (!fotos.length) return null;
    if (formato === 'stories') return fotos[i % fotos.length].url;
    return i === 0 ? fotos[0].url : null;
  });
}
