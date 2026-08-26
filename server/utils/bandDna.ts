import { detectPitchLanguage } from "./leadLanguage.js";
import { formatGlobalPitchFeedbackForPrompt } from "../promptsManager.js";

export interface BandDnaProfile {
  bandId: string;
  cleanId: string;
  bandName: string;
  genero: string;
  biografia: string;
  ciudadBase: string;
  // Formación e instrumentos
  formato: string;
  numMusicos: number;
  instrumentacion: string;
  reglaDeOroInstrumentos: string;
  duracionDirecto: string;
  // Puesta en escena y energía
  energiaDirecto: string;
  puntosFuertesDirecto: string[];
  // Logística y técnica
  montajeRapido: string;
  riderResumen: string;
  riderPdfUrl?: string;
  // Modelo económico y contratación
  flexibilidadEconomica: string;
  propuestaCoBooking: string;
  // Social Proof & Cifras
  cifrasClaveTexto: string;
  // Enlaces oficiales y multimedia
  spotifyUrl: string;
  youtubeUrl: string;
  epkUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  // Contacto oficial
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  cargoFirma: string;
}

/**
 * Extrae el perfil de ADN completo y multidimensional de cualquier banda registrada
 * o de Bakandeya a partir del estado de la aplicación.
 */
export function getBandDnaProfile(state: any, bandId: string, lead?: any): BandDnaProfile {
  const cleanId = (bandId || "band-bakandeya").replace(/^(band|reg)-/, "");
  const isBakandeya = cleanId.toLowerCase() === "bakandeya" || cleanId === "";

  const bandConfig = state?.epkConfigsByBand?.[bandId] ||
    state?.epkConfigsByBand?.[cleanId] ||
    state?.epkConfigsByBand?.[`band-${cleanId}`] ||
    state?.epkConfig || {};

  const registeredBand = (state?.registeredBands || []).find(
    (b: any) => b.band_id === bandId ||
      b.band_id === cleanId ||
      b.band_id === `band-${cleanId}` ||
      b.id === bandId
  );

  const rawBandName = registeredBand?.nombre_banda ||
    registeredBand?.bandName ||
    bandConfig?.contactoBooking?.nombre ||
    bandConfig?.nombre_banda ||
    (isBakandeya ? "Bakandeya" : cleanId.charAt(0).toUpperCase() + cleanId.slice(1));

  const bandName = rawBandName.trim();

  // Género y Bio
  const genero = registeredBand?.estilo_musical ||
    bandConfig?.genero ||
    (isBakandeya ? "Balkan-Ska / Mestizaje / Reggae / Electrónica Analógica" : "Música en directo / Indie / Fusión");

  const biografia = bandConfig?.biografia ||
    registeredBand?.biografia ||
    registeredBand?.dossier_texto_extra ||
    (isBakandeya
      ? "Propuesta vibrante de balkan-ska, mestizaje y ritmos bailables liderada por violín solista, sintetizadores analógicos, percusión en vivo, bajo y voz."
      : "Banda independiente de música en directo con un potente y enérgico show escénico.");

  const ciudadBase = bandConfig?.datosContratacion?.ciudadBase ||
    registeredBand?.localizacion ||
    (isBakandeya ? "Madrid / Sevilla (España)" : "España");

  // Formato e Instrumentación
  const numMusicos = bandConfig?.datosContratacion?.numMusicos || (isBakandeya ? 4 : 4);
  const formato = bandConfig?.datosContratacion?.formatos ||
    (isBakandeya ? "Cuarteto compacto (violín, sintetizadores/loops, batería/percusión, bajo/voz)" : `Banda en directo (${numMusicos} músicos)`);

  const instrumentacion = isBakandeya
    ? "Violín solista eléctrico y acústico, Sintetizadores analógicos y secuencias/loops, Percusión en vivo / Batería potente, Bajo eléctrico y voz principal."
    : (bandConfig?.riderTecnico?.substring(0, 120) || "Formación completa de directo");

  const reglaDeOroInstrumentos = isBakandeya
    ? "REGLA OBLIGATORIA DE ORO: Bakandeya NO TIENE instrumentos de viento (trompetas, saxos, trombones). Toda la riqueza melódica y festiva la lideran el violín solista y los sintetizadores analógicos. NUNCA mencionar vientos, trompetas ni saxofones."
    : "Respetar fielmente la instrumentación declarada por la banda.";

  const duracionDirecto = bandConfig?.datosContratacion?.duracionDirecto || "75 a 90 minutos de show continuo sin pausas";

  // Puesta en escena y energía
  const energiaDirecto = isBakandeya
    ? "Directo explosivo, sudoroso, bailable y festivo con conexión constante con el público desde el primer acorde hasta el final."
    : "Directo dinámico y enérgico enfocado a involucrar al público de la sala.";

  const puntosFuertesDirecto = [
    "Sonido orgánico y bailable que garantiza movimiento en pista y consumo de barra.",
    "Montaje y prueba de sonido ultra-rápida (30-45 min) con linetime eficiente.",
    "Rider técnico optimizado y limpio adaptable a salas íntimas o grandes escenarios de festival.",
    "Gran conexión con el público y dinamismo escénico sin silencios entre canciones."
  ];

  // Logística y rider
  const montajeRapido = "30 a 45 minutos (setup ágil y linetime reducido, ideal para cambios de set rápidos o dobles carteles)";
  const riderResumen = bandConfig?.riderTecnico ||
    (isBakandeya
      ? "PA estéreo adecuada al aforo, microfonía Shure SM58, líneas DI para violín y sintetizadores analógicos, microfonía para percusión/batería y línea de bajo."
      : "Rider estándar adaptado al aforo.");

  const riderPdfUrl = bandConfig?.riderPdfUrl || undefined;

  // Modelo económico
  const flexibilidadEconomica = "Flexibilidad total en modelo de contratación: taquilla compartida con o sin garantía, taquilla inversa, o caché fijo/variable según el formato y aforo del recinto.";
  const propuestaCoBooking = "Total disposición a compartir cartel y colaborar con bandas locales de la ciudad de la sala para sumar públicos y asegurar una excelente entrada.";

  // Social Proof
  const cifras = bandConfig?.cifrasClave;
  let cifrasClaveTexto = "Más de 40 conciertos en directo en salas y festivales de la península.";
  if (cifras?.habilitado) {
    const parts = [];
    if (cifras.directos) parts.push(`${cifras.directos} conciertos realizados`);
    if (cifras.oyentes) parts.push(`${cifras.oyentes} oyentes`);
    if (cifras.comunidad) parts.push(`${cifras.comunidad} seguidores`);
    if (cifras.ciudades) parts.push(`${cifras.ciudades} ciudades visitadas`);
    if (parts.length > 0) cifrasClaveTexto = parts.join(" • ");
  }

  // Enlaces oficiales
  const baseUrl = process.env.APP_URL || "https://bands-manager.up.railway.app";
  const epkUrl = `${baseUrl}/epk?band=${encodeURIComponent(bandId || cleanId)}`;
  const spotifyUrl = bandConfig?.enlacesRedes?.spotify || registeredBand?.spotify_youtube || "https://open.spotify.com/artist/bakandeya";
  const youtubeUrl = bandConfig?.enlacesRedes?.youtube || "https://youtube.com/@bakandeya_oficial";
  const instagramUrl = bandConfig?.enlacesRedes?.instagram || registeredBand?.instagram || "@bakandeya_oficial";
  const websiteUrl = bandConfig?.enlacesRedes?.website || baseUrl;

  // Contacto
  const contactoNombre = bandConfig?.contactoBooking?.nombre || registeredBand?.contacto_nombre || "Diego de la Calle";
  const contactoEmail = bandConfig?.contactoBooking?.email || registeredBand?.email || "diego.delacalleb@gmail.com";
  const contactoTelefono = bandConfig?.contactoBooking?.telefono || registeredBand?.telefono || "+34 612 345 678";
  const cargoFirma = bandConfig?.firmaEmail?.cargo || `Booking & Management — ${bandName}`;

  return {
    bandId,
    cleanId,
    bandName,
    genero,
    biografia,
    ciudadBase,
    formato,
    numMusicos,
    instrumentacion,
    reglaDeOroInstrumentos,
    duracionDirecto,
    energiaDirecto,
    puntosFuertesDirecto,
    montajeRapido,
    riderResumen,
    riderPdfUrl,
    flexibilidadEconomica,
    propuestaCoBooking,
    cifrasClaveTexto,
    spotifyUrl,
    youtubeUrl,
    epkUrl,
    instagramUrl,
    websiteUrl,
    contactoNombre,
    contactoEmail,
    contactoTelefono,
    cargoFirma
  };
}

