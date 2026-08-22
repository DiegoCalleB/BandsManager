// Traducciones del formulario público "Únete" (FansLanding.tsx).
// Idiomas soportados hoy: español, inglés, italiano, checo. Añadir uno nuevo es
// solo añadir una entrada más aquí y en FAN_FORM_LANGUAGES.

export type FanFormLanguage = 'es' | 'en' | 'it' | 'cs';

export const DEFAULT_FAN_FORM_LANGUAGE: FanFormLanguage = 'es';

export const FAN_FORM_LANGUAGES: { code: FanFormLanguage; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
];

export function isFanFormLanguage(value: string | null | undefined): value is FanFormLanguage {
  return !!value && FAN_FORM_LANGUAGES.some(l => l.code === value);
}

type FanFormDict = {
  officialChannel: string;
  joinTitle: string; // {bandName}
  thanksConcertWithName: string; // {concertName}
  thanksConcertGeneric: string;
  thanksSupport: string;
  supportIntro: string;
  tabFollow: string;
  tabJoin: string;
  followHelpTitle: string;
  followHelpBody: string;
  followCTA: string;
  errorRequiredFields: string;
  errorGenericSignup: string;
  labelName: string;
  placeholderName: string;
  labelEmail: string;
  labelCity: string;
  placeholderCity: string;
  labelHowFound: string;
  optionSelect: string;
  optionConcert: string;
  optionSocial: string;
  optionFriend: string;
  optionSpotify: string;
  optionOther: string;
  labelFavSong: string; // {bandName}
  placeholderFavSong: string;
  labelInstagram: string;
  placeholderInstagram: string;
  labelMessage: string;
  placeholderMessage: string;
  consentPrefix: string;
  consentPrivacyLink: string;
  consentMiddle: string;
  consentExplicit: string;
  consentSuffix: string;
  submitJoin: string; // {bandName}
  submitting: string;
  followUsAlso: string;
  bookingTitle: string;
  bookingBadgeLive: string;
  bookingQuestion: string; // {bandName}
  bookingEmailSubject: string; // {bandName}
  bookingWhatsappText: string; // {bandName}
  backHome: string;
  welcomeTitle: string; // {bandName}
  registeredDefaultMessage: string; // {bandName}
  benefitsTitle: string;
  downloadExclusive: string;
  merchCode: string;
  followUsPlatforms: string;
  economicSupportTitle: string; // {bandName}
  economicSupportSubtitle: string;
  revolutButton: string;
  revolutCopied: string;
  revolutHandle: string;
  revolutSuccessPrompt: string; // {bandName}
  revolutStepTitle: string;
  revolutBadge: string;
  revolutSecureDirect: string;
  privacyModalTitle: string;
  privacyPara1: string; // {bandName} x2
  privacyPara2: string;
  privacyPara3: string; // {bandName}
  privacyPara4: string;
  understood: string;
};

