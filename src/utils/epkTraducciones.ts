import { EPKConfig, BandMember, EPKVideo, EPKContenidoTraducido } from '../types';

/**
 * Utilidades compartidas (servidor y navegador) para el EPK multiidioma.
 *
 * Reglas que sostienen todo esto:
 *  - Solo se traduce PROSA. Nombres de personas, emails, teléfonos, URLs, números, la ciudad
 *    base y los títulos de las canciones se quedan como están en cualquier idioma.
 *  - Miembros y vídeos se indexan por su `id`, nunca por posición: reordenar o borrar un
 *    miembro no puede descolocar las traducciones de los demás.
 *  - El español es siempre el original; nunca se guarda una "traducción al español".
 */

export const IDIOMA_ORIGEN = 'es';

/** Los tres datos de contratación que son texto libre. El resto son números o nombres propios. */
export const CLAVES_DATOS_TRADUCIBLES = ['duracionDirecto', 'formatos', 'necesidadesEscenario'] as const;
export type ClaveDatoTraducible = typeof CLAVES_DATOS_TRADUCIBLES[number];

export interface TextosTraducibles {
  biografia: string;
  textoPie: string;
  riderTecnico: string;
  miembros: { id: string; rol: string; bio: string }[];
  videos: { id: string; titulo: string }[];
  datosContratacion: Record<ClaveDatoTraducible, string>;
}

/**
 * Extrae del EPK exactamente los textos que hay que traducir, en un orden estable. Es a la vez
 * lo que se le manda al modelo y la base del hash de frescura, así que ambas cosas no pueden
 * descuadrarse: si un campo entra aquí, entra en las dos.
 */
export function recopilarTextosTraducibles(config: Partial<EPKConfig> | null | undefined): TextosTraducibles {
  const miembros = (config?.miembros || []) as BandMember[];
  const videos = (config?.videos || []) as EPKVideo[];
  const datos: any = config?.datosContratacion || {};

  const datosTraducibles = {} as Record<ClaveDatoTraducible, string>;
  for (const clave of CLAVES_DATOS_TRADUCIBLES) {
    datosTraducibles[clave] = String(datos[clave] ?? '');
  }

  return {
    biografia: config?.biografia || '',
    textoPie: config?.firmaEmail?.textoPie || '',
    riderTecnico: config?.riderTecnico || '',
    miembros: miembros
      .filter(m => m?.id && ((m.rol || '').trim() || (m.bio || '').trim()))
      .map(m => ({ id: m.id, rol: m.rol || '', bio: m.bio || '' }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    videos: videos
      .filter(v => v?.id && (v.titulo || '').trim())
      .map(v => ({ id: v.id, titulo: v.titulo || '' }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    datosContratacion: datosTraducibles,
  };
}

/** true si no hay absolutamente nada que traducir (EPK recién creado, sin contenido). */
export function hayAlgoQueTraducir(textos: TextosTraducibles): boolean {
  return Boolean(
    textos.biografia.trim() || textos.textoPie.trim() || textos.riderTecnico.trim() ||
    textos.miembros.length || textos.videos.length ||
    CLAVES_DATOS_TRADUCIBLES.some(c => textos.datosContratacion[c].trim())
  );
}

/**
 * Huella del contenido original. No es criptografía: solo hace falta detectar que el texto ha
 * cambiado desde la última traducción, y tiene que dar el mismo resultado en Node y en el
 * navegador — por eso un FNV-1a a mano en vez de depender de crypto/SubtleCrypto.
 */
export function calcularHashFuente(config: Partial<EPKConfig> | null | undefined): string {
  const canonico = JSON.stringify(recopilarTextosTraducibles(config));
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonico.length; i++) {
    hash ^= canonico.charCodeAt(i);
    // FNV-1a de 32 bits. Math.imul mantiene la multiplicación en 32 bits con signo.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** true si la traducción de ese idioma existe pero se generó con un texto que ya ha cambiado. */
export function traduccionDesactualizada(config: Partial<EPKConfig> | null | undefined, idioma: string): boolean {
  const traduccion = config?.traducciones?.[idioma];
  if (!traduccion || !traduccion._fuenteHash) return false;
  return traduccion._fuenteHash !== calcularHashFuente(config);
}

export function tieneTraduccion(config: Partial<EPKConfig> | null | undefined, idioma: string): boolean {
  const t = config?.traducciones?.[idioma];
  if (!t) return false;
  return Boolean(
    (t.biografia || '').trim() || (t.textoPie || '').trim() || (t.riderTecnico || '').trim() ||
    Object.keys(t.miembros || {}).length || Object.keys(t.videos || {}).length ||
    Object.keys(t.datosContratacion || {}).length
  );
}

export interface ResolutorEpk {
  biografia: string;
  textoPie: string;
  riderTecnico: string;
  rolMiembro: (m: BandMember) => string;
  bioMiembro: (m: BandMember) => string;
  tituloVideo: (v: EPKVideo) => string;
  dato: (clave: ClaveDatoTraducible) => string;
}

/**
 * Devuelve los textos ya resueltos para un idioma, cayendo al original CAMPO A CAMPO. Así una
 * traducción a medias degrada bien (mezcla de inglés y español) en vez de dejar huecos en
 * blanco en la página. Una traducción desactualizada se sigue sirviendo a propósito: para
 * quien no lee español, una biografía inglesa algo antigua es mejor que una española — el
 * aviso de "está vieja" es cosa de la banda, en el gestor, no del visitante.
 */
export function resolverContenidoEpk(
  config: Partial<EPKConfig> | null | undefined,
  idioma: string
): ResolutorEpk {
  const tr: EPKContenidoTraducido =
    (idioma && idioma !== IDIOMA_ORIGEN && config?.traducciones?.[idioma]) || {};

  const usar = (traducido: string | undefined, original: string | undefined): string =>
    (traducido && traducido.trim()) ? traducido : (original || '');

  const datos: any = config?.datosContratacion || {};

  return {
    biografia: usar(tr.biografia, config?.biografia),
    textoPie: usar(tr.textoPie, config?.firmaEmail?.textoPie),
    riderTecnico: usar(tr.riderTecnico, config?.riderTecnico),
    rolMiembro: (m) => usar(tr.miembros?.[m?.id]?.rol, m?.rol),
    bioMiembro: (m) => usar(tr.miembros?.[m?.id]?.bio, m?.bio),
    tituloVideo: (v) => usar(tr.videos?.[v?.id]?.titulo, v?.titulo),
    dato: (clave) => usar(tr.datosContratacion?.[clave], datos[clave] === undefined || datos[clave] === null ? '' : String(datos[clave])),
  };
}
