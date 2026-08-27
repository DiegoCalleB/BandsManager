import { FanFormLanguage, DEFAULT_FAN_FORM_LANGUAGE } from './fansTranslations';

export interface MusiciansLandingDict {
  badge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  badgeFromBand: string;
  backToOrigin: string;

  // Features
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;

  // Form
  formTitle: string;
  formSubtitle: string;
  labelBandName: string;
  placeholderBandName: string;
  labelContactName: string;
  placeholderContactName: string;
  labelEmail: string;
  placeholderEmail: string;
  labelInstagram: string;
  placeholderInstagram: string;
  labelPhone: string;
  placeholderPhone: string;
  labelCity: string;
  placeholderCity: string;
  labelGenre: string;
  placeholderGenre: string;
  labelMusicLink: string;
  placeholderMusicLink: string;
  labelMainInterest: string;
  optionSelectInterest: string;
  optionInterestFans: string;
  optionInterestBooking: string;
  optionInterestEpk: string;
  optionInterestRepertoire: string;
  optionInterestAll: string;
  labelNotes: string;
  placeholderNotes: string;
  moreInfoToggleOpen: string;
  moreInfoToggleClose: string;
  moreInfoSubtitle: string;
  consentCheckbox: string;
  submitButton: string;
  submittingButton: string;

  // Success
  successTitle: string;
  successSubtitle: string;
  successMessage: string;
  successBackToBand: string;
  successExploreApp: string;

  // Errors
  errorRequired: string;
  errorGeneric: string;

  // Footer
  footerText: string;
}

const es: MusiciansLandingDict = {
  badge: 'Próximamente • Lista de Espera Exclusiva',
  heroTitle: 'Tú piensa en tu música.',
  heroHighlight: 'BandManager.io se encarga de todo lo demás!',
  heroSubtitle: 'Estamos terminando de construir la plataforma integral definitiva para músicos y bandas independientes: captación de fans en directo mediante QR, automatización de booking de salas con IA, dossier de prensa EPK interactivo y control de giras. Deja tu email e Instagram para recibir toda la información y acceso prioritario en cuanto esté disponible.',
  badgeFromBand: 'Has llegado desde el concierto de {bandName}',
  backToOrigin: 'Volver a la página de {bandName}',

  feature1Title: 'Captura de Fans en Conciertos con QR',
  feature1Desc: 'Página ultra-rápida para que tu público escanee el QR desde el escenario, se una a tu comunidad, escuche tus temas inéditos y reciba tus novedades.',
  feature2Title: 'Automatización de Booking y Salas con IA',
  feature2Desc: 'Pipeline CRM de salas con filtros por aforo, caché, seguimiento de propuestas, agentes de prospección y redactores de pitch personalizados.',
  feature3Title: 'Dossier de Prensa Interactivo (EPK)',
  feature3Desc: 'Presenta tu proyecto a programadores de salas y festivales con reproductor de temas, rider técnico descargable, fotos en alta resolución y bio multilingüe.',
  feature4Title: 'Repertorio, Logística de Giras y Finanzas',
  feature4Desc: 'Organiza tus setlists con acordes y tonalidades, calcula rutas y dietas de furgoneta, y lleva el control exhaustivo de ingresos, gastos y merchan.',

  formTitle: 'Apúntate a la Lista de Espera',
  formSubtitle: 'BandManager.io estará disponible muy pronto. Déjanos tu email e Instagram para que te enviemos toda la información y seas de los primeros en probarlo.',
  labelBandName: 'Nombre de la Banda o Proyecto *',
  placeholderBandName: 'Ej: Los Astronautas, Bakandeya...',
  labelContactName: 'Tu Nombre y Apellidos *',
  placeholderContactName: 'Ej: Laura Gómez',
  labelEmail: 'Correo Electrónico *',
  placeholderEmail: 'tuemail@ejemplo.com',
  labelInstagram: 'Instagram de la Banda / Artista *',
  placeholderInstagram: '@tu_banda o instagram.com/tu_banda',
  labelPhone: 'Teléfono / WhatsApp (Opcional)',
  placeholderPhone: '+34 600 000 000',
  labelCity: 'Ciudad / Región (Opcional)',
  placeholderCity: 'Ej: Madrid, Barcelona, Valencia, Bilbao...',
  labelGenre: 'Estilo / Género Musical (Opcional)',
  placeholderGenre: 'Ej: Rock, Indie, Pop, Metal, Electrónica, Urbano...',
  labelMusicLink: 'Enlace a Spotify, YouTube o Web (Opcional)',
  placeholderMusicLink: 'https://open.spotify.com/artist/... o tu web',
  labelMainInterest: '¿Qué es lo que más necesita tu banda ahora mismo? *',
  optionSelectInterest: 'Selecciona una opción...',
  optionInterestFans: 'Captar fans en directo y tener página con QR',
  optionInterestBooking: 'Llenar conciertos y automatizar booking en salas',
  optionInterestEpk: 'Tener un EPK / Dossier profesional interactivo',
  optionInterestRepertoire: 'Gestionar repertorio, setlists y logística de gira',
  optionInterestAll: 'Todo el ecosistema completo de BandManager.io',
  labelNotes: '¿Algo más que nos quieras contar? (Opcional)',
  placeholderNotes: 'Cuéntanos sobre tus próximos planes, giras o necesidades específicas...',
  moreInfoToggleOpen: '+ Añadir más información sobre mi banda (opcional)',
  moreInfoToggleClose: '- Ocultar información adicional',
  moreInfoSubtitle: 'Indícanos más detalles si quieres ayudarnos a adaptar el lanzamiento a tu banda:',
  consentCheckbox: 'Quiero recibir acceso prioritario, novedades y toda la información de lanzamiento de BandManager.io en mi correo e Instagram.',
  submitButton: 'Avisadme cuando esté disponible',
  submittingButton: 'Guardando tus datos...',

  successTitle: '¡Estás en la lista!',
  successSubtitle: 'Hemos registrado a {bandName} para el lanzamiento de BandManager.io.',
  successMessage: 'En cuanto la plataforma esté lista, te enviaremos por email e Instagram toda la información detallada y tu pase de acceso preferente.',
  successBackToBand: 'Volver a {bandName}',
  successExploreApp: 'Conocer más sobre BandManager.io',

  errorRequired: 'Por favor, completa los campos obligatorios (*) y acepta la casilla de consentimiento.',
  errorGeneric: 'Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.',

  footerText: 'BandManager.io • Tú piensa en tu música, nosotros en todo lo demás.'
};