const es: FanFormDict = {
  officialChannel: 'Canal Oficial',
  joinTitle: 'Únete a {bandName}',
  thanksConcertWithName: '¡Gracias por venir al concierto de {concertName}! 🎸',
  thanksConcertGeneric: '¡Gracias por venir al concierto! 🎸',
  thanksSupport: '¡Gracias por tu apoyo! 🎶',
  supportIntro: 'Apóyanos como prefieras: **síguenos directamente en tus redes favoritas** o **recibe información en tu correo**.',
  tabFollow: '📱 Síguenos en Redes',
  tabJoin: '✉️ Recibir Novedades',
  followHelpTitle: '⚡ ¡Ayúdanos a crecer!',
  followHelpBody: 'Elige tu plataforma preferida y **síguenos**. ¡Es la mejor forma de apoyar la música independiente!',
  followCTA: '✨ ¿Quieres info directa en tu correo? Apúntate aquí →',
  errorRequiredFields: 'Por favor, rellena los campos obligatorios y acepta la política.',
  errorGenericSignup: 'Error al registrarte.',
  labelName: 'Nombre *',
  placeholderName: 'Tu nombre completo',
  labelEmail: 'Email *',
  labelCity: 'Ciudad (Opcional)',
  placeholderCity: '¿De dónde nos escuchas?',
  labelHowFound: '¿Cómo nos conociste? *',
  optionSelect: 'Selecciona una opción...',
  optionConcert: 'En un concierto',
  optionSocial: 'Por Instagram / TikTok / Redes',
  optionFriend: 'Por recomendación de un amigo',
  optionSpotify: 'Descubrimiento en Spotify / Streaming',
  optionOther: 'Otro',
  labelFavSong: '¿Tu canción favorita de {bandName}? (Opcional)',
  placeholderFavSong: 'Ej: La Noche Entera, Balada...',
  labelInstagram: 'Usuario de Instagram (Opcional)',
  placeholderInstagram: '@tu_usuario',
  labelMessage: 'Mensaje o saludo para la banda (Opcional)',
  placeholderMessage: 'Déjale un saludo o dedicatoria a la banda...',
  consentPrefix: 'He leído y acepto la ',
  consentPrivacyLink: 'política de privacidad',
  consentMiddle: ', y doy mi ',
  consentExplicit: 'consentimiento explícito',
  consentSuffix: ' para que la banda guarde mis datos y me envíe novedades.',
  submitJoin: 'Únete a {bandName}',
  submitting: 'Registrando...',
  followUsAlso: 'O síguenos en redes',
  bookingTitle: 'Contrataciones & Booking',
  bookingBadgeLive: 'Directo',
  bookingQuestion: '¿Quieres contratar a **{bandName}** para tu sala, festival o evento privado? Contacta directamente:',
  bookingEmailSubject: 'Contratación y Booking - {bandName}',
  bookingWhatsappText: 'Hola, me gustaría información para contratar a {bandName}',
  backHome: 'Volver al inicio',
  welcomeTitle: '¡Bienvenido a {bandName}!',
  registeredDefaultMessage: '¡Registro completado! Nos alegramos de que formes parte de la familia de {bandName}.',
  benefitsTitle: 'Tus Beneficios',
  downloadExclusive: 'Descargar Contenido Exclusivo',
  merchCode: 'Código Promocional de Merch',
  followUsPlatforms: '📱 Síguenos en nuestras plataformas',
  economicSupportTitle: 'Colabora con {bandName} con una aportación económica',
  economicSupportSubtitle: 'Tu aportación voluntaria nos ayuda a financiar nuevas grabaciones, furgoneta de gira, cuerdas e instrumentos y producir merchandising independiente.',
  revolutButton: 'Aportar con Revolut',
  revolutCopied: '¡Enlace de Revolut copiado!',
  revolutHandle: 'revolut.me/{tag}',
  revolutSuccessPrompt: '¿Quieres dar un paso más y apoyar a la banda?',
  revolutStepTitle: 'Colaboración Económica & Donaciones',
  revolutBadge: 'Aportación Voluntaria',
  revolutSecureDirect: 'Pago seguro directo a la banda sin comisiones',
  privacyModalTitle: 'Política de Privacidad y RGPD',
  privacyPara1: '**1. Responsable del tratamiento:** {bandName} (Banda musical). Los datos facilitados a través de este código QR y formulario serán tratados con la única finalidad de gestionar tu registro con {bandName} e informarte sobre próximos conciertos, lanzamientos y novedades musicales.',
  privacyPara2: '**2. Legitimación:** El tratamiento de tus datos se basa en tu consentimiento explícito al marcar la casilla de aceptación y enviar el formulario.',
  privacyPara3: '**3. Destinatarios:** Los datos se almacenan de forma segura para uso exclusivo de {bandName} en la gestión de su base de fans. No se cederán a terceros salvo obligación legal.',
  privacyPara4: '**4. Derechos:** Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión y portabilidad escribiendo a nuestro correo de contacto o indicándolo en cualquiera de nuestros correos informativos.',
  understood: 'Entendido',
};

