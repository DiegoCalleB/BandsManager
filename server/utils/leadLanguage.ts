// Detecta en qué idioma debería escribirse el pitch de booking para un lead,
// a partir de su dirección/ciudad/región (los leads no tienen un campo "país"
// estructurado, así que se busca el nombre del país como texto libre).
// Por defecto español, ya que la mayoría de la cartera de la banda es en España.

import { KEYWORDS_ANGLOFONOS } from '../../src/i18n/epkTranslations.js';

interface LeadLocationLike {
  direccion?: string;
  ciudad?: string;
  region?: string;
}

export interface PitchLanguageHint {
  code: string;
  name: string;
  /** Frase lista para inyectar en el prompt de la IA sustituyendo a "Escribe en castellano...". */
  instruction: string;
}

const COUNTRY_LANGUAGE_MAP: { keywords: string[]; code: string; name: string }[] = [
  { keywords: ['italia', 'italy'], code: 'it', name: 'italiano' },
  { keywords: ['francia', 'france'], code: 'fr', name: 'francés' },
  { keywords: ['portugal'], code: 'pt', name: 'portugués' },
  { keywords: ['alemania', 'germany', 'deutschland'], code: 'de', name: 'alemán' },
  { keywords: ['países bajos', 'holanda', 'netherlands'], code: 'nl', name: 'neerlandés' },
  { keywords: ['bélgica', 'belgium'], code: 'fr', name: 'francés' },
  { keywords: ['suiza', 'switzerland'], code: 'de', name: 'alemán' },
  { keywords: KEYWORDS_ANGLOFONOS, code: 'en', name: 'inglés' },
];

const REGIONAL_LANGUAGE_MAP: { keywords: string[]; code: string; name: string; instruction: string }[] = [
  {
    keywords: ['catalunya', 'cataluña', 'girona', 'lleida', 'tarragona', 'barcelona'],
    code: 'ca',
    name: 'catalán',
    instruction: 'El destinatario se ubica en Cataluña. Si la comunicación de la sala o sus notas están en catalán, o si la banda prefiere el idioma local, redacta el pitch en catalán natural y profesional del sector musical. En caso de duda, el español neutro fluido o catalán natural son igualmente bienvenidos.'
  },
  {
    keywords: ['euskadi', 'país vasco', 'guipúzcoa', 'gipuzkoa', 'vizcaya', 'bizkaia', 'álava', 'araba'],
    code: 'eu',
    name: 'euskera',
    instruction: 'El destinatario se ubica en el País Vasco/Euskadi. Si la sala programa habitualmente en euskera o lo solicita la banda, adapta el saludo y presentación con cortesía en euskera natural del circuito musical.'
  },
  {
    keywords: ['galicia', 'a coruña', 'coruña', 'pontevedra', 'lugo', 'ourense'],
    code: 'gl',
    name: 'gallego',
    instruction: 'El destinatario se ubica en Galicia. Si la sala o la banda usan gallego, redacta el pitch en gallego natural y fluido del sector cultural.'
  }
];

const SPANISH_HINT: PitchLanguageHint = {
  code: 'es',
  name: 'español',
  instruction: 'Escribe en castellano natural de España (estilo mundillo musical: cercano, profesional y con pasión por el directo).'
};

export function detectPitchLanguage(lead: LeadLocationLike): PitchLanguageHint {
  const haystack = ` ${lead.direccion || ''} ${lead.region || ''} ${lead.ciudad || ''} `.toLowerCase();

  // 1. Detectar idioma internacional
  for (const entry of COUNTRY_LANGUAGE_MAP) {
    if (entry.keywords.some(kw => haystack.includes(kw))) {
      return {
        code: entry.code,
        name: entry.name,
        instruction: `El destinatario está en un país de habla ${entry.name} (según su dirección/ciudad) — escribe el pitch ÍNTEGRAMENTE en ${entry.name} natural y profesional, adaptando el tono al mundillo musical local. No lo escribas en español.`
      };
    }
  }

  // 2. Detectar región con lengua cooficial para enriquecer la instrucción
  for (const reg of REGIONAL_LANGUAGE_MAP) {
    if (reg.keywords.some(kw => haystack.includes(kw))) {
      return {
        code: 'es',
        name: 'español (con adaptación regional)',
        instruction: `${SPANISH_HINT.instruction} Nota regional: ${reg.instruction}`
      };
    }
  }

  return SPANISH_HINT;
}
