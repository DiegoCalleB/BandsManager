// Idiomas del EPK público (/epk?band=...&lang=...). Ese enlace es la carta de presentación
// de la banda ante salas y festivales, y los agentes ya escriben el pitch en el idioma del
// lead (server/utils/leadLanguage.ts) — así que la página que abre el destinatario tiene que
// poder ir a juego en vez de estar siempre en español.
//
// Aquí SOLO viven las etiquetas fijas de la interfaz. El contenido que escribe la banda
// (biografía, lema, bios de los miembros) NO se traduce aquí: eso se guarda por banda en la
// Google Sheet/Supabase y se repasa a mano desde el gestor del EPK.
//
// Para añadir un idioma nuevo basta con: sumar su código a EpkLanguage, una entrada a
// EPK_LANGUAGES y un bloque de diccionario a EPK_TRANSLATIONS. Nada más en toda la app.

export type EpkLanguage = 'es' | 'en';

export const DEFAULT_EPK_LANGUAGE: EpkLanguage = 'es';

export const EPK_LANGUAGES: { code: EpkLanguage; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function isEpkLanguage(value: string | null | undefined): value is EpkLanguage {
  return !!value && EPK_LANGUAGES.some(l => l.code === value);
}

// Las cadenas con {bandName}, {n} o {year} se rellenan con interpolate() de fansTranslations.
export interface EpkDict {
  // Barra superior y estados
  cargando: string;
  bandaPorDefecto: string;
  insigniaCabecera: string;
  logoAlt: string;
  logoOficialAlt: string;
  enlaceCopiado: string;
  compartir: string;
  imprimirLargo: string;
  imprimirCorto: string;
  selectorIdioma: string;

  // Hero
  lemaPorDefectoBakandeya: string;
  lemaPorDefecto: string;

  // Textos de relleno cuando la banda aún no ha rellenado su EPK
  bioPorDefectoBakandeya: string;
  bioPorDefecto: string;
  riderPorDefecto: string;

  // Datos de contratación
  seccionDatos: string;
  etiquetaMusicos: string;
  etiquetaDuracion: string;
  unidadMinutos: string;
  etiquetaCiudadBase: string;
  etiquetaFormatos: string;
  etiquetaNecesidades: string;

  // Vídeo
  seccionVideo: string;
  tituloVideoPorDefecto: string;

  // Formación
  seccionBanda: string;

  // Biografía y contacto
  seccionBio: string;
  contactoTitulo: string;
  contactoSubtitulo: string;
  managerPorDefecto: string;
  asuntoContratacion: string;
  ctaCache: string;

  // Temas
  seccionTemas: string;
  sonando: string;
  escuchar: string;

  // Galería
  seccionGaleria: string;
  fotoAlt: string;
  fotoPromocional: string;
  fotoAnterior: string;
  fotoSiguiente: string;

  // Escucha
  seccionEscucha: string;
  tituloSpotify: string;

  // Rider
  seccionRider: string;
  descargarRider: string;
  riderCopiado: string;
  copiarTexto: string;

  // Fechas y pie
  seccionFechas: string;
  descargarDossier: string;
  pieDerechos: string;
}

const es: EpkDict = {
  cargando: 'Cargando Kit de Prensa...',
  bandaPorDefecto: 'Banda',
  insigniaCabecera: '{bandName} — EPK / Press Kit',
  logoAlt: 'Logo {bandName}',
  logoOficialAlt: 'Logo Oficial {bandName}',
  enlaceCopiado: '¡Enlace Copiado!',
  compartir: 'Compartir',
  imprimirLargo: 'Descargar PDF / Imprimir',
  imprimirCorto: 'PDF',
  selectorIdioma: 'Idioma',

  lemaPorDefectoBakandeya: 'Ska-Rock, Mestizaje & Ritmos Latinos en Vivo',
  lemaPorDefecto: '{bandName} en Directo',

  bioPorDefectoBakandeya: 'Bakandeya es una propuesta vibrante de mestizaje, ska-rock, reggae y ritmos latinos...',
  bioPorDefecto: '{bandName} — Propuesta musical en directo.',
  riderPorDefecto: 'PA y microfonía profesional de directo...',

  seccionDatos: 'Datos para Contratación',
  etiquetaMusicos: 'Músicos en escena',
  etiquetaDuracion: 'Duración del directo',
  unidadMinutos: 'min',
  etiquetaCiudadBase: 'Ciudad base',
  etiquetaFormatos: 'Formatos',
  etiquetaNecesidades: 'Necesidades de escenario',

  seccionVideo: 'Vídeo en Directo',
  tituloVideoPorDefecto: '{bandName} en directo',

  seccionBanda: 'La Banda',

  seccionBio: 'Biografía & Propuesta Musical',
  contactoTitulo: 'Contacto de Booking',
  contactoSubtitulo: 'Atención directa a programadores de salas, comisiones de fiestas y festivales:',
  managerPorDefecto: 'Mánager {bandName}',
  asuntoContratacion: 'Contratación {bandName} {year}',
  ctaCache: 'Solicitar Caché & Disponibilidad',

  seccionTemas: 'Temas Destacados / Repertorio Principal',
  sonando: 'Sonando',
  escuchar: 'Escuchar',

  seccionGaleria: 'Galería de Imagen & Prensa',
  fotoAlt: 'Foto oficial {n}',
  fotoPromocional: 'Foto Promocional #{n}',
  fotoAnterior: 'Foto anterior',
  fotoSiguiente: 'Foto siguiente',

  seccionEscucha: 'Escúchanos y Míranos en Directo',
  tituloSpotify: '{bandName} en Spotify',

  seccionRider: 'Rider Técnico',
  descargarRider: 'Descargar PDF Rider',
  riderCopiado: '¡Rider técnico copiado al portapapeles!',
  copiarTexto: 'Copiar Texto',

  seccionFechas: 'Próximas Fechas de Gira',
  descargarDossier: 'Descargar Dossier en PDF',
  pieDerechos: '© {year} {bandName} — Todos los derechos reservados. Kit de prensa generado por BandManager.ai',
};

const en: EpkDict = {
  cargando: 'Loading Press Kit...',
  bandaPorDefecto: 'Band',
  insigniaCabecera: '{bandName} — EPK / Press Kit',
  logoAlt: '{bandName} logo',
  logoOficialAlt: '{bandName} official logo',
  enlaceCopiado: 'Link copied!',
  compartir: 'Share',
  imprimirLargo: 'Download PDF / Print',
  imprimirCorto: 'PDF',
  selectorIdioma: 'Language',

  lemaPorDefectoBakandeya: 'Ska-Rock, Mestizaje & Latin Rhythms Live',
  lemaPorDefecto: '{bandName} Live',

  bioPorDefectoBakandeya: 'Bakandeya is a vibrant blend of mestizaje, ska-rock, reggae and Latin rhythms...',
  bioPorDefecto: '{bandName} — Live music act.',
  riderPorDefecto: 'Professional live PA and microphone setup...',

  seccionDatos: 'Booking Information',
  etiquetaMusicos: 'Musicians on stage',
  etiquetaDuracion: 'Set length',
  unidadMinutos: 'min',
  etiquetaCiudadBase: 'Home city',
  etiquetaFormatos: 'Available formats',
  etiquetaNecesidades: 'Stage requirements',

  seccionVideo: 'Live Video',
  tituloVideoPorDefecto: '{bandName} live',

  seccionBanda: 'The Band',

  seccionBio: 'Biography & Live Show',
  contactoTitulo: 'Booking Contact',
  contactoSubtitulo: 'Direct line for venue bookers, festival programmers and local councils:',
  managerPorDefecto: '{bandName} Manager',
  asuntoContratacion: 'Booking {bandName} {year}',
  ctaCache: 'Request Fee & Availability',

  seccionTemas: 'Featured Tracks / Core Repertoire',
  sonando: 'Playing',
  escuchar: 'Listen',

  seccionGaleria: 'Press & Promo Gallery',
  fotoAlt: 'Official photo {n}',
  fotoPromocional: 'Promo photo #{n}',
  fotoAnterior: 'Previous photo',
  fotoSiguiente: 'Next photo',

  seccionEscucha: 'Listen & Watch Us Live',
  tituloSpotify: '{bandName} on Spotify',

  seccionRider: 'Technical Rider',
  descargarRider: 'Download Rider PDF',
  riderCopiado: 'Technical rider copied to clipboard!',
  copiarTexto: 'Copy Text',

  seccionFechas: 'Upcoming Tour Dates',
  descargarDossier: 'Download Press Kit PDF',
  pieDerechos: '© {year} {bandName} — All rights reserved. Press kit generated by BandManager.ai',
};

export const EPK_TRANSLATIONS: Record<EpkLanguage, EpkDict> = { es, en };

// Países cuyo idioma de trabajo es el inglés, en las formas en que aparecen escritos en la
// dirección/ciudad/región de un lead (los leads no tienen campo "país" estructurado). Fuente
// única: server/utils/leadLanguage.ts lo importa para decidir el idioma del pitch, y aquí se
// usa para decidir a qué versión del EPK apunta el enlace de la firma. Si se separan, un lead
// de Londres acabaría recibiendo un pitch en inglés con un enlace a la página en español.
export const KEYWORDS_ANGLOFONOS = [
  'reino unido', 'united kingdom', 'inglaterra', 'england', 'scotland', 'wales',
  'ireland', 'irlanda', 'estados unidos', 'united states', ' usa', 'u.s.a.',
];

/**
 * Decide en qué idioma debe abrirse el EPK para un lead concreto. Hoy el EPK solo tiene
 * español e inglés, así que la pregunta se reduce a "¿es un contacto anglófono?". Cualquier
 * otro país cae en español, que es el comportamiento de siempre.
 */
export function idiomaEpkParaLead(lead: { direccion?: string; ciudad?: string; region?: string } | null | undefined): EpkLanguage {
  if (!lead) return DEFAULT_EPK_LANGUAGE;
  const texto = ` ${lead.direccion || ''} ${lead.region || ''} ${lead.ciudad || ''} `.toLowerCase();
  return KEYWORDS_ANGLOFONOS.some(kw => texto.includes(kw)) ? 'en' : DEFAULT_EPK_LANGUAGE;
}