const en: FanFormDict = {
  officialChannel: 'Official Channel',
  joinTitle: 'Join {bandName}',
  thanksConcertWithName: 'Thanks for coming to the {concertName} show! 🎸',
  thanksConcertGeneric: 'Thanks for coming to the show! 🎸',
  thanksSupport: 'Thanks for your support! 🎶',
  supportIntro: 'Support us however you like: **follow us on your favorite social platform** or **get updates by email**.',
  tabFollow: '📱 Follow Us',
  tabJoin: '✉️ Get Updates',
  followHelpTitle: '⚡ Help us grow!',
  followHelpBody: 'Pick your favorite platform and **follow us**. It\'s the best way to support independent music!',
  followCTA: '✨ Want updates straight to your inbox? Sign up here →',
  errorRequiredFields: 'Please fill in the required fields and accept the privacy policy.',
  errorGenericSignup: 'Something went wrong while signing you up.',
  labelName: 'Name *',
  placeholderName: 'Your full name',
  labelEmail: 'Email *',
  labelCity: 'City (optional)',
  placeholderCity: 'Where are you listening from?',
  labelHowFound: 'How did you hear about us? *',
  optionSelect: 'Select an option...',
  optionConcert: 'At a concert',
  optionSocial: 'Instagram / TikTok / Social media',
  optionFriend: 'A friend recommended us',
  optionSpotify: 'Discovered on Spotify / Streaming',
  optionOther: 'Other',
  labelFavSong: 'Your favorite {bandName} song? (optional)',
  placeholderFavSong: 'E.g. La Noche Entera, Balada...',
  labelInstagram: 'Instagram handle (optional)',
  placeholderInstagram: '@your_username',
  labelMessage: 'Message or shout-out for the band (optional)',
  placeholderMessage: 'Leave a message or dedication for the band...',
  consentPrefix: 'I have read and accept the ',
  consentPrivacyLink: 'privacy policy',
  consentMiddle: ', and I give my ',
  consentExplicit: 'explicit consent',
  consentSuffix: ' for the band to store my data and send me updates.',
  submitJoin: 'Join {bandName}',
  submitting: 'Signing you up...',
  followUsAlso: 'Or follow us on social media',
  bookingTitle: 'Booking & Bookings',
  bookingBadgeLive: 'Live',
  bookingQuestion: 'Want to book **{bandName}** for your venue, festival or private event? Get in touch directly:',
  bookingEmailSubject: 'Booking Inquiry - {bandName}',
  bookingWhatsappText: 'Hi, I\'d like info about booking {bandName}',
  backHome: 'Back home',
  welcomeTitle: 'Welcome to {bandName}!',
  registeredDefaultMessage: 'Sign-up complete! We\'re glad you\'re part of the {bandName} family.',
  benefitsTitle: 'Your Perks',
  downloadExclusive: 'Download Exclusive Content',
  merchCode: 'Merch Promo Code',
  followUsPlatforms: '📱 Follow us on our platforms',
  economicSupportTitle: 'Support {bandName} with a financial contribution',
  economicSupportSubtitle: 'Your direct support helps us fund new studio recordings, tour van expenses, instruments and produce independent merch.',
  revolutButton: 'Contribute via Revolut',
  revolutCopied: 'Revolut link copied!',
  revolutHandle: 'revolut.me/{tag}',
  revolutSuccessPrompt: 'Want to take a step further and support the band?',
  revolutStepTitle: 'Financial Support & Tips',
  revolutBadge: 'Voluntary Tip',
  revolutSecureDirect: 'Secure direct payment to the band with zero middleman fees',
  privacyModalTitle: 'Privacy Policy & GDPR',
  privacyPara1: '**1. Data controller:** {bandName} (music band). The data provided through this QR code and form will be used solely to manage your sign-up with {bandName} and to inform you about upcoming concerts, releases and music news.',
  privacyPara2: '**2. Legal basis:** The processing of your data is based on your explicit consent when checking the acceptance box and submitting the form.',
  privacyPara3: '**3. Recipients:** Data is stored securely for the exclusive use of {bandName} in managing its fan base. It will not be shared with third parties except where legally required.',
  privacyPara4: '**4. Your rights:** You can exercise your rights of access, rectification, erasure and portability at any time by writing to our contact email or by requesting it in any of our newsletters.',
  understood: 'Got it',
};