/**
 * Construye un prompt completo y multidimensional que integra todos los ADNs de la banda,
 * el perfil del recinto/medio receptor, el historial de aprendizaje del mánager y las directrices
 * de idioma y tono sin fórmulas clichés de IA.
 */
export function buildEnhancedPitchSystemPrompt(bandDna: BandDnaProfile, globalMemory: string, lead: any): string {
  const languageHint = detectPitchLanguage(lead);
  const leadTipo = String(lead?.tipo || "sala").toLowerCase();

  return `Eres el Director de Booking y Mánager de Comunicación de la banda "${bandDna.bandName}".
Tu cometido es redactar una propuesta de concierto de altísimo impacto, redactada como un auténtico profesional de la industria musical independiente (cálido, directo, sin clichés corporativos ni fórmulas acartonadas de IA).

═════════════════════════════════════════════════════════════════════
🧬 ADN Y VECTORES DE IDENTIDAD DE "${bandDna.bandName}":
═════════════════════════════════════════════════════════════════════
1. IDENTIDAD MUSICAL Y ARTÍSTICA:
   - Género / Fusión: ${bandDna.genero}
   - Concepto artístico: ${bandDna.biografia}
   - Formato escénico: ${bandDna.formato} (${bandDna.numMusicos} músicos en escenario).
   - Instrumentación clave: ${bandDna.instrumentacion}
   - ${bandDna.reglaDeOroInstrumentos}

2. DIRECTO, ENERGÍA Y CONSUMO DE BARRA:
   - Duración del show: ${bandDna.duracionDirecto}
   - Puesta en escena: ${bandDna.energiaDirecto}
   - Argumentario para el programador: Ritmo bailable y festivo que asegura movimiento constante de público, excelente dinamización de la barra y ambiente de fiesta de principio a fin.

3. LOGÍSTICA, MONTAJE Y RIDER TÉCNICO:
   - Ciudad base: ${bandDna.ciudadBase}
   - Montaje y prueba: ${bandDna.montajeRapido}
   - Rider técnico: Setup limpio, eficiente y adaptable a cualquier equipo de PA y escenario.

4. CONDICIONES ECONÓMICAS Y CO-BOOKING:
   - Modelo: ${bandDna.flexibilidadEconomica}
   - Co-booking: ${bandDna.propuestaCoBooking}

5. ENLACES OFICIALES VERIFICADOS (OBLIGATORIO INCLUIRLOS EN FORMATO MARKDOWN):
   - 🎧 Escuchar en Spotify: ${bandDna.spotifyUrl}
   - 🎬 Ver vídeo en directo (YouTube): ${bandDna.youtubeUrl}
   - 📄 Dossier EPK y Rider Técnico: ${bandDna.epkUrl}
   - Contacto: ${bandDna.contactoNombre} (${bandDna.cargoFirma}) | ${bandDna.contactoEmail} | ${bandDna.contactoTelefono}

═════════════════════════════════════════════════════════════════════
🎯 PERFIL ESPECÍFICO DEL DESTINATARIO:
═════════════════════════════════════════════════════════════════════
- Nombre de la Entidad / Espacio: "${lead?.nombre_sala || "Sala"}"
- Ciudad / Ubicación: ${lead?.ciudad || "España"} (${lead?.region || ""})
- Aforo estimado: ${lead?.aforo ? `${lead.aforo} personas` : "Estándar"}
- Tipo de recinto / destinatario: ${leadTipo}
- Género / Programación habitual: ${lead?.genero || "Música en directo"}
${lead?.contacto_nombre ? `- Responsable de programación: ${lead.contacto_nombre}` : ""}
${lead?.notas ? `- Notas previas registradas: "${lead.notas}"` : ""}

═════════════════════════════════════════════════════════════════════
🧠 HISTORIAL DE FEEDBACK Y APRENDIZAJE DEL MÁNAGER:
═════════════════════════════════════════════════════════════════════
${globalMemory || "Sin historial previo. Mantener tono bailable, directo, profesional y fresco sin instrumentos de viento."}

═════════════════════════════════════════════════════════════════════
📐 DIRECTRICES DE REDACCIÓN DE ALTA CONVERSIÓN (ANTI-AI SLOP):
═════════════════════════════════════════════════════════════════════
1. ${languageHint.instruction}
2. ADAPTACIÓN DE ENFOQUE POR TIPO:
   - SALAS / CLUB DE DIRECTO: Destaca que el show es festivo, bailable y garantiza consumo de barra; ofrece montaje rápido y flexibilidad en taquilla o co-booking con banda local de la ciudad.
   - FESTIVALES: Resalta la conexión masiva, el alto impacto en horarios nocturnos/tardes y la agilidad en cambio de set.
   - DISCOTECAS / CLUBS: Presenta el show como Live Set nocturno bailable de madrugada entre DJs.
   - MEDIOS / RADIO / PRENSA: Enfoque informativo y de colaboración cultural; ofrece temas en calidad broadcast (WAV), entrevistas o acústicos (¡JAMÁS pedir bolos ni taquilla a un medio!).
   - GRUPOS / ARTISTAS: Enfoque de colega de profesión para intercambio de fechas (Date Swap en su ciudad y en la nuestra).
   - AYUNTAMIENTOS / FIESTAS: Destaca el carácter festivo e intergeneracional, la solvencia técnica y la facturación formal.
5. TONO Y FORMATO:
   - Saludo cercano y personalizado.
   - Gancho inicial breve (1-2 frases) que justifique por qué la banda encaja en su programación.
   - Bloque conciso con viñetas de puntos clave (formato, montaje, condiciones).
   - Lista clara de enlaces oficiales en Markdown para que el programador escuche y vea en 1 solo clic.
   - Cierre con pregunta abierta orientada a agenda (ej. "¿Cómo tenéis la programación para los próximos meses para valorar una fecha?").
   - Cierre cordial breve (ej: "¡Un saludo!" o "Quedamos a vuestra entera disposición.").
   - IMPORTANTE: NUNCA incluyas bloques de firma repetitivos, ni teléfonos, ni emails, ni nombres al pie, ya que el sistema de correo adjunta automáticamente la firma HTML oficial de la banda con su logotipo, contactos y redes.
4. PROHIBICIONES ESTRICTAS:
   - NUNCA inventar instrumentos de viento (trompetas, saxos, trombones) para Bakandeya.
   - PROHIBIDAS las frases hechas y clichés ("espero que te encuentres bien", "en el competitivo panorama actual", "una experiencia inolvidable").
   - Devuelve ÚNICAMENTE el cuerpo redactado del email listo para ser enviado, sin asuntos, encabezados ni metadatos extra.`;
}