const en: MusiciansLandingDict = {
  badge: 'Coming Soon • Exclusive Early Access Waitlist',
  heroTitle: 'You focus on the music.',
  heroHighlight: 'BandManager.io takes care of everything else.',
  heroSubtitle: 'We are putting the final touches on the ultimate all-in-one operating system for independent musicians and bands: live QR fan capture, AI tour booking, interactive EPK & gig management. Leave your email and Instagram to receive priority access and full info before public launch.',
  badgeFromBand: 'You arrived from {bandName}\'s show page',
  backToOrigin: 'Back to {bandName}',

  feature1Title: 'Live Gig Fan Capture via QR Code',
  feature1Desc: 'Lightning-fast mobile page for fans to scan from stage, join your inner circle, stream unreleased tracks, and get concert news.',
  feature2Title: 'AI-Powered Tour Booking & Venue CRM',
  feature2Desc: 'Venue pipeline with capacity & fee filters, pitch generators, response tracking, and automated promoter discovery agents.',
  feature3Title: 'Interactive Electronic Press Kit (EPK)',
  feature3Desc: 'Showcase your band to festival bookers & press with high-res photo galleries, downloadable technical rider, streaming player & multilingual bios.',
  feature4Title: 'Setlist Repertoire, Tour Logistics & Merch',
  feature4Desc: 'Manage concert setlists with keys & tempo, calculate van routing & per-diems, and track live gig finances & merch stock.',

  formTitle: 'Join the Early Access Waitlist',
  formSubtitle: 'BandManager.io is launching very soon. Leave your email & Instagram so we can send you all the information and invite you first.',
  labelBandName: 'Band or Project Name *',
  placeholderBandName: 'e.g. The Indie Collective, Soundwave...',
  labelContactName: 'Your Full Name *',
  placeholderContactName: 'e.g. Alex Turner',
  labelEmail: 'Contact Email *',
  placeholderEmail: 'contact@yourband.com',
  labelInstagram: 'Band / Artist Instagram *',
  placeholderInstagram: '@yourband or instagram.com/yourband',
  labelPhone: 'Phone / WhatsApp (Optional)',
  placeholderPhone: '+1 555 123 4567',
  labelCity: 'City / Region (Optional)',
  placeholderCity: 'e.g. London, Austin, Berlin...',
  labelGenre: 'Genre / Music Style (Optional)',
  placeholderGenre: 'e.g. Indie Rock, Synthpop, Jazz...',
  labelMusicLink: 'Spotify, YouTube or Website Link (Optional)',
  placeholderMusicLink: 'https://open.spotify.com/artist/... or website',
  labelMainInterest: 'What is your band\'s biggest priority right now? *',
  optionSelectInterest: 'Select an option...',
  optionInterestFans: 'Live fan capture & QR landing page',
  optionInterestBooking: 'Booking more gigs & automating venue outreach',
  optionInterestEpk: 'Professional interactive EPK dossier',
  optionInterestRepertoire: 'Managing setlists, chords & tour van logistics',
  optionInterestAll: 'The complete BandManager.io ecosystem',
  labelNotes: 'Anything else you\'d like to share? (Optional)',
  placeholderNotes: 'Tell us about your upcoming releases, tour plans or specific needs...',
  moreInfoToggleOpen: '+ Add more details about my band (optional)',
  moreInfoToggleClose: '- Hide optional details',
  moreInfoSubtitle: 'Give us extra details to help us tailor our launch to your band:',
  consentCheckbox: 'I agree to receive early access, launch details and updates from BandManager.io via email and Instagram.',
  submitButton: 'Notify Me When Available',
  submittingButton: 'Saving your details...',

  successTitle: 'You\'re on the list!',
  successSubtitle: 'We have registered {bandName} for BandManager.io.',
  successMessage: 'As soon as the platform goes live, we will send all the details to your email and Instagram along with your priority access pass.',
  successBackToBand: 'Back to {bandName}',
  successExploreApp: 'Learn more about BandManager.io',

  errorRequired: 'Please fill in all required fields (*) and accept the consent checkbox.',
  errorGeneric: 'An error occurred while submitting your request. Please try again.',

  footerText: 'BandManager.io • Focus on the music, we take care of everything else.'
};