const it: FanFormDict = {
  officialChannel: 'Canale Ufficiale',
  joinTitle: 'Unisciti a {bandName}',
  thanksConcertWithName: 'Grazie per essere venuto al concerto di {concertName}! 🎸',
  thanksConcertGeneric: 'Grazie per essere venuto al concerto! 🎸',
  thanksSupport: 'Grazie per il tuo supporto! 🎶',
  supportIntro: 'Sostienici come preferisci: **seguici direttamente sui tuoi social preferiti** oppure **ricevi le novità via email**.',
  tabFollow: '📱 Seguici sui Social',
  tabJoin: '✉️ Ricevi Novità',
  followHelpTitle: '⚡ Aiutaci a crescere!',
  followHelpBody: 'Scegli la tua piattaforma preferita e **seguici**. È il modo migliore per sostenere la musica indipendente!',
  followCTA: '✨ Vuoi ricevere le novità via email? Iscriviti qui →',
  errorRequiredFields: 'Compila i campi obbligatori e accetta l\'informativa sulla privacy.',
  errorGenericSignup: 'Si è verificato un errore durante la registrazione.',
  labelName: 'Nome *',
  placeholderName: 'Il tuo nome completo',
  labelEmail: 'Email *',
  labelCity: 'Città (facoltativo)',
  placeholderCity: 'Da dove ci ascolti?',
  labelHowFound: 'Come ci hai conosciuto? *',
  optionSelect: 'Seleziona un\'opzione...',
  optionConcert: 'A un concerto',
  optionSocial: 'Instagram / TikTok / Social',
  optionFriend: 'Consigliato da un amico',
  optionSpotify: 'Scoperto su Spotify / Streaming',
  optionOther: 'Altro',
  labelFavSong: 'La tua canzone preferita di {bandName}? (facoltativo)',
  placeholderFavSong: 'Es: La Noche Entera, Balada...',
  labelInstagram: 'Nome utente Instagram (facoltativo)',
  placeholderInstagram: '@tuo_username',
  labelMessage: 'Messaggio o saluto per la band (facoltativo)',
  placeholderMessage: 'Lascia un saluto o una dedica alla band...',
  consentPrefix: 'Ho letto e accetto la ',
  consentPrivacyLink: 'informativa sulla privacy',
  consentMiddle: ', e do il mio ',
  consentExplicit: 'consenso esplicito',
  consentSuffix: ' affinché la band conservi i miei dati e mi invii aggiornamenti.',
  submitJoin: 'Unisciti a {bandName}',
  submitting: 'Registrazione in corso...',
  followUsAlso: 'Oppure seguici sui social',
  bookingTitle: 'Ingaggi & Booking',
  bookingBadgeLive: 'Diretto',
  bookingQuestion: 'Vuoi ingaggiare **{bandName}** per il tuo locale, festival o evento privato? Contattaci direttamente:',
  bookingEmailSubject: 'Richiesta Booking - {bandName}',
  bookingWhatsappText: 'Ciao, vorrei informazioni per ingaggiare {bandName}',
  backHome: 'Torna alla home',
  welcomeTitle: 'Benvenuto in {bandName}!',
  registeredDefaultMessage: 'Registrazione completata! Siamo felici che tu faccia parte della famiglia di {bandName}.',
  benefitsTitle: 'I Tuoi Vantaggi',
  downloadExclusive: 'Scarica Contenuto Esclusivo',
  merchCode: 'Codice Promozionale Merch',
  followUsPlatforms: '📱 Seguici sulle nostre piattaforme',
  economicSupportTitle: 'Collabora con {bandName} con un contributo economico',
  economicSupportSubtitle: 'Il tuo supporto diretto ci aiuta a finanziare nuove registrazioni in studio, spese del furgone del tour, strumenti e produrre merchandising indipendente.',
  revolutButton: 'Contribuisci con Revolut',
  revolutCopied: 'Link Revolut copiato!',
  revolutHandle: 'revolut.me/{tag}',
  revolutSuccessPrompt: 'Vuoi fare un passo in più e sostenere la band?',
  revolutStepTitle: 'Supporto Economico & Donazioni',
  revolutBadge: 'Donazione Volontaria',
  revolutSecureDirect: 'Pagamento sicuro diretto alla band senza commissioni',
  privacyModalTitle: 'Informativa Privacy e GDPR',
  privacyPara1: '**1. Titolare del trattamento:** {bandName} (band musicale). I dati forniti tramite questo codice QR e il modulo saranno trattati esclusivamente per gestire la tua registrazione con {bandName} e per informarti su prossimi concerti, uscite e novità musicali.',
  privacyPara2: '**2. Base giuridica:** Il trattamento dei tuoi dati si basa sul tuo consenso esplicito, espresso selezionando la casella di accettazione e inviando il modulo.',
  privacyPara3: '**3. Destinatari:** I dati sono conservati in modo sicuro per uso esclusivo di {bandName} nella gestione della propria base fan. Non saranno condivisi con terzi salvo obbligo di legge.',
  privacyPara4: '**4. Diritti:** Puoi esercitare in qualsiasi momento i tuoi diritti di accesso, rettifica, cancellazione e portabilità scrivendo alla nostra email di contatto o richiedendolo in una qualsiasi delle nostre email informative.',
  understood: 'Capito',
};

