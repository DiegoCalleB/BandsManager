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

export type EpkLanguage = 'es' | 'en' | 'it' | 'cs';

export const DEFAULT_EPK_LANGUAGE: EpkLanguage = 'es';

export const EPK_LANGUAGES: { code: EpkLanguage; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
];

export function isEpkLanguage(value: string | null | undefined): value is EpkLanguage {
  return !!value && EPK_LANGUAGES.some(l => l.code === value);
}

/**
 * Qué idiomas se ofrecen en el selector del EPK, a partir del idioma de contexto (el que trae
 * el enlace: ?lang= puesto por el agente Redactor según el país del lead, o heredado del
 * "Únete" del concierto — ver FansLanding). Misma filosofía que idiomasDisponiblesParaConcierto
 * en fansTranslations: un programador italiano que abre el dossier y ve "Italiano" entre 3
 * banderas siente que se lo habéis mandado a él; entre 4 banderas de medio mundo es un PDF más.
 */
export function idiomasDisponiblesParaEpk(idiomaContexto: EpkLanguage): EpkLanguage[] {
  if (idiomaContexto === 'es' || idiomaContexto === 'en') {
    return ['es', 'en'];
  }
  return [idiomaContexto, 'en', 'es'];
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

  // Fechas y pie
  seccionFechas: string;
  descargarDossier: string;
  pieDerechos: string;

  // Cifras Clave & Social Proof
  seccionCifras: string;
  cifraOyentes: string;
  cifraDirectos: string;
  cifraComunidad: string;
  cifraCiudades: string;
  playerPista: string;
  playerCerrar: string;
  descargarKitPrensa: string;

  // Citas de Prensa & Reseñas
  seccionPrensa: string;
  prensaSubtitulo: string;

  // Redes y miembros
  seguirInstagram: string;
  seguirMiembro: string;
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

  seccionBio: 'Biografía y Propuesta Musical',
  contactoTitulo: 'Contacto de Booking',
  contactoSubtitulo: 'Atención directa a programadores de salas, comisiones de fiestas y festivales:',
  managerPorDefecto: 'Mánager {bandName}',
  asuntoContratacion: 'Contratación {bandName} {year}',
  ctaCache: 'Consultar Disponibilidad & Contratación',

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


  seccionFechas: 'Próximas Fechas de Gira',
  descargarDossier: 'Descargar Dossier en PDF',
  pieDerechos: '© {year} {bandName} — Todos los derechos reservados. Kit de prensa generado por BandManager.io',

  seccionCifras: 'Impacto & Cifras Clave',
  cifraOyentes: 'Oyentes & Streams',
  cifraDirectos: 'Directos & Shows',
  cifraComunidad: 'Comunidad & Fans',
  cifraCiudades: 'Ciudades en Gira',
  playerPista: 'Reproduciendo',
  playerCerrar: 'Cerrar reproductor',
  descargarKitPrensa: 'Kit de Prensa HD (Fotos & Logos)',

  seccionPrensa: 'Prensa & Reseñas Destacadas',
  prensaSubtitulo: 'Lo que dicen los medios especializados y la crítica de nuestros directos:',
  seguirInstagram: 'Seguir en Instagram',
  seguirMiembro: 'Seguir a {name} en Instagram',
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
  ctaCache: 'Check Availability & Booking',

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


  seccionFechas: 'Upcoming Tour Dates',
  descargarDossier: 'Download Press Kit PDF',
  pieDerechos: '© {year} {bandName} — All rights reserved. Press kit generated by BandManager.io',

  seccionCifras: 'Key Stats & Reach',
  cifraOyentes: 'Streams & Listeners',
  cifraDirectos: 'Live Shows & Festivals',
  cifraComunidad: 'Community & Fans',
  cifraCiudades: 'Tour Cities',
  playerPista: 'Now Playing',
  playerCerrar: 'Close player',
  descargarKitPrensa: 'HD Press Kit (Photos & Logos)',

  seccionPrensa: 'Press & Media Reviews',
  prensaSubtitulo: 'What music magazines and critics say about our live concerts:',
  seguirInstagram: 'Follow on Instagram',
  seguirMiembro: 'Follow {name} on Instagram',
};