/**
 * Generador inteligente local de pitches que incorpora todos los ADNs de la banda,
 * tipos de lead, idiomas y enlaces verificados de forma inmediata y resiliente.
 */
export function generateSmartDnaPitchFallback(params: {
  bandDna: BandDnaProfile;
  lead: any;
  provider?: string;
  customInstruction?: string;
  feedbackDetails?: string[];
}): string {
  const { bandDna, lead } = params;
  const leadTipo = String(lead?.tipo || "sala").toLowerCase();
  const salaNombre = lead?.nombre_sala || "la sala";
  const ciudad = lead?.ciudad || "";
  const ciudadStr = ciudad ? ` (${ciudad})` : "";
  const aforo = lead?.aforo ? Number(lead.aforo) : 0;
  const aforoStr = aforo > 0 ? ` para aforos de unas ${aforo} personas` : "";
  const customNote = params.customInstruction ? `\n[Ajuste solicitado por el mánager: "${params.customInstruction.trim()}"]\n` : "";

  const greetingPerson = lead?.contacto_nombre ? `Hola ${lead.contacto_nombre.split(" ")[0]}, equipo de ${salaNombre}` : `Hola equipo de ${salaNombre}`;

  // 1. CASO: MEDIOS / PRENSA / RADIO / PODCAST
  if (leadTipo.includes("medio") || leadTipo.includes("prensa") || leadTipo.includes("radio") || leadTipo.includes("podcast")) {
    return `${greetingPerson}${ciudadStr}:
${customNote}
Os escribimos desde el equipo de **${bandDna.bandName}** (${bandDna.genero}). Os hacemos llegar nuestro dossier de prensa y último material con motivo de nuestra gira de conciertos y lanzamientos 2026.

${bandDna.biografia}

Nos encantaría ponernos a vuestra disposición para:
• Remitiros temas en calidad broadcast / WAV para sonar en vuestra programación.
• Entrevistas, acústicos en directo en estudio o reseñas del nuevo material.

Enlaces oficiales y material promocional:
• Dossier de Prensa y EPK: ${bandDna.epkUrl}
• Escuchar en Spotify: ${bandDna.spotifyUrl}
• Vídeo en directo: ${bandDna.youtubeUrl}

Quedamos a vuestra entera disposición para cualquier contenido o consulta. ¡Muchas gracias por apoyar la música independiente en directo!

Un cordial saludo,`;
  }

  // 2. CASO: FESTIVALES DE MÚSICA
  if (leadTipo.includes("festiv")) {
    return `Estimada organización y equipo de programación de ${salaNombre}${ciudadStr}:
${customNote}
Nos ponemos en contacto desde la oficina de **${bandDna.bandName}** para presentar nuestra propuesta artística (${bandDna.genero}) de cara a la próxima edición de vuestro festival.

${bandDna.bandName} ofrece un espectáculo en directo de alto impacto concebido para escenarios de festival (${bandDna.duracionDirecto}):
• ${bandDna.formato} con un directo arrollador, bailable y festivo liderado por violín solista, sintetizadores analógicos, percusión potente, bajo y voz.
• Montaje rápido y rotación ágil de escenario (${bandDna.montajeRapido}), facilitando la operativa técnica del festival.
• ${bandDna.cifrasClaveTexto}

Material audiovisual en directo y rider:
• Vídeo en directo (YouTube): ${bandDna.youtubeUrl}
• Escuchar en Spotify: ${bandDna.spotifyUrl}
• Dossier Oficial, EPK y Rider Técnico: ${bandDna.epkUrl}

Estaríamos encantados de enviaros nuestra propuesta económica y disponibilidad de fechas para valorar nuestra incorporación al cartel.

Atentamente,`;
  }

  // 3. CASO: DISCOTECAS Y CLUBS NOCTURNOS
  if (leadTipo.includes("disco") || leadTipo.includes("club")) {
    return `${greetingPerson}${ciudadStr}:
${customNote}
Os escribimos desde el equipo de **${bandDna.bandName}** (${bandDna.genero}) para proponeros nuestro formato especial de **Live Set nocturno**, diseñado específicamente para la sesión de madrugada en clubes y discotecas.

Nuestra propuesta combina secuencias electrónicas analógicas, percusión en vivo y violín enérgico, creando un puente perfecto entre la fuerza de la música en directo y la pista de baile entre sesiones de DJs.

Detalles de la propuesta:
• Show continuo y bailable (${bandDna.duracionDirecto}) adaptado al público de noche${aforoStr}.
• Montaje técnico limpio y ágil (${bandDna.montajeRapido}).
• Flexibilidad total de condiciones (taquilla con consumición o caché acordado).

Material de escucha y directos:
• Directo en YouTube: ${bandDna.youtubeUrl}
• Spotify: ${bandDna.spotifyUrl}
• Dossier y Rider: ${bandDna.epkUrl}

¿Cómo tenéis la agenda para los próximos meses para coordinar una fecha de sesión?

Un saludo cordial,`;
  }

  // 4. CASO: AYUNTAMIENTOS / FIESTAS POPULARES
  if (leadTipo.includes("ayunt") || leadTipo.includes("fiesta") || leadTipo.includes("municip")) {
    return `Estimados responsables del Área de Cultura y Festejos de ${salaNombre}${ciudadStr}:
${customNote}
Nos dirigimos a ustedes desde la representación de **${bandDna.bandName}** (${bandDna.genero}) para presentar nuestra propuesta de concierto en directo de cara a la programación cultural y fiestas patronales de la próxima temporada.

${bandDna.biografia}
Es un espectáculo de 90 minutos de alta energía, familiar, participativo y muy bailable, ideal para plazas públicas y eventos al aire libre. Contamos con amplia solvencia técnica, facturación oficial y rigurosa puntualidad de producción.

Enlaces oficiales de consulta:
• Vídeo en directo (YouTube): ${bandDna.youtubeUrl}
• Dossier de Prensa y Rider Técnico: ${bandDna.epkUrl}
• Escuchar en Spotify: ${bandDna.spotifyUrl}

Quedamos a su entera disposición para remitirles nuestro rider técnico y propuesta presupuestaria formal.

Cordialmente,`;
  }

  // 5. CASO: GRUPOS / ARTISTAS (DATE SWAP / CO-BOOKING)
  if (leadTipo.includes("grup") || leadTipo.includes("artist") || leadTipo.includes("banda")) {
    return `¡Buenas, compañeros de ${salaNombre}! 🎸🔥
${customNote}
Os escribimos directamente desde **${bandDna.bandName}** (${bandDna.genero}, con base en ${bandDna.ciudadBase}).

Seguimos vuestra trayectoria y nos gusta mucho vuestro proyecto. Estamos organizando fechas de gira y queríamos proponeros un **intercambio de fechas / co-booking (Date Swap)**:
1. Montamos una fecha conjunta en nuestra ciudad (${bandDna.ciudadBase}), compartiendo cartel, backline y taquilla al 50%.
2. Coordinamos la fecha de vuelta en vuestra ciudad (${ciudad || "vuestra zona"}) para sumar ambos públicos locales y rentabilizar gastos de viaje.

Podéis echar un ojo a nuestro directo aquí:
• En directo en YouTube: ${bandDna.youtubeUrl}
• Spotify: ${bandDna.spotifyUrl}
• EPK interactivo: ${bandDna.epkUrl}

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos una breve llamada para cuadrar calendarios?

¡Un fuerte abrazo!`;
  }

  // 6. CASO ESTÁNDAR: SALAS Y TEATROS DE CONCIERTOS
  return `${greetingPerson}${ciudadStr}:
${customNote}
Os escribimos desde el equipo de **${bandDna.bandName}** (${bandDna.genero}). Seguimos de cerca la programación de ${salaNombre} y creemos que nuestra propuesta de directo encaja perfectamente con vuestra línea artística y vuestro público habitual.

**Sobre nuestra propuesta de directo:**
• **Formato:** ${bandDna.formato} — show arrollador y muy bailable liderado por violín solista, sintetizadores analógicos, percusión en vivo, bajo y voz (${bandDna.duracionDirecto}).
• **Producción:** Montaje y prueba de sonido ágil (${bandDna.montajeRapido}) con rider técnico limpio y eficiente${aforoStr}.
• **Condiciones:** ${bandDna.flexibilidadEconomica} Además, tenemos total disposición para colaborar con bandas locales de ${ciudad || "la zona"} para asegurar convocatoria y venta de barra.

**Enlaces oficiales de escucha y directo:**
• 🎧 Escuchar en Spotify: ${bandDna.spotifyUrl}
• 🎬 Ver directo en YouTube: ${bandDna.youtubeUrl}
• 📄 Dossier EPK y Rider Técnico: ${bandDna.epkUrl}

Actualmente estamos cerrando el calendario de los próximos meses y nos encantaría valorar disponibilidad de fechas en vuestra sala. ¿Cómo tenéis la agenda para la próxima temporada?

¡Muchas gracias por vuestro tiempo y por seguir apostando por la música en directo!

Un saludo cordial,`;
}