const it: MusiciansLandingDict = {
  badge: 'Prossimamente • Lista d\'Attesa Esclusiva',
  heroTitle: 'Tu pensa solo alla musica.',
  heroHighlight: 'BandManager.io si occupa di tutto il resto.',
  heroSubtitle: 'Stiamo ultimando la piattaforma definitiva per musicisti e band indipendenti: cattura fan ai concerti con codice QR, booking automatizzato con IA, dossier stampa EPK e gestione tour. Lascia la tua email e Instagram per ricevere tutte le informazioni e accesso prioritario.',
  badgeFromBand: 'Arrivi dalla pagina di {bandName}',
  backToOrigin: 'Torna alla pagina di {bandName}',

  feature1Title: 'Cattura Fan ai Live tramite QR Code',
  feature1Desc: 'Pagina mobile ultra-rapida per far scansionare il QR dal palco, far iscrivere il pubblico alla tua community e regalare brani inediti.',
  feature2Title: 'Booking e Locali Automatizzati con IA',
  feature2Desc: 'Pipeline CRM di locali e festival, calcolo cachet, monitoraggio delle proposte e redattori intelligenti di pitch personalizzati.',
  feature3Title: 'Dossier Stampa Interattivo (EPK)',
  feature3Desc: 'Presenta la tua band a direttori artistici e giornalisti con player musicale, rider tecnico scaricabile e galleria foto HD.',
  feature4Title: 'Repertorio, Scalette, Logistica e Finanze',
  feature4Desc: 'Organizza le tue scalette con tonalità e accordi, calcola le spese del furgone da tour e gestisci il merchandising.',

  formTitle: 'Iscriviti alla Lista d\'Attesa',
  formSubtitle: 'BandManager.io sarà disponibile a breve. Lasciaci email e Instagram per ricevere tutte le informazioni e il pass di accesso anticipato.',
  labelBandName: 'Nome della Band o Progetto *',
  placeholderBandName: 'Es: Velvet Sound, I Notturni...',
  labelContactName: 'Nome e Cognome del Referente *',
  placeholderContactName: 'Es: Marco Rossi',
  labelEmail: 'Email di Contatto *',
  placeholderEmail: 'band@iltuodominio.it',
  labelInstagram: 'Instagram della Band *',
  placeholderInstagram: '@tuo_gruppo o instagram.com/tuo_gruppo',
  labelPhone: 'Telefono / WhatsApp (Facoltativo)',
  placeholderPhone: '+39 333 000 0000',
  labelCity: 'Città / Regione (Facoltativo)',
  placeholderCity: 'Es: Milano, Roma, Bologna...',
  labelGenre: 'Genere Musicale (Facoltativo)',
  placeholderGenre: 'Es: Rock, Indie, Cantautorato, Elettronica...',
  labelMusicLink: 'Link a Spotify, YouTube o Sito (Facoltativo)',
  placeholderMusicLink: 'https://open.spotify.com/artist/... o sito',
  labelMainInterest: 'Qual è la priorità principale per la tua band? *',
  optionSelectInterest: 'Seleziona un\'opzione...',
  optionInterestFans: 'Catturare fan dal vivo e avere una pagina con QR',
  optionInterestBooking: 'Trovare più date e automatizzare il booking',
  optionInterestEpk: 'Avere un EPK professionale e interattivo',
  optionInterestRepertoire: 'Gestire scalette, accordi e logistica tour',
  optionInterestAll: 'L\'intero ecosistema completo di BandManager.io',
  labelNotes: 'Altre note o dettagli? (Facoltativo)',
  placeholderNotes: 'Raccontaci dei tuoi prossimi progetti, concerti o esigenze...',
  moreInfoToggleOpen: '+ Aggiungi altre informazioni sulla band (facoltativo)',
  moreInfoToggleClose: '- Nascondi informazioni facoltative',
  moreInfoSubtitle: 'Fornisci maggiori dettagli per aiutarci a personalizzare il lancio:',
  consentCheckbox: 'Accetto di ricevere novità, accesso anticipato e informazioni da BandManager.io via email e Instagram.',
  submitButton: 'Avvisami quando sarà disponibile',
  submittingButton: 'Salvataggio in corso...',

  successTitle: 'Sei in lista!',
  successSubtitle: 'Abbiamo registrato {bandName} per BandManager.io.',
  successMessage: 'Non appena la piattaforma sarà online, ti invieremo tutti i dettagli su email e Instagram insieme al tuo invito prioritario.',
  successBackToBand: 'Torna a {bandName}',
  successExploreApp: 'Scopri di più su BandManager.io',

  errorRequired: 'Compila tutti i campi obbligatori (*) e accetta la casella di consenso.',
  errorGeneric: 'Si è verificato un errore durante l\'invio. Per favore riprova.',

  footerText: 'BandManager.io • Tu pensa alla musica, noi a tutto il resto.'
};