const it: EpkDict = {
  cargando: 'Caricamento Press Kit...',
  bandaPorDefecto: 'Band',
  insigniaCabecera: '{bandName} — EPK / Press Kit',
  logoAlt: 'Logo {bandName}',
  logoOficialAlt: 'Logo ufficiale {bandName}',
  enlaceCopiado: 'Link copiato!',
  compartir: 'Condividi',
  imprimirLargo: 'Scarica PDF / Stampa',
  imprimirCorto: 'PDF',
  selectorIdioma: 'Lingua',

  lemaPorDefectoBakandeya: 'Ska-Rock, Mestizaje & Ritmi Latini dal Vivo',
  lemaPorDefecto: '{bandName} dal Vivo',

  bioPorDefectoBakandeya: 'Bakandeya è una proposta vibrante di mestizaje, ska-rock, reggae e ritmi latini...',
  bioPorDefecto: '{bandName} — Proposta musicale dal vivo.',
  riderPorDefecto: 'PA professionale e microfonia da concerto dal vivo...',

  seccionDatos: 'Informazioni per la Prenotazione',
  etiquetaMusicos: 'Musicisti sul palco',
  etiquetaDuracion: 'Durata del live',
  unidadMinutos: 'min',
  etiquetaCiudadBase: 'Città base',
  etiquetaFormatos: 'Formati disponibili',
  etiquetaNecesidades: 'Esigenze di palco',

  seccionVideo: 'Video dal Vivo',
  tituloVideoPorDefecto: '{bandName} dal vivo',

  seccionBanda: 'La Band',

  seccionBio: 'Biografia e Proposta Musicale',
  contactoTitulo: 'Contatto Booking',
  contactoSubtitulo: 'Linea diretta per programmatori di locali, festival e organizzatori:',
  managerPorDefecto: 'Manager {bandName}',
  asuntoContratacion: 'Booking {bandName} {year}',
  ctaCache: 'Richiedi Disponibilità & Ingaggio',

  seccionTemas: 'Brani in Evidenza / Repertorio Principale',
  sonando: 'In riproduzione',
  escuchar: 'Ascolta',

  seccionGaleria: 'Galleria Stampa & Promo',
  fotoAlt: 'Foto ufficiale {n}',
  fotoPromocional: 'Foto Promozionale #{n}',
  fotoAnterior: 'Foto precedente',
  fotoSiguiente: 'Foto successiva',

  seccionEscucha: 'Ascoltaci e Guardaci dal Vivo',
  tituloSpotify: '{bandName} su Spotify',


  seccionFechas: 'Prossime Date del Tour',
  descargarDossier: 'Scarica Press Kit in PDF',
  pieDerechos: '© {year} {bandName} — Tutti i diritti riservati. Press kit generato da BandManager.io',

  seccionCifras: 'Dati Chiave & Impatto',
  cifraOyentes: 'Ascolti & Stream',
  cifraDirectos: 'Live & Festival',
  cifraComunidad: 'Community & Fan',
  cifraCiudades: 'Città del Tour',
  playerPista: 'In Riproduzione',
  playerCerrar: 'Chiudi riproduttore',
  descargarKitPrensa: 'Kit Stampa HD (Foto & Logo)',

  seccionPrensa: 'Rassegna Stampa & Recensioni',
  prensaSubtitulo: 'Cosa dicono i media specializzati e la critica sui nostri concerti:',
  seguirInstagram: 'Segui su Instagram',
  seguirMiembro: 'Segui {name} su Instagram',
};

const cs: EpkDict = {
  cargando: 'Načítání press kitu...',
  bandaPorDefecto: 'Kapela',
  insigniaCabecera: '{bandName} — EPK / Press Kit',
  logoAlt: 'Logo {bandName}',
  logoOficialAlt: 'Oficiální logo {bandName}',
  enlaceCopiado: 'Odkaz zkopírován!',
  compartir: 'Sdílet',
  imprimirLargo: 'Stáhnout PDF / Tisk',
  imprimirCorto: 'PDF',
  selectorIdioma: 'Jazyk',

  lemaPorDefectoBakandeya: 'Ska-rock, mestizaje a latinskoamerické rytmy naživo',
  lemaPorDefecto: '{bandName} naživo',

  bioPorDefectoBakandeya: 'Bakandeya je pulzující směsice mestizaje, ska-rocku, reggae a latinskoamerických rytmů...',
  bioPorDefecto: '{bandName} — Hudební projekt naživo.',
  riderPorDefecto: 'Profesionální ozvučení a mikrofonáž pro živé vystoupení...',

  seccionDatos: 'Informace pro pořadatele',
  etiquetaMusicos: 'Hudebníci na pódiu',
  etiquetaDuracion: 'Délka vystoupení',
  unidadMinutos: 'min',
  etiquetaCiudadBase: 'Domovské město',
  etiquetaFormatos: 'Dostupné formáty',
  etiquetaNecesidades: 'Technické požadavky na pódium',

  seccionVideo: 'Video naživo',
  tituloVideoPorDefecto: '{bandName} naživo',

  seccionBanda: 'Kapela',

  seccionBio: 'Biografie a hudební projekt',
  contactoTitulo: 'Kontakt na booking',
  contactoSubtitulo: 'Přímá linka pro pořadatele klubů, festivalů a produkce:',
  managerPorDefecto: 'Manažer {bandName}',
  asuntoContratacion: 'Booking {bandName} {year}',
  ctaCache: 'Poptat dostupnost a vystoupení',

  seccionTemas: 'Vybrané skladby / hlavní repertoár',
  sonando: 'Právě hraje',
  escuchar: 'Poslechnout',

  seccionGaleria: 'Fotogalerie pro tisk a promo',
  fotoAlt: 'Oficiální fotografie {n}',
  fotoPromocional: 'Promo fotografie č. {n}',
  fotoAnterior: 'Předchozí fotografie',
  fotoSiguiente: 'Další fotografie',

  seccionEscucha: 'Poslechněte si a sledujte nás naživo',
  tituloSpotify: '{bandName} na Spotify',


  seccionFechas: 'Nadcházející termíny turné',
  descargarDossier: 'Stáhnout press kit v PDF',
  pieDerechos: '© {year} {bandName} — Všechna práva vyhrazena. Press kit vygenerován pomocí BandManager.io',

  seccionCifras: 'Klíčové statistiky a dosah',
  cifraOyentes: 'Streamy a posluchači',
  cifraDirectos: 'Koncerty a festivaly',
  cifraComunidad: 'Komunita a fanoušci',
  cifraCiudades: 'Města na turné',
  playerPista: 'Právě hraje',
  playerCerrar: 'Zavřít přehrávač',
  descargarKitPrensa: 'HD Press Kit (Fotky a loga)',

  seccionPrensa: 'Ohlasy v tisku a recenze',
  prensaSubtitulo: 'Co o našich koncertech píší specializovaná hudební média:',
  seguirInstagram: 'Sledovat na Instagramu',
  seguirMiembro: 'Sledovat {name} na Instagramu',
};

export const EPK_TRANSLATIONS: Record<EpkLanguage, EpkDict> = { es, en, it, cs };

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
