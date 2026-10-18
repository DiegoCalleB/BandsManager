/**
 * Procedencia de los datos de un lead: de qué fuente salió cada campo enriquecido, cuándo y con qué confianza.
 *
 * El enriquecimiento junta fuentes muy distintas (Google Maps, la web de la sala, un buscador, otras bandas, una IA) y
 * hasta ahora el resultado no decía de dónde venía cada dato: un email inventado por una IA y uno copiado de la web
 * oficial eran indistinguibles. Con la procedencia se puede avisar de lo poco fiable y no tratarlo como un hecho.
 *
 * Solo se anotan los campos que el enriquecimiento ha rellenado; lo que escribe la banda a mano no lleva anotación.
 */

export type FuenteDato = 'places' | 'catalogo' | 'web' | 'buscador' | 'ia';
export type ConfianzaDato = 'alta' | 'media' | 'baja';

/**
 * Algo que conviene que la banda compruebe de un dato. Va ligado al valor exacto (`para`): si lo edita, el aviso deja
 * de aplicarse solo, sin que nadie tenga que borrarlo.
 */
export interface AvisoDato {
  tipo: 'dominio_inexistente';
  para: string;
}

export interface Procedencia {
  fuente: FuenteDato;
  confianza: ConfianzaDato;
  /** ISO 8601 del momento en que se rellenó. */
  en: string;
  aviso?: AvisoDato;
}

export type MapaProcedencia = Record<string, Procedencia>;

/** Campos del lead que añade el enriquecimiento (el tipo `Lead` compartido con la interfaz no los lleva todavía). */
export interface CamposDeEnriquecimiento {
  /** Id de la ficha de Google Maps: identifica la sala y suma fiabilidad en el catálogo. */
  place_id?: string;
  datos_fuentes?: MapaProcedencia;
}

/** Confianza por fuente: Google Maps y la web de la propia sala son hechos; un buscador, una pista; una IA, una suposición. */
export const CONFIANZA_POR_FUENTE: Record<FuenteDato, ConfianzaDato> = {
  places: 'alta',
  web: 'alta',
  catalogo: 'media',
  buscador: 'media',
  ia: 'baja',
};

/** Los campos del lead que el enriquecimiento puede rellenar y de los que se guarda procedencia. */
export const CAMPOS_ENRIQUECIBLES = [
  'place_id',
  'direccion',
  'ciudad',
  'region',
  'telefono',
  'telefono_fijo',
  'telefono_movil',
  'website',
  'email_contacto',
  'email_secundario',
  'instagram',
  'aforo',
  'genero',
  'contacto_nombre',
  'imagen_url',
] as const;

export type CampoEnriquecible = (typeof CAMPOS_ENRIQUECIBLES)[number];

const CAMPOS = new Set<string>(CAMPOS_ENRIQUECIBLES);
const FUENTES = new Set<string>(Object.keys(CONFIANZA_POR_FUENTE));

const vacio = (v: unknown): boolean => v === undefined || v === null || v === '' || v === 0;

/** Valores de los campos enriquecibles de un lead en este momento (para comparar antes y después de una etapa). */
export function instantanea(lead: object): Record<string, unknown> {
  const origen = lead as Record<string, unknown>;
  return Object.fromEntries(CAMPOS_ENRIQUECIBLES.map((c) => [c, origen[c]]));
}

/** Campos que estaban vacíos y ahora tienen valor: los que una etapa de enriquecimiento acaba de aportar. */
export function camposRellenados(antes: Record<string, unknown>, ahora: Record<string, unknown>): string[] {
  return CAMPOS_ENRIQUECIBLES.filter((c) => vacio(antes[c]) && !vacio(ahora[c]));
}

/**
 * Procedencia leída de la base de datos o del cuerpo de una petición, que no es de fiar: solo pasan los campos y
 * fuentes conocidos, con la confianza que corresponde a la fuente (nadie se puede apuntar una «alta»).
 */
export function procedenciaValida(bruta: unknown): MapaProcedencia {
  if (!bruta || typeof bruta !== 'object' || Array.isArray(bruta)) return {};
  const limpia: MapaProcedencia = {};
  for (const [campo, valor] of Object.entries(bruta as Record<string, unknown>)) {
    if (!CAMPOS.has(campo) || !valor || typeof valor !== 'object') continue;
    const { fuente, en, aviso } = valor as { fuente?: unknown; en?: unknown; aviso?: { tipo?: unknown; para?: unknown } | null };
    if (typeof fuente !== 'string' || !FUENTES.has(fuente) || typeof en !== 'string' || Number.isNaN(Date.parse(en))) continue;
    limpia[campo] = { fuente: fuente as FuenteDato, confianza: CONFIANZA_POR_FUENTE[fuente as FuenteDato], en };
    if (aviso?.tipo === 'dominio_inexistente' && typeof aviso.para === 'string' && aviso.para.length > 0 && aviso.para.length <= 254) {
      limpia[campo].aviso = { tipo: 'dominio_inexistente', para: aviso.para };
    }
  }
  return limpia;
}

/** Mapa nuevo con los `campos` anotados como aportados por `fuente`. No modifica el que recibe. */
export function anotarProcedencia(actual: unknown, campos: readonly string[], fuente: FuenteDato, ahora: Date = new Date()): MapaProcedencia {
  const mapa = procedenciaValida(actual);
  for (const campo of campos) {
    if (CAMPOS.has(campo)) mapa[campo] = { fuente, confianza: CONFIANZA_POR_FUENTE[fuente], en: ahora.toISOString() };
  }
  return mapa;
}

/** Si el usuario edita un campo a mano, deja de ser un dato enriquecido: se quita su anotación. */
export function olvidarProcedencia(actual: unknown, campos: readonly string[]): MapaProcedencia {
  const mapa = procedenciaValida(actual);
  for (const campo of campos) delete mapa[campo];
  return mapa;
}

/** Campos cuyo valor viene de una fuente de confianza baja (una IA): hay que confirmarlos antes de fiarse de ellos. */
export function camposPorConfirmar(mapa: unknown): string[] {
  return Object.entries(procedenciaValida(mapa))
    .filter(([, p]) => p.confianza === 'baja')
    .map(([campo]) => campo);
}