const cs: MusiciansLandingDict = {
  badge: 'Již brzy • Exkluzivní přednostní přístup',
  heroTitle: 'Ty se věnuj hudbě.',
  heroHighlight: 'BandManager.io se postará o všechno ostatní.',
  heroSubtitle: 'Dokončujeme komplexní platformu pro nezávislé hudebníky a kapely: sběr fanoušků na koncertech přes QR kód, automatizovaný booking klubů s AI, interaktivní EPK presskit a management turné. Zanech nám svůj e-mail a Instagram pro přednostní přístup a veškeré informace.',
  badgeFromBand: 'Přišel/přišla jsi ze stránky koncertu {bandName}',
  backToOrigin: 'Zpět na stránku {bandName}',

  feature1Title: 'Sběr fanoušků na koncertech přes QR kód',
  feature1Desc: 'Bleskurychlá stránka optimalizovaná pro mobily. Fanoušci naskenují QR z pódia, přidají se do tvé komunity a poslechnou si nevydané skladby.',
  feature2Title: 'Automatizovaný booking a kluby s AI',
  feature2Desc: 'CRM pipeline klubů a festivalů s filtry podle kapacity a honoráře, sledování odpovědí a AI generátor personalizovaných nabídek.',
  feature3Title: 'Interaktivní tiskový presskit (EPK)',
  feature3Desc: 'Prezentuj svou kapelu pořadatelům s hudebním přehrávačem, technickým riderem ke stažení a vícejazyčnou biografií.',
  feature4Title: 'Repertoár, setlisty, logistika turné a finance',
  feature4Desc: 'Měj přehled o setlistech s akordy, plánuj trasy dodávky na koncerty a měj pod kontrolou příjmy, výdaje i prodej merche.',

  formTitle: 'Připoj se na čekací listinu',
  formSubtitle: 'BandManager.io bude k dispozici již brzy. Zanech nám svůj e-mail a Instagram, abychom ti zaslali všechny informace a přednostní přístup.',
  labelBandName: 'Název kapely nebo projektu *',
  placeholderBandName: 'Např.: The Indie Collective, Bakandeya...',
  labelContactName: 'Tvé celé jméno a příjmení *',
  placeholderContactName: 'Např.: Jan Novák',
  labelEmail: 'Kontaktní e-mail *',
  placeholderEmail: 'kapela@domena.cz',
  labelInstagram: 'Instagram kapely / interpreta *',
  placeholderInstagram: '@tvojekapela nebo instagram.com/tvojekapela',
  labelPhone: 'Telefon / WhatsApp (volitelné)',
  placeholderPhone: '+420 777 000 000',
  labelCity: 'Město / Region (volitelné)',
  placeholderCity: 'Např.: Praha, Brno, Ostrava...',
  labelGenre: 'Hudební žánr (volitelné)',
  placeholderGenre: 'Např.: Rock, Indie, Pop, Metal, Jazz...',
  labelMusicLink: 'Odkaz na Spotify, YouTube nebo web (volitelné)',
  placeholderMusicLink: 'https://open.spotify.com/artist/... nebo web',
  labelMainInterest: 'Co tvá kapela právě teď nejvíce potřebuje? *',
  optionSelectInterest: 'Vyber možnost...',
  optionInterestFans: 'Získávat fanoušky na koncertech a mít stránku s QR kódem',
  optionInterestBooking: 'Získat více koncertů a automatizovat oslovování klubů',
  optionInterestEpk: 'Mít profesionální a interaktivní EPK presskit',
  optionInterestRepertoire: 'Spravovat setlisty, akordy a logistiku turné',
  optionInterestAll: 'Celý kompletní systém BandManager.io',
  labelNotes: 'Chceš nám ještě něco vzkázat? (volitelné)',
  placeholderNotes: 'Napiš nám o svých nadcházejících plánech, vydáních nebo potřebách...',
  moreInfoToggleOpen: '+ Přidat další informace o kapele (volitelné)',
  moreInfoToggleClose: '- Skrýt doplňující informace',
  moreInfoSubtitle: 'Uveď podrobnosti, které nám pomohou lépe přizpůsobit platformu tvé kapele:',
  consentCheckbox: 'Souhlasím se zasíláním novinek, informací o spuštění a přednostního přístupu k BandManager.io na e-mail a Instagram.',
  submitButton: 'Upozornit mě, až bude hotovo',
  submittingButton: 'Ukládám údaje...',

  successTitle: 'Jsi na seznamu!',
  successSubtitle: 'Údaje o kapele {bandName} byly úspěšně uloženy pro spuštění BandManager.io.',
  successMessage: 'Jakmile bude platforma spuštěna, zašleme ti veškeré informace a přednostní pozvánku na e-mail a Instagram.',
  successBackToBand: 'Zpět na {bandName}',
  successExploreApp: 'Zjistit více o BandManager.io',

  errorRequired: 'Vyplň prosím všechna povinná pole (*) a zaškrtni souhlas.',
  errorGeneric: 'Při odesílání žádosti došlo k chybě. Zkus to prosím znovu.',

  footerText: 'BandManager.io • Ty se věnuj hudbě, my se postaráme o všechno ostatní.'
};

export const MUSICIANS_TRANSLATIONS: Record<FanFormLanguage, MusiciansLandingDict> = { es, en, it, cs };

export function getMusiciansTranslations(lang?: string): MusiciansLandingDict {
  if (lang && (lang === 'es' || lang === 'en' || lang === 'it' || lang === 'cs')) {
    return MUSICIANS_TRANSLATIONS[lang as FanFormLanguage];
  }
  return MUSICIANS_TRANSLATIONS[DEFAULT_FAN_FORM_LANGUAGE];
}