const cs: FanFormDict = {
  officialChannel: 'Oficiální kanál',
  joinTitle: 'Připoj se k {bandName}',
  thanksConcertWithName: 'Díky, že jsi přišel/přišla na koncert {concertName}! 🎸',
  thanksConcertGeneric: 'Díky, že jsi přišel/přišla na koncert! 🎸',
  thanksSupport: 'Díky za tvou podporu! 🎶',
  supportIntro: 'Podpoř nás, jak chceš: **sleduj nás na oblíbené sociální síti** nebo **dostávej novinky e-mailem**.',
  tabFollow: '📱 Sleduj nás',
  tabJoin: '✉️ Chci novinky',
  followHelpTitle: '⚡ Pomoz nám růst!',
  followHelpBody: 'Vyber si oblíbenou platformu a **sleduj nás**. Je to nejlepší způsob, jak podpořit nezávislou hudbu!',
  followCTA: '✨ Chceš novinky přímo do e-mailu? Přihlas se zde →',
  errorRequiredFields: 'Vyplň prosím povinná pole a přijmi zásady ochrany osobních údajů.',
  errorGenericSignup: 'Při registraci došlo k chybě.',
  labelName: 'Jméno *',
  placeholderName: 'Tvoje celé jméno',
  labelEmail: 'E-mail *',
  labelCity: 'Město (volitelné)',
  placeholderCity: 'Odkud nás posloucháš?',
  labelHowFound: 'Jak jsi nás poznal/poznala? *',
  optionSelect: 'Vyber možnost...',
  optionConcert: 'Na koncertě',
  optionSocial: 'Instagram / TikTok / Sociální sítě',
  optionFriend: 'Doporučil/a mi to kamarád/ka',
  optionSpotify: 'Objevil/a jsem na Spotify / streamování',
  optionOther: 'Jiné',
  labelFavSong: 'Tvoje oblíbená písnička od {bandName}? (volitelné)',
  placeholderFavSong: 'Např.: La Noche Entera, Balada...',
  labelInstagram: 'Uživatelské jméno na Instagramu (volitelné)',
  placeholderInstagram: '@tvuj_ucet',
  labelMessage: 'Vzkaz nebo pozdrav pro kapelu (volitelné)',
  placeholderMessage: 'Nech kapele vzkaz nebo věnování...',
  consentPrefix: 'Přečetl/a jsem si a souhlasím se ',
  consentPrivacyLink: 'zásadami ochrany osobních údajů',
  consentMiddle: ' a dávám svůj ',
  consentExplicit: 'výslovný souhlas',
  consentSuffix: ' s tím, aby kapela uchovávala moje údaje a posílala mi novinky.',
  submitJoin: 'Připoj se k {bandName}',
  submitting: 'Registruji tě...',
  followUsAlso: 'Nebo nás sleduj na sociálních sítích',
  bookingTitle: 'Booking & Vystoupení',
  bookingBadgeLive: 'Naživo',
  bookingQuestion: 'Chceš si objednat **{bandName}** do svého klubu, na festival nebo na soukromou akci? Kontaktuj nás přímo:',
  bookingEmailSubject: 'Poptávka na booking - {bandName}',
  bookingWhatsappText: 'Ahoj, chtěl/a bych informace o objednání kapely {bandName}',
  backHome: 'Zpět na hlavní stránku',
  welcomeTitle: 'Vítej u {bandName}!',
  registeredDefaultMessage: 'Registrace dokončena! Jsme rádi, že jsi součástí rodiny {bandName}.',
  benefitsTitle: 'Tvoje výhody',
  downloadExclusive: 'Stáhnout exkluzivní obsah',
  merchCode: 'Slevový kód na merch',
  followUsPlatforms: '📱 Sleduj nás na našich platformách',
  privacyModalTitle: 'Zásady ochrany osobních údajů a GDPR',
  privacyPara1: '**1. Správce údajů:** {bandName} (hudební kapela). Údaje poskytnuté prostřednictvím tohoto QR kódu a formuláře budou zpracovány výhradně za účelem správy tvé registrace u {bandName} a informování o nadcházejících koncertech, vydáních a hudebních novinkách.',
  privacyPara2: '**2. Právní základ:** Zpracování tvých údajů je založeno na tvém výslovném souhlasu vyjádřeném zaškrtnutím políčka a odesláním formuláře.',
  privacyPara3: '**3. Příjemci:** Údaje jsou bezpečně uloženy pro výhradní použití {bandName} při správě fanouškovské základny. Nebudou předány třetím stranám s výjimkou zákonné povinnosti.',
  privacyPara4: '**4. Tvá práva:** Kdykoli můžeš uplatnit svá práva na přístup, opravu, výmaz a přenositelnost údajů, a to napsáním na náš kontaktní e-mail nebo uvedením v kterémkoli z našich informačních e-mailů.',
  understood: 'Rozumím',
};

export const FAN_FORM_TRANSLATIONS: Record<FanFormLanguage, FanFormDict> = { es, en, it, cs };

/** Sustituye {token} por su valor. Los tokens que faltan se dejan tal cual. */
export function interpolate(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? vars[key]! : match));
}
