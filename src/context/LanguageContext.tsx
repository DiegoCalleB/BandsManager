import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SupportedLanguage = 'es' | 'en' | 'ca' | 'gl' | 'eu';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ca', label: 'Català', flag: '🇦🇩' },
  { code: 'gl', label: 'Galego', flag: '🇪🇸' },
  { code: 'eu', label: 'Euskara', flag: '🇪🇸' },
];

// Dictionary of translations
export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    // Navigation
    'nav.resumen': 'Dashboard',
    'nav.booking': 'Escenarios',
    'nav.medios': 'Medios',
    'nav.management': 'Management',
    'nav.bandas': 'Grupos',
    'nav.calendario': 'Calendario',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'Dossier (EPK)',
    'nav.fans': 'Captura QR y fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertorios',
    'nav.ensayos': 'Ensayos',
    'nav.discografia': 'Discografía',
    'nav.chat': 'Agente Mánager',
    'nav.finanzas': 'Finanzas',
    'nav.merchan': 'Merchandising',

    // Headers & Labels
    'app.active_band': 'Banda activa',
    'app.switch_band': 'Cambiar de banda',
    'app.tools': 'Herramientas',
    'app.metronome': 'Metrónomo',
    'app.tuner': 'Afinador',
    'app.upgrade_plan': 'Mejorar Plan',
    'app.settings': 'Configuración',
    'app.profile': 'Perfil de Usuario',
    'app.logout': 'Cerrar Sesión',
    'app.language': 'Idioma',
    'app.theme': 'Tema Visual',

    // Actions
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.add': 'Añadir',
    'action.search': 'Buscar...',
    'action.filter': 'Filtrar',
    'action.close': 'Cerrar',
    'action.approve': 'Aprobar',
    'action.reject': 'Rechazar',
    'action.confirm': 'Confirmar',
    'action.loading': 'Cargando...',
    'action.export': 'Exportar',
    'action.import': 'Importar',

    // Statuses
    'status.nuevo': 'Nuevo',
    'status.pendiente_aprobacion': 'Pendiente Aprobación',
    'status.aprobado': 'Aprobado',
    'status.esperando_respuesta': 'Esperando Respuesta',
    'status.interesado': 'Interesado',
    'status.no_interesado': 'No Interesado',
    'status.negociando': 'Negociando',

    // General UI
    'general.no_data': 'Sin datos disponibles',
    'general.search_placeholder': 'Buscar sala, ciudad, contacto...',
    'general.welcome': '¡Bienvenido a BandManager.io!',

    // ── Landing page pública ──
    'landing.meta.title': 'BandManager · Gestiona tus giras, contratos y bolos sin impagos',
    'landing.meta.description': 'Plataforma integral para bandas y artistas independientes: EPK digital, firma de contratos con custodia de señal (escrow), gestión de giras, setlists y captación de fans con QR. Gratis para empezar.',
    'landing.badge': '🛡️ Gestión de Giras y Contratos · Depósito de Señal Seguro',
    'landing.hero.h1': 'Organiza tus giras, firma contratos digitales y asegura el cobro de tus conciertos.',
    'landing.hero.h2': 'Crea tu EPK interactivo, gestiona tu rider técnico y recibe el anticipo de tus bolos en custodia segura antes de subir a la furgoneta.',
    'landing.hero.cta.primary': 'CREAR CUENTA GRATIS →',
    'landing.hero.cta.secondary': 'Ver cómo funciona',
    'landing.hero.cta.note': 'Sin tarjeta · Configuración en 120 segundos',
    'landing.summary.label': 'Resumen ejecutivo',
    'landing.summary.text': 'BandManager.io es la plataforma integral para música en directo que unifica la creación de dossieres digitales (EPK), la firma de contratos con depósito en custodia neutra y la automatización de la hoja de ruta. Reduce el tiempo de gestión en un 70% y elimina los impagos en salas independientes.',
    'landing.contrast.title': 'Del caos al control',
    'landing.contrast.before.title': 'Sin BandManager',
    'landing.contrast.before.items': 'Excels desactualizados · Acuerdos de palabra en WhatsApp · Salas que cancelan a 24h del show · Pérdida de dinero en gasolina y dietas sin registro',
    'landing.contrast.after.title': 'Con BandManager',
    'landing.contrast.after.items': 'Contratos digitales con firma en móvil · Cobro del 50% de señal garantizado · Rider siempre actualizado · Cuentas claras para toda la banda',
    'landing.steps.title': 'Cómo funciona',
    'landing.steps.1.title': 'Configura tu EPK y rider en 3 minutos',
    'landing.steps.1.text': 'Bio, foto, rider técnico y próximas fechas en una página pública que cualquier programador puede ver desde el móvil.',
    'landing.steps.2.title': 'Envía tu propuesta y firma el contrato',
    'landing.steps.2.text': 'La sala recibe un enlace, firma en el móvil y deposita la señal vía Stripe. Sin que tenga cuenta previa en BandManager.',
    'landing.steps.3.title': 'Viaja con la señal ya garantizada',
    'landing.steps.3.text': 'El dinero queda en custodia neutra hasta el día del show. Tú te subes a la furgo tranquilo.',
    'landing.social.title': 'Lo que dicen las bandas',
    'landing.social.stat1.num': '+1.200',
    'landing.social.stat1.label': 'Conciertos gestionados',
    'landing.social.stat2.num': '0%',
    'landing.social.stat2.label': 'Impagos con sistema de custodia',
    'landing.social.stat3.num': '4,9/5',
    'landing.social.stat3.label': 'Valoración de la comunidad',
    'landing.social.t1.quote': 'Antes mandábamos el rider por email y nadie lo encontraba el día del show. Ahora la sala tiene el enlace y punto.',
    'landing.social.t1.name': 'Laura G.',
    'landing.social.t1.band': 'Guitarrista, La Marea Roja',
    'landing.social.t2.quote': 'La primera vez que un promotor firmó el contrato desde el móvil y la señal llegó al instante, no me lo podía creer.',
    'landing.social.t2.name': 'Iván M.',
    'landing.social.t2.band': 'Mánager, Tres Cuartos',
    'landing.social.t3.quote': 'Gestiono tres proyectos distintos desde la misma cuenta. El calendario conjunto es lo que más me ahorra.',
    'landing.social.t3.name': 'Carla S.',
    'landing.social.t3.band': 'Solista y productora',
    'landing.features.title': 'Todo lo que necesita tu banda',
    'landing.features.escrow.title': 'Señal en custodia (Escrow)',
    'landing.features.escrow.text': 'La sala deposita la señal antes del show. Si cancela, tú cobras. Si el show es un éxito, se libera automáticamente.',
    'landing.features.cancel.title': 'Políticas de cancelación claras',
    'landing.features.cancel.text': 'Flexible, moderada o estricta. El contrato lo deja por escrito antes de que nadie firme nada.',
    'landing.features.taquilla.title': 'Reparto de taquilla transparente',
    'landing.features.taquilla.text': 'Door-split engine: el porcentaje de cada uno queda fijado en el contrato y el reparto se calcula automáticamente.',
    'landing.features.qr.title': 'Fans y QR en el merchan',
    'landing.features.qr.text': 'Pegas el QR en la mesa, el fan escanea y te sigue o deja su mail. Con consentimiento RGPD incluido.',
    'landing.faqs.title': 'Preguntas frecuentes',
    'landing.faq1.q': '¿Tengo que pagar para empezar?',
    'landing.faq1.a': 'No. Hay un plan gratuito para empezar a gestionar tu banda desde el primer día. Los planes de pago añaden más créditos y funciones avanzadas.',
    'landing.faq2.q': '¿Cómo funciona la custodia de la señal?',
    'landing.faq2.a': 'Al firmar el contrato, la sala deposita la señal pactada vía Stripe. El dinero queda retenido en custodia neutra hasta el día del concierto. Si todo va bien, se libera; si la sala cancela sin previo aviso, el importe te lo queda tú.',
    'landing.faq3.q': '¿Necesita la sala tener una cuenta en BandManager?',
    'landing.faq3.a': 'No. La sala recibe un enlace público, firma el contrato desde el móvil y deposita la señal sin necesidad de registrarse en la plataforma.',
    'landing.faq4.q': '¿Funciona para solistas, cómicos o mánagers con varias bandas?',
    'landing.faq4.a': 'Sí. Si necesitas encontrar salas y gestionar actuaciones, BandManager te sirve. Puedes tener varios proyectos en la misma cuenta.',
    'landing.cta.title': 'No vuelvas a viajar a un concierto sin tener tu caché garantizado.',
    'landing.cta.email.placeholder': 'tu@email.com',
    'landing.cta.button': 'EMPEZAR GRATIS AHORA',
    'landing.cta.note': 'Garantía de custodia Stripe · Sin permanencia · Configuración en 120 segundos',
    'landing.nav.features': 'Funciones',
    'landing.nav.howto': 'Cómo funciona',
    'landing.nav.faq': 'Preguntas',
    'landing.nav.enter': 'Entrar',
    'landing.footer.copy': '© {year} BandManager · De músico a músico.',
    'landing.author.label': 'De músico a músico',
    'landing.author.h2': 'Construido desde el local de ensayo.',
    'landing.author.p1': 'Hola, soy Diego. He tocado el teclado y el bajo en varios grupos y en una big band de jazz.',
    'landing.author.p2': 'Sé de primera mano lo difícil que es conseguir conciertos, poner de acuerdo a la gente y lidiar con toda la logística que hay detrás de cada bolo.',
    'landing.author.p3': 'Creé BandManager para quitarle todo ese barro a los grupos y que puedan centrarse en lo único que de verdad importa: tocar.',
    'landing.author.p4': 'Si a nosotros nos habría ahorrado cientos de horas de caos, a tu grupo le va a cambiar la vida.',
  },
  en: {
    // Navigation
    'nav.resumen': 'Overview',
    'nav.booking': 'Venues',
    'nav.medios': 'Media',
    'nav.management': 'Management',
    'nav.bandas': 'Bands',
    'nav.calendario': 'Calendar',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'EPK Dossier',
    'nav.fans': 'QR Capture & Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Setlists',
    'nav.ensayos': 'Rehearsals',
    'nav.discografia': 'Discography',
    'nav.chat': 'AI Manager Agent',
    'nav.finanzas': 'Finances',
    'nav.merchan': 'Merchandise',

    // Headers & Labels
    'app.active_band': 'Active Band',
    'app.switch_band': 'Switch Band',
    'app.tools': 'Tools',
    'app.metronome': 'Metronome',
    'app.tuner': 'Tuner',
    'app.upgrade_plan': 'Upgrade Plan',
    'app.settings': 'Settings',
    'app.profile': 'User Profile',
    'app.logout': 'Log Out',
    'app.language': 'Language',
    'app.theme': 'Visual Theme',

    // Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.add': 'Add',
    'action.search': 'Search...',
    'action.filter': 'Filter',
    'action.close': 'Close',
    'action.approve': 'Approve',
    'action.reject': 'Reject',
    'action.confirm': 'Confirm',
    'action.loading': 'Loading...',
    'action.export': 'Export',
    'action.import': 'Import',

    // Statuses
    'status.nuevo': 'New',
    'status.pendiente_aprobacion': 'Pending Approval',
    'status.aprobado': 'Approved',
    'status.esperando_respuesta': 'Awaiting Reply',
    'status.interesado': 'Interested',
    'status.no_interesado': 'Not Interested',
    'status.negociando': 'Negotiating',

    // General UI
    'general.no_data': 'No data available',
    'general.search_placeholder': 'Search venue, city, contact...',
    'general.welcome': 'Welcome to BandManager.io!',

    // ── Landing page pública ──
    'landing.meta.title': 'BandManager · Manage your tours, contracts and gigs — zero unpaid shows',
    'landing.meta.description': 'All-in-one platform for independent bands and artists: interactive EPK, contract signing with deposit escrow, tour management, setlists and fan capture with QR. Free to start.',
    'landing.badge': '🛡️ Tour & Contract Management · Secure Deposit Escrow',
    'landing.hero.h1': 'Organise your tours, sign digital contracts and secure your concert fees.',
    'landing.hero.h2': 'Build your interactive EPK, manage your technical rider and get your show deposit held in secure escrow before you hit the road.',
    'landing.hero.cta.primary': 'CREATE FREE ACCOUNT →',
    'landing.hero.cta.secondary': 'See how it works',
    'landing.hero.cta.note': 'No card required · Set up in 120 seconds',
    'landing.summary.label': 'Executive summary',
    'landing.summary.text': 'BandManager.io is the all-in-one platform for live music that combines interactive EPK creation, contract signing with neutral deposit escrow, and automated tour routing. Cuts admin time by 70% and eliminates unpaid shows at independent venues.',
    'landing.contrast.title': 'From chaos to control',
    'landing.contrast.before.title': 'Without BandManager',
    'landing.contrast.before.items': 'Outdated spreadsheets · Verbal agreements over WhatsApp · Venues cancelling 24h before the show · Money lost in fuel and expenses with no record',
    'landing.contrast.after.title': 'With BandManager',
    'landing.contrast.after.items': 'Digital contracts signed on mobile · 50% deposit guaranteed in escrow · Rider always up to date · Clear accounts for every band member',
    'landing.steps.title': 'How it works',
    'landing.steps.1.title': 'Set up your EPK and rider in 3 minutes',
    'landing.steps.1.text': 'Bio, photo, technical rider and upcoming dates — all on one public page any booker can view from their phone.',
    'landing.steps.2.title': 'Send your proposal and sign the contract',
    'landing.steps.2.text': 'The venue gets a link, signs on mobile and deposits the fee via Stripe. No BandManager account needed on their end.',
    'landing.steps.3.title': 'Hit the road with your deposit already secured',
    'landing.steps.3.text': 'The money sits in neutral escrow until show day. Get in the van with peace of mind.',
    'landing.social.title': 'What bands are saying',
    'landing.social.stat1.num': '+1,200',
    'landing.social.stat1.label': 'Gigs managed',
    'landing.social.stat2.num': '0%',
    'landing.social.stat2.label': 'Unpaid shows with escrow',
    'landing.social.stat3.num': '4.9/5',
    'landing.social.stat3.label': 'Community rating',
    'landing.social.t1.quote': 'We used to send the rider by email and nobody could find it on show day. Now the venue has the link and that\'s it.',
    'landing.social.t1.name': 'Laura G.',
    'landing.social.t1.band': 'Guitarist, La Marea Roja',
    'landing.social.t2.quote': 'The first time a promoter signed the contract from their phone and the deposit hit instantly — I couldn\'t believe it.',
    'landing.social.t2.name': 'Iván M.',
    'landing.social.t2.band': 'Manager, Tres Cuartos',
    'landing.social.t3.quote': 'I manage three different projects from the same account. The shared calendar is the biggest time-saver.',
    'landing.social.t3.name': 'Carla S.',
    'landing.social.t3.band': 'Solo artist and producer',
    'landing.features.title': 'Everything your band needs',
    'landing.features.escrow.title': 'Deposit escrow',
    'landing.features.escrow.text': 'The venue deposits the agreed fee before the show. If they cancel, you keep it. If the show goes ahead, it\'s released automatically.',
    'landing.features.cancel.title': 'Clear cancellation policies',
    'landing.features.cancel.text': 'Flexible, moderate or strict. The contract spells it out before anyone signs anything.',
    'landing.features.taquilla.title': 'Transparent door-split',
    'landing.features.taquilla.text': 'Door-split engine: each party\'s percentage is fixed in the contract and the split is calculated automatically.',
    'landing.features.qr.title': 'Fans and QR at the merch table',
    'landing.features.qr.text': 'Stick the QR on the merch table, the fan scans it and follows you or leaves their email. GDPR consent included.',
    'landing.faqs.title': 'Frequently asked questions',
    'landing.faq1.q': 'Do I have to pay to get started?',
    'landing.faq1.a': 'No. There is a free plan to start managing your band from day one. Paid plans add more credits and advanced features.',
    'landing.faq2.q': 'How does deposit escrow work?',
    'landing.faq2.a': 'When the contract is signed, the venue deposits the agreed fee via Stripe. The money is held in neutral escrow until show day. If all goes well, it\'s released; if the venue cancels without notice, you keep it.',
    'landing.faq3.q': 'Does the venue need a BandManager account?',
    'landing.faq3.a': 'No. The venue receives a public link, signs the contract from their phone and deposits the fee without creating an account on the platform.',
    'landing.faq4.q': 'Does it work for solo artists, comedians or managers with several bands?',
    'landing.faq4.a': 'Yes. If you need to find venues and manage performances, BandManager works for you. You can have multiple projects under one account.',
    'landing.cta.title': 'Never drive to a gig again without your fee already secured.',
    'landing.cta.email.placeholder': 'your@email.com',
    'landing.cta.button': 'START FOR FREE NOW',
    'landing.cta.note': 'Stripe escrow guarantee · No commitment · Set up in 120 seconds',
    'landing.nav.features': 'Features',
    'landing.nav.howto': 'How it works',
    'landing.nav.faq': 'FAQ',
    'landing.nav.enter': 'Log in',
    'landing.footer.copy': '© {year} BandManager · Built by musicians, for musicians.',
    'landing.author.label': 'From musician to musician',
    'landing.author.h2': 'Built from the rehearsal room.',
    'landing.author.p1': 'Hi, I\'m Diego. I\'ve played keys and bass in several bands and a jazz big band.',
    'landing.author.p2': 'I know first-hand how hard it is to land gigs, get everyone on the same page and deal with all the logistics behind every show.',
    'landing.author.p3': 'I built BandManager to take that grind away from bands so they can focus on the only thing that really matters: playing.',
    'landing.author.p4': 'If it would have saved us hundreds of hours of chaos, it\'s going to change your band\'s life.',
  },
  ca: {
    // Navigation
    'nav.resumen': 'Resum',
    'nav.booking': 'Escenaris',
    'nav.medios': 'Mitjans',
    'nav.management': 'Management',
    'nav.bandas': 'Grups',
    'nav.calendario': 'Calendari',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'Dossier (EPK)',
    'nav.fans': 'Captura QR i Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertoris',
    'nav.ensayos': 'Assajos',
    'nav.discografia': 'Discografia',
    'nav.chat': 'Agent Mànager',
    'nav.finanzas': 'Finances',
    'nav.merchan': 'Merchandising',

    // Headers & Labels
    'app.active_band': 'Banda activa',
    'app.switch_band': 'Canviar de banda',
    'app.tools': 'Eines',
    'app.metronome': 'Metrònom',
    'app.tuner': 'Afinador',
    'app.upgrade_plan': 'Millorar Pla',
    'app.settings': 'Configuració',
    'app.profile': "Perfil d'Usuari",
    'app.logout': 'Tancar Sessió',
    'app.language': 'Idioma',
    'app.theme': 'Tema Visual',

    // Actions
    'action.save': 'Desar',
    'action.cancel': 'Cancel·lar',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.add': 'Afegir',
    'action.search': 'Cercar...',
    'action.filter': 'Filtrar',
    'action.close': 'Tancar',
    'action.approve': 'Aprovar',
    'action.reject': 'Rebutjar',
    'action.confirm': 'Confirmar',
    'action.loading': 'Carregant...',
    'action.export': 'Exportar',
    'action.import': 'Importar',

    // Statuses
    'status.nuevo': 'Nou',
    'status.pendiente_aprobacion': "Pendent d'Aprovació",
    'status.aprobado': 'Aprovat',
    'status.esperando_respuesta': 'Esperant Resposta',
    'status.interesado': 'Interessat',
    'status.no_interesado': 'No Interessat',
    'status.negociando': 'Negociant',

    // General UI
    'general.no_data': 'Sense dades disponibles',
    'general.search_placeholder': 'Cercar sala, ciutat, contacte...',
    'general.welcome': 'Benvingut a BandManager.io!',
  },
  gl: {
    // Navigation
    'nav.resumen': 'Resumo',
    'nav.booking': 'Escenarios',
    'nav.medios': 'Medios',
    'nav.management': 'Management',
    'nav.bandas': 'Grupos',
    'nav.calendario': 'Calendario',
    'nav.giras': 'Tour Manager',
    'nav.epk': 'Dossier (EPK)',
    'nav.fans': 'Captura QR e Fans',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Repertorios',
    'nav.ensayos': 'Ensaios',
    'nav.discografia': 'Discografía',
    'nav.chat': 'Axente Mánager',
    'nav.finanzas': 'Finanzas',
    'nav.merchan': 'Merchandising',

    // Headers & Labels
    'app.active_band': 'Banda activa',
    'app.switch_band': 'Mudar de banda',
    'app.tools': 'Ferramentas',
    'app.metronome': 'Metrónomo',
    'app.tuner': 'Afinador',
    'app.upgrade_plan': 'Mellorar Plan',
    'app.settings': 'Configuración',
    'app.profile': 'Perfil de Usuario',
    'app.logout': 'Cerrar Sesión',
    'app.language': 'Idioma',
    'app.theme': 'Tema Visual',

    // Actions
    'action.save': 'Gardar',
    'action.cancel': 'Cancelar',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.add': 'Engadir',
    'action.search': 'Buscar...',
    'action.filter': 'Filtrar',
    'action.close': 'Pechar',
    'action.approve': 'Aprobar',
    'action.reject': 'Rexeitar',
    'action.confirm': 'Confirmar',
    'action.loading': 'Cargando...',
    'action.export': 'Exportar',
    'action.import': 'Importar',

    // Statuses
    'status.nuevo': 'Novo',
    'status.pendiente_aprobacion': 'Pendente Aprobación',
    'status.aprobado': 'Aprobado',
    'status.esperando_respuesta': 'Agardando Resposta',
    'status.interesado': 'Interesado',
    'status.no_interesado': 'Non Interesado',
    'status.negociando': 'Negociando',

    // General UI
    'general.no_data': 'Sen datos dispoñibles',
    'general.search_placeholder': 'Buscar sala, cidade, contacto...',
    'general.welcome': 'Benvido a BandManager.io!',
  },
  eu: {
    // Navigation
    'nav.resumen': 'Laburpena',
    'nav.booking': 'Eszenatokiak',
    'nav.medios': 'Hedabideak',
    'nav.management': 'Management',
    'nav.bandas': 'Taldeak',
    'nav.calendario': 'Egutegia',
    'nav.giras': 'Bira Kudeatzailea',
    'nav.epk': 'Dosierra (EPK)',
    'nav.fans': 'QR Harrapaketa eta Zaleak',
    'nav.reels': 'Reels Center',
    'nav.repertorio': 'Errepertorioak',
    'nav.ensayos': 'Entseguak',
    'nav.discografia': 'Diskografia',
    'nav.chat': 'AI Kudeatzaile Eragilea',
    'nav.finanzas': 'Finantzak',
    'nav.merchan': 'Merchandising-a',

    // Headers & Labels
    'app.active_band': 'Talde aktiboa',
    'app.switch_band': 'Taldea aldatu',
    'app.tools': 'Tresnak',
    'app.metronome': 'Metronomoa',
    'app.tuner': 'Afinagailua',
    'app.upgrade_plan': 'Plana hobetu',
    'app.settings': 'Ezarpenak',
    'app.profile': 'Erabiltzaile Profila',
    'app.logout': 'Saioa itxi',
    'app.language': 'Hizkuntza',
    'app.theme': 'Gai Bisuala',

    // Actions
    'action.save': 'Gorde',
    'action.cancel': 'Ezeztatu',
    'action.edit': 'Editatu',
    'action.delete': 'Ezabatu',
    'action.add': 'Gehitu',
    'action.search': 'Bilatu...',
    'action.filter': 'Iragazi',
    'action.close': 'Itxi',
    'action.approve': 'Onartu',
    'action.reject': 'Ezeztatu',
    'action.confirm': 'Berretsi',
    'action.loading': 'Kargatzen...',
    'action.export': 'Exportatu',
    'action.import': 'Importatu',

    // Statuses
    'status.nuevo': 'Berria',
    'status.pendiente_aprobacion': 'Onarpenaren zain',
    'status.aprobado': 'Onartua',
    'status.esperando_respuesta': 'Erantzunaren zain',
    'status.interesado': 'Interesatua',
    'status.no_interesado': 'Ez interesatua',
    'status.negociando': 'Negoziatzen',

    // General UI
    'general.no_data': 'Ez dago daturik eskuragarri',
    'general.search_placeholder': 'Bilatu aretoa, hiria, kontaktua...',
    'general.welcome': 'Ongi etorri BandManager.io-ra!',
  },
};

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
  isTranslating: boolean;
  refreshTranslation: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('bandmanager_language') as SupportedLanguage;
    if (saved && TRANSLATIONS[saved]) {
      return saved;
    }
    // Try browser language default
    const navLang = navigator.language.slice(0, 2).toLowerCase();
    if (navLang === 'ca' || navLang === 'gl' || navLang === 'eu' || navLang === 'en' || navLang === 'es') {
      return navLang as SupportedLanguage;
    }
    return 'es';
  });

  const [isTranslating, setIsTranslating] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bandmanager_language');
      return saved !== null && saved !== 'es';
    }
    return false;
  });

  // Helper to finish background translation seamlessly without flickering
  const finishTranslation = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('translating-in-background');
      document.body?.classList?.remove('translating-in-background');
    }
    setIsTranslating(false);
  };

  // Helper to trigger Google Translate Widget in the background
  const triggerGoogleTranslate = (targetLang: SupportedLanguage) => {
    if (typeof window === 'undefined') return;

    if (targetLang === 'es') {
      // Clear translation cookies & reset
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      if (window.location.hostname && window.location.hostname !== 'localhost') {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      }
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo && combo.value !== 'es') {
        combo.value = 'es';
        combo.dispatchEvent(new Event('change'));
      }
      finishTranslation();
      return;
    }

    // Entering background translation mode
    setIsTranslating(true);
    document.documentElement.classList.add('translating-in-background');

    // Set google translate cookie
    const cookieVal = `/es/${targetLang}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (window.location.hostname && window.location.hostname !== 'localhost') {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname}`;
    }

    let observer: MutationObserver | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;

    const cleanupAndReveal = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      // Small buffer to ensure browser paint is finished with translated DOM
      setTimeout(() => {
        finishTranslation();
      }, 60);
    };

    // Watch DOM for translation completion (Google Translate wraps translated nodes in <font> or marks html/body)
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (
            document.documentElement.classList.contains('translated-ltr') ||
            document.documentElement.classList.contains('translated-rtl') ||
            document.querySelector('font[style]') !== null ||
            (m.target as HTMLElement)?.nodeName === 'FONT'
          ) {
            cleanupAndReveal();
            break;
          }
        }
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    // Safety maximum timeout so UI never gets stuck
    fallbackTimer = setTimeout(() => {
      cleanupAndReveal();
    }, 450);

    const selectCombo = () => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo) {
        if (combo.value !== targetLang) {
          combo.value = targetLang;
          combo.dispatchEvent(new Event('change'));
        }
        return true;
      }
      return false;
    };

    if (!selectCombo()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (selectCombo() || attempts > 12) {
          clearInterval(interval);
        }
      }, 150);
    }
  };

  // Mount Google Translate Widget script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Callback for Google Translate
    (window as any).googleTranslateElementInit = () => {
      if ((window as any).google?.translate?.TranslateElement) {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'es',
            includedLanguages: 'es,en,ca,gl,eu,fr,de,it,pt',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    // Ensure target div element exists
    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      div.style.display = 'none';
      document.body.appendChild(div);
    }

    // Append script if not loaded
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // Apply saved language if not default
    if (language !== 'es') {
      triggerGoogleTranslate(language);
    } else {
      finishTranslation();
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('bandmanager_language', lang);
    triggerGoogleTranslate(lang);
  };

  const refreshTranslation = () => {
    if (language !== 'es') {
      triggerGoogleTranslate(language);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const dict = TRANSLATIONS[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to Spanish dictionary
    if (TRANSLATIONS['es'][key]) {
      return TRANSLATIONS['es'][key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isTranslating, refreshTranslation }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
