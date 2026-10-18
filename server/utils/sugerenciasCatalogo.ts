/**
 * Sugerencias del catálogo compartido para una banda nueva (fase 3): reglas puras.
 *
 * Una sugerencia tiene que ser relevante (misma ciudad o región, o mismo género) y se ordena por cercanía, afinidad
 * de género y fiabilidad. Cada una lleva los motivos en palabras llanas para que la banda vea por qué se la proponemos.
 * Nunca se sugiere una sala que la banda ya tiene ni una marcada «no contactar». Sin email ni teléfono, como la consulta.
 */
import { ciudadPrincipal, normalizarTexto } from './salaCatalogo.js';
import { fichaDeSala, type FichaCatalogo } from './consultaCatalogo.js';
import type { SalaGuardada } from '../services/catalogoSalas.js';

export const SUGERENCIAS_POR_DEFECTO = 8;
export const SUGERENCIAS_MAXIMO = 20;

export interface PerfilBanda {
  /** Ciudad base tal como la escribe la banda («Madrid, España»). */
  ciudad: string;
  genero: string;
}

export interface Sugerencia extends FichaCatalogo {
  motivos: string[];
}

/** Palabras que no dicen nada del género. */
const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'el', 'y', 'e', 'en', 'con', 'musica', 'directo', 'directos', 'variado', 'club', 'live', 'fusion']);
const PESO_TIPO: Record<string, number> = { sala: 3, festival: 2 };

/** «Comunidad de Madrid», «Galicia (Lugo)» y «Madrid» comparten región: sin paréntesis ni prefijo administrativo. */
export function regionNormalizada(valor: string | null | undefined): string {
  return normalizarTexto((valor ?? '').replace(/\(.*?\)/g, ''))
    .replace(/^(comunidad (de|foral de)?|region de|provincia de)\s*/, '')
    .trim();
}

/** Palabras con contenido de un texto de género («Rock / Ska / Reggae») para compararlas. */
export function palabrasDeGenero(valor: string | null | undefined): Set<string> {
  return new Set(normalizarTexto(valor ?? '').split(' ').filter((p) => p.length > 2 && !PALABRAS_VACIAS.has(p)));
}

/** La región de la ciudad de la banda, tomada de las salas del catálogo que están en ella (la más repetida). */
function regionDeLaCiudad(salas: SalaGuardada[], ciudad: string): string {
  const cuenta = new Map<string, number>();
  for (const s of salas) {
    if (normalizarTexto(ciudadPrincipal(s.ciudad)) !== ciudad) continue;
    const r = regionNormalizada(s.region);
    if (r) cuenta.set(r, (cuenta.get(r) ?? 0) + 1);
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

export function sugerirSalas(
  salas: SalaGuardada[],
  perfil: PerfilBanda,
  agenda: { ids: Set<string>; claves: Set<string> },
  limite = SUGERENCIAS_POR_DEFECTO,
): Sugerencia[] {
  const ciudad = normalizarTexto(ciudadPrincipal(perfil.ciudad));
  const region = ciudad ? regionDeLaCiudad(salas, ciudad) : '';
  const generoBanda = palabrasDeGenero(perfil.genero);

  const candidatas = salas.flatMap((s) => {
    if (s.no_contactar || agenda.ids.has(s.id) || agenda.claves.has(s.clave)) return [];
    const motivos: string[] = [];
    let puntos = 0;

    const mismaCiudad = !!ciudad && normalizarTexto(ciudadPrincipal(s.ciudad)) === ciudad;
    const mismaRegion = !mismaCiudad && !!region && regionNormalizada(s.region) === region;
    if (mismaCiudad) {
      puntos += 40;
      motivos.push('En tu ciudad');
    } else if (mismaRegion) {
      puntos += 20;
      motivos.push('En tu zona');
    }

    const compartidas = [...palabrasDeGenero(s.genero)].filter((p) => generoBanda.has(p)).length;
    if (compartidas > 0) {
      puntos += Math.min(compartidas, 3) * 8;
      motivos.push('Programa tu género');
    }

    // Sin cercanía ni afinidad no es una sugerencia, es ruido: la fiabilidad sola no la hace relevante.
    if (motivos.length === 0) return [];

    if (s.nivel !== 'sin_verificar' && s.bandas_con_respuesta > 0) motivos.push('Otras bandas ya recibieron respuesta');
    puntos += s.nivel === 'verificada' ? 20 : s.nivel === 'probable' ? 10 : 0;
    puntos += Math.round(s.puntuacion / 10);
    puntos += s.email_contacto || s.telefono ? 5 : 0;
    puntos += PESO_TIPO[s.tipo] ?? 0;
    return [{ sala: s, puntos, motivos }];
  });

  candidatas.sort((a, b) => b.puntos - a.puntos || a.sala.nombre.localeCompare(b.sala.nombre, 'es'));
  return candidatas.slice(0, Math.min(limite, SUGERENCIAS_MAXIMO)).map(({ sala, motivos }) => ({ ...fichaDeSala(sala, false), motivos }));
}
