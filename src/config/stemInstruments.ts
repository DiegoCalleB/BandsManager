/**
 * Categorías de instrumento que usa el motor de separación de stems por IA
 * (ver STEM_METADATA en server/routes/ai_music.ts, misma lista literal).
 * Se reutiliza aquí para sugerir el instrumento de cada miembro de la banda
 * (UserManagementModal) y para emparejar automáticamente "miembro -> pista"
 * en el mezclador (modo Ensayo Individual, Mi Monitor, exportar sin mi pista).
 */
export const STEM_INSTRUMENT_CATEGORIES = ['Voz',' Batería',' Bajo',' Guitarras',' Teclados',' Arreglos'] as const;

export type StemInstrumentCategory = typeof STEM_INSTRUMENT_CATEGORIES[number];

/** Roles habituales en una banda que no son un stem aislable, para el desplegable de miembros. */
export const NON_STEM_ROLES = ['Coros',' Manager',' Técnico de Sonido',' Otro'];

const COMBINING_DIACRITIC_START = 0x0300;
const COMBINING_DIACRITIC_END = 0x036f;

/** Quita acentos (á -> a) sin depender de un rango unicode literal en el código fuente. */
function stripDiacritics(value: string): string {
 return Array.from(value.normalize('NFD'))
 .filter(ch => {
 const code = ch.codePointAt(0) ?? 0;
 return code < COMBINING_DIACRITIC_START || code > COMBINING_DIACRITIC_END;
 })
 .join('');
}

function normalizeInstrumentLabel(value: string): string {
 return stripDiacritics(value.toLowerCase()).trim();
}

const INSTRUMENT_ALIASES: Record<string, StemInstrumentCategory> = {
 voz:' Voz', vocal:' Voz', vocalista:' Voz', cantante:' Voz', voces:' Voz',
 bateria:' Batería', percusion:' Batería', baterista:' Batería',
 bajo:' Bajo', bajista:' Bajo',
 guitarra:' Guitarras', guitarras:' Guitarras', guitarrista:' Guitarras',
 teclado:' Teclados', teclados:' Teclados', piano:' Teclados', pianista:' Teclados', sintetizador:' Teclados',
 arreglos:' Arreglos', cuerdas:' Arreglos', vientos:' Arreglos', sintes:' Arreglos'
};

/**
 * Empareja el instrumento en texto libre de un miembro (User.instrument) con una de las
 * categorías fijas de stem. Devuelve null si no hay ninguna coincidencia razonable (p.ej.
 * "Manager" o "Técnico de Sonido" no tienen pista propia que aislar).
 */
export function matchInstrumentToStemCategory(instrument: string | undefined | null): StemInstrumentCategory | null {
 if (!instrument) return null;
 const normalized = normalizeInstrumentLabel(instrument);
 if (!normalized) return null;

 const direct = INSTRUMENT_ALIASES[normalized];
 if (direct) return direct;

 for (const [alias, category] of Object.entries(INSTRUMENT_ALIASES)) {
 if (normalized.includes(alias)) return category;
 }
 return null;
}
