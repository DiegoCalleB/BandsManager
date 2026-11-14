/** Países del directorio de festivales: nombre en cada idioma y el código que pide schema.org. */
import type { IdiomaSeo } from '../rutas.js';

const NOMBRES: Record<string, [string, string]> = {
  ES: ['España', 'Spain'], PT: ['Portugal', 'Portugal'], FR: ['Francia', 'France'], IT: ['Italia', 'Italy'], DE: ['Alemania', 'Germany'],
  UK: ['Reino Unido', 'United Kingdom'], GB: ['Reino Unido', 'United Kingdom'], IE: ['Irlanda', 'Ireland'], NL: ['Países Bajos', 'Netherlands'],
  BE: ['Bélgica', 'Belgium'], LU: ['Luxemburgo', 'Luxembourg'], CH: ['Suiza', 'Switzerland'], AT: ['Austria', 'Austria'], DK: ['Dinamarca', 'Denmark'],
  SE: ['Suecia', 'Sweden'], NO: ['Noruega', 'Norway'], FI: ['Finlandia', 'Finland'], IS: ['Islandia', 'Iceland'], PL: ['Polonia', 'Poland'],
  CZ: ['Chequia', 'Czechia'], SK: ['Eslovaquia', 'Slovakia'], HU: ['Hungría', 'Hungary'], SI: ['Eslovenia', 'Slovenia'], HR: ['Croacia', 'Croatia'],
  RS: ['Serbia', 'Serbia'], ME: ['Montenegro', 'Montenegro'], RO: ['Rumanía', 'Romania'], BG: ['Bulgaria', 'Bulgaria'], GR: ['Grecia', 'Greece'],
  LV: ['Letonia', 'Latvia'], LT: ['Lituania', 'Lithuania'], EE: ['Estonia', 'Estonia'], MT: ['Malta', 'Malta'],
};

/** Código guardado → ISO 3166-1 (el catálogo usa «UK» para el Reino Unido; schema.org quiere «GB»). */
export const codigoIso = (pais: string): string => (pais.toUpperCase() === 'UK' ? 'GB' : pais.toUpperCase());

export const nombrePais = (pais: string, idioma: IdiomaSeo): string => NOMBRES[pais.toUpperCase()]?.[idioma === 'es' ? 0 : 1] ?? pais.toUpperCase();
