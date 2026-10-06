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
  // Reino Unido, Irlanda y EE.UU. compartían resultado en dos entradas distintas: ahora salen
  // de la MISMA lista que decide a qué idioma del EPK apunta el enlace del pitch
  // (src/i18n/epkTranslations.ts), para que el correo y el dossier no se contradigan.
  { keywords: KEYWORDS_ANGLOFONOS, code: 'en', name: 'inglés' },
];

const SPANISH_HINT: PitchLanguageHint = {
  code: 'es',
  name: 'español',
  instruction: 'Escribe en castellano natural de España (estilo mundillo musical: cercano, profesional y con pasión por el directo).'
};

export function detectPitchLanguage(lead: LeadLocationLike): PitchLanguageHint {
  const haystack = ` ${lead.direccion || ''} ${lead.region || ''} ${lead.ciudad || ''} `.toLowerCase();

  for (const entry of COUNTRY_LANGUAGE_MAP) {
    if (entry.keywords.some(kw => haystack.includes(kw))) {
      return {
        code: entry.code,
        name: entry.name,
        instruction: `El destinatario está en un país de habla ${entry.name} (según su dirección/ciudad) — escribe el pitch ÍNTEGRAMENTE en ${entry.name} natural y profesional, adaptando el tono al mundillo musical local. No lo escribas en español.`
      };
    }
  }

  return SPANISH_HINT;
}
