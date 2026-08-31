import { detectPitchLanguage } from "./leadLanguage.js";
import { formatGlobalPitchFeedbackForPrompt, mapLeadTipoToTemplateCategory } from "../promptsManager.js";

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
  // Reglas aprendidas automáticamente (Self-Refining Tone DNA)
  reglasEstiloAprendidas?: string[];
  vocabularioAprendido?: string[];
  terminosAEvitar?: string[];
  fewShotSection?: string;
  // ADN de voz y tono entrenado manualmente por el mánager (BandToneModal / dna_expresion)
  tonoComunicacion?: string;
  tratamientoHabitual?: string;
  nivelEnergia?: string;
  vocabularioClave?: string[];
  frasesEmblematicas?: string[];
  emojisFrecuentes?: string[];
  puntosFuertesConectar?: string;
  recomendacionPitch?: string;
  // Pautas de IA + instrucción del mánager para la plantilla de la categoría de este lead
  // (BandCRM > Plantillas de Email), persistidas por banda en category_pitch_templates.
  categoryTemplateTitle?: string;
  categoryTemplateGuidelines?: string;
  categoryTemplateCustomInstruction?: string;
}

function strOrUndef(v: any): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Una campaña sin `isActive`/`is_active` explícito a `false` se trata como activa. */
export function isCampaignActive(campaign: any): boolean {
  return Boolean(campaign) && campaign.isActive !== false && campaign.is_active !== false;
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

  const dnaExpresion = registeredBand?.dna_expresion || {};
  const categoryKey = mapLeadTipoToTemplateCategory(lead?.tipo);

  // DNA aprendido automáticamente (Self-Refining Tone DNA), separado por categoría de lead
  // (server/db/pitchLearning.ts) para no mezclar "cómo corrijo a un medio" con "cómo corrijo
  // a una sala". Con fallback a los campos planos antiguos (una única bolsa para toda la banda)
  // para bandas que aún no tengan reglas aprendidas específicas de esta categoría.
  const reglasPorCategoria = dnaExpresion.reglas_por_categoria?.[categoryKey];
  const reglasEstiloAprendidas = Array.isArray(reglasPorCategoria?.reglas_estilo_aprendidas)
    ? reglasPorCategoria.reglas_estilo_aprendidas
    : (Array.isArray(dnaExpresion.reglas_estilo_aprendidas) ? dnaExpresion.reglas_estilo_aprendidas : undefined);
  const vocabularioAprendido = Array.isArray(reglasPorCategoria?.vocabulario_aprendido)
    ? reglasPorCategoria.vocabulario_aprendido
    : (Array.isArray(dnaExpresion.vocabulario_aprendido) ? dnaExpresion.vocabulario_aprendido : undefined);
  const terminosAEvitar = Array.isArray(reglasPorCategoria?.terminos_a_evitar)
    ? reglasPorCategoria.terminos_a_evitar
    : (Array.isArray(dnaExpresion.terminos_a_evitar) ? dnaExpresion.terminos_a_evitar : undefined);

  // ADN de voz entrenado a mano por el mánager en BandToneModal (POST /api/bands/analyze-tone,
  // PATCH /api/bands/tone-dna). Hasta ahora solo alimentaba Reels/chat (bandProfile.ts) y nunca
  // llegaba al Redactor de pitches, así que el mánager entrenaba tono y vocabulario sin que
  // tuviera ningún efecto real en los correos a salas.
  const tonoComunicacion = strOrUndef(dnaExpresion.tono_comunicacion);
  const tratamientoHabitual = strOrUndef(dnaExpresion.tratamiento_habitual);
  const nivelEnergia = strOrUndef(dnaExpresion.nivel_energia);
  const vocabularioClave = Array.isArray(dnaExpresion.vocabulario_clave) ? dnaExpresion.vocabulario_clave : undefined;
  const frasesEmblematicas = Array.isArray(dnaExpresion.frases_emblematicas_extraidas) ? dnaExpresion.frases_emblematicas_extraidas : undefined;
  const emojisFrecuentes = Array.isArray(dnaExpresion.emojis_frecuentes) ? dnaExpresion.emojis_frecuentes : undefined;
  const puntosFuertesConectar = strOrUndef(dnaExpresion.puntos_fuertes_para_conectar);
  const recomendacionPitch = strOrUndef(dnaExpresion.recomendacion_pitch);

  // Pautas de IA y plantilla entrenadas por el mánager para la categoría de ESTE lead
  // (server/routes/leads/templates.ts, category_pitch_templates). Antes esto ni persistía de
  // verdad ni llegaba aquí: el mánager editaba "pautas para salas" y no tenía ningún efecto
  // real en los pitches generados para salas.
  const categoryTemplate = state?.categoryTemplates?.[categoryKey];
  const categoryTemplateTitle = strOrUndef(categoryTemplate?.title);
  const categoryTemplateGuidelines = strOrUndef(categoryTemplate?.guidelines);
  const categoryTemplateCustomInstruction = strOrUndef(categoryTemplate?.customInstruction);

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
    cargoFirma,
    reglasEstiloAprendidas,
    vocabularioAprendido,
    terminosAEvitar,
    tonoComunicacion,
    tratamientoHabitual,
    nivelEnergia,
    vocabularioClave,
    frasesEmblematicas,
    emojisFrecuentes,
    puntosFuertesConectar,
    recomendacionPitch,
    categoryTemplateTitle,
    categoryTemplateGuidelines,
    categoryTemplateCustomInstruction
  };
}

/**
 * Construye un prompt completo y multidimensional que integra todos los ADNs de la banda,
 * el perfil del recinto/medio receptor, el historial de aprendizaje del mánager y las directrices
 * de idioma y tono sin fórmulas clichés de IA.
 */
export function buildEnhancedPitchSystemPrompt(bandDna: BandDnaProfile, globalMemory: string, lead: any, activeCampaign?: any): string {
  const languageHint = detectPitchLanguage(lead);
  const leadTipo = String(lead?.tipo || "sala").toLowerCase();
  const categoryKey = mapLeadTipoToTemplateCategory(lead?.tipo);

  let campaignSection = "";
  if (isCampaignActive(activeCampaign)) {
    const cName = activeCampaign.name || "Campaña de Booking";
    const cDates = activeCampaign.targetDatesText || (Array.isArray(activeCampaign.targetDates) && activeCampaign.targetDates.length > 0 ? activeCampaign.targetDates.join(', ') : (Array.isArray(activeCampaign.target_dates) ? activeCampaign.target_dates.join(', ') : 'próximas semanas/meses'));
    const cCities = Array.isArray(activeCampaign.targetCities) && activeCampaign.targetCities.length > 0 ? activeCampaign.targetCities.join(', ') : (Array.isArray(activeCampaign.target_cities) ? activeCampaign.target_cities.join(', ') : 'España');
    const cTemplatesMap = activeCampaign.custom_pitch_templates || activeCampaign.customPitchTemplates || {};
    const cTemplate = (cTemplatesMap && typeof cTemplatesMap === 'object' ? cTemplatesMap[categoryKey] : '') || '';
    const cNotes = activeCampaign.notes || '';
    const cMin = activeCampaign.minCapacity || activeCampaign.min_capacity || 0;
    const cMax = activeCampaign.maxCapacity || activeCampaign.max_capacity || 0;
    const capInfo = cMax > 0 ? `Aforo objetivo de sala para esta campaña: ${cMin}-${cMax} personas.` : '';

    campaignSection = `
═════════════════════════════════════════════════════════════════════
🎯 CAMPAÑA DE BOOKING ACTIVA: "${cName}" (PRIORIDAD MÁXIMA DE AGENDA)
═════════════════════════════════════════════════════════════════════
- Fechas de concierto deseadas: ${cDates}
- Ciudades / Rutas objetivo: ${cCities}
${capInfo ? `- ${capInfo}` : ''}
${cTemplate ? `- Mensaje clave / Plantilla de la campaña para "${categoryKey}": "${cTemplate}"` : ''}
${cNotes ? `- Notas estratégicas de la campaña: "${cNotes}"` : ''}
* DIRECTIVA CRÍTICA: En el cuerpo de la propuesta, menciona explícitamente y con total naturalidad que la banda está cuadrando la ruta para las fechas "${cDates}" y solicita disponibilidad en sala para esas fechas concretas. Si procede, menciona la apertura a compartir cartel con otra banda para co-booking.
`;
  }

  return `Eres el Director de Booking y Mánager de Comunicación de la banda "${bandDna.bandName}".
Tu cometido es redactar una propuesta de concierto de altísimo impacto, redactada como un auténtico profesional de la industria musical independiente (cálido, directo, sin clichés corporativos ni fórmulas acartonadas de IA).
${campaignSection}
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
${(bandDna.tonoComunicacion || bandDna.tratamientoHabitual || bandDna.nivelEnergia || (bandDna.vocabularioClave && bandDna.vocabularioClave.length > 0) || (bandDna.frasesEmblematicas && bandDna.frasesEmblematicas.length > 0) || (bandDna.emojisFrecuentes && bandDna.emojisFrecuentes.length > 0) || bandDna.puntosFuertesConectar || bandDna.recomendacionPitch) ? `
5. ADN DE VOZ Y CARÁCTER ENTRENADO POR EL MÁNAGER (MANDA SOBRE EL TONO GENÉRICO DE MÁS ABAJO):
${bandDna.tonoComunicacion ? `   - Tono de comunicación habitual: ${bandDna.tonoComunicacion}` : ""}
${bandDna.tratamientoHabitual ? `   - Tratamiento habitual: ${bandDna.tratamientoHabitual}` : ""}
${bandDna.nivelEnergia ? `   - Nivel de energía: ${bandDna.nivelEnergia}` : ""}
${bandDna.vocabularioClave && bandDna.vocabularioClave.length > 0 ? `   - Vocabulario propio (úsalo de verdad en el texto, no lo dejes solo como referencia): ${bandDna.vocabularioClave.join(", ")}` : ""}
${bandDna.frasesEmblematicas && bandDna.frasesEmblematicas.length > 0 ? `   - Frases/expresiones emblemáticas suyas (cuélalas tal cual si encajan de forma natural): ${bandDna.frasesEmblematicas.map(f => `"${f}"`).join(" | ")}` : ""}
${bandDna.emojisFrecuentes && bandDna.emojisFrecuentes.length > 0 ? `   - Emojis que usan de verdad, solo si el registro del correo los admite con moderación profesional: ${bandDna.emojisFrecuentes.join(" ")}` : ""}
${bandDna.puntosFuertesConectar ? `   - Puntos fuertes para conectar con el destinatario: ${bandDna.puntosFuertesConectar}` : ""}
${bandDna.recomendacionPitch ? `   - Recomendación de enfoque de pitch para esta banda (análisis de IA sobre su ADN real): ${bandDna.recomendacionPitch}` : ""}
` : ""}
${bandDna.reglasEstiloAprendidas && bandDna.reglasEstiloAprendidas.length > 0 ? `
6. REGLAS DE ESTILO APRENDIDAS AUTOMÁTICAMENTE DE CORRECCIONES PREVIAS PARA "${categoryKey.toUpperCase()}" (SELF-REFINING TONE DNA):
${bandDna.reglasEstiloAprendidas.map(r => `   - ⭐ ${r}`).join("\n")}
${bandDna.vocabularioAprendido && bandDna.vocabularioAprendido.length > 0 ? `   - Vocabulario y expresiones predilectas: ${bandDna.vocabularioAprendido.join(", ")}` : ""}
${bandDna.terminosAEvitar && bandDna.terminosAEvitar.length > 0 ? `   - Expresiones terminantemente prohibidas: ${bandDna.terminosAEvitar.join(", ")}` : ""}
` : ""}
7. ENLACES Y DOSSIER:
   - REGLA DE ORO DE ENLACES: No saturar el cuerpo del correo con enlaces a plataformas de streaming en medio del texto. En el cuerpo del correo únicamente se hace referencia elegante al Dossier Oficial / EPK y Rider Técnico adjunto al pie de la firma (${bandDna.epkUrl}), donde el programador encontrará toda la información, vídeos en directo, temas y rider.

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
${(bandDna.categoryTemplateGuidelines || bandDna.categoryTemplateCustomInstruction) ? `
═════════════════════════════════════════════════════════════════════
📋 PAUTAS ESPECÍFICAS PARA "${bandDna.categoryTemplateTitle || leadTipo}" (ENTRENADAS POR EL MÁNAGER PARA ESTE TIPO DE DESTINATARIO):
═════════════════════════════════════════════════════════════════════
${bandDna.categoryTemplateGuidelines ? bandDna.categoryTemplateGuidelines : ""}
${bandDna.categoryTemplateCustomInstruction ? `Instrucción específica reciente del mánager para esta categoría: "${bandDna.categoryTemplateCustomInstruction}"` : ""}
` : ""}
═════════════════════════════════════════════════════════════════════
📐 DIRECTRICES DE REDACCIÓN DE ALTA CONVERSIÓN (ANTI-AI SLOP):
═════════════════════════════════════════════════════════════════════
1. ${languageHint.instruction}
2. ADAPTACIÓN DE ENFOQUE POR TIPO:
   - SALAS / CLUB DE DIRECTO: Destaca que el show es festivo, bailable y garantiza consumo de barra; ofrece montaje rápido y flexibilidad en taquilla o co-booking con banda local de la ciudad.
   - FESTIVALES: Resalta la conexión masiva, el alto impacto en horarios nocturnos/tardes y la agilidad en cambio de set.
   - DISCOTECAS / CLUBS: Presenta el show como Live Set nocturno bailable de madrugada entre DJs.
   - MEDIOS / RADIO / PRENSA: Enfoque informativo y de colaboración cultural; ofrece temas en calidad broadcast (WAV), entrevistas o acústicos (¡JAMÁS pedir bolos ni taquilla a un medio!).
   - GRUPOS / ARTISTAS: Enfoque de colega de profesión para compartir concierto, fecha doble o intercambio (Date Swap en su ciudad y en la nuestra).
   - AYUNTAMIENTOS / FIESTAS: Destaca el carácter festivo e intergeneracional, la solvencia técnica y la facturación formal.
3. TONO, ESTRUCTURA Y FIRMA ÚNICA:
   - Saludo cercano y personalizado (ej: "Hola equipo de [Sala]").
   - Gancho inicial directo conectando con la fecha objetivo de la gira (ej. 4 de diciembre en Madrid).
   - Resumen conciso de propuesta, formato y facilidad técnica sin rodeos.
   - Referencia limpia al dossier: indicar que al pie disponen del Dossier Oficial y EPK con el directo y el rider técnico.
   - Cierre con pregunta abierta orientada a agenda (ej. "¿Cómo tenéis la agenda para coordinar esa fecha?").
   - Cierre cordial de una sola frase (ej: "¡Un saludo!" o "Quedamos a vuestra disposición.").
   - REGLA DE NO DOBLE FIRMA: NUNCA escribas bloques de firma manuales, números de teléfono, correos, nombres ni cargos al final del texto. El sistema inserta automáticamente la firma visual única con el dossier y las redes oficiales de la banda (Instagram, Facebook, TikTok).
4. PROHIBICIONES ESTRICTAS:
   - NUNCA inventar instrumentos de viento (trompetas, saxos, trombones) para Bakandeya.
   - PROHIBIDAS las frases hechas y clichés ("espero que te encuentres bien", "en el competitivo panorama actual", "una experiencia inolvidable").
   - NO incluir enlaces a Spotify/YouTube en el texto del cuerpo; toda la referencia se canaliza a través del dossier oficial en la firma.
   - Devuelve ÚNICAMENTE el cuerpo redactado del email listo para ser enviado, sin asuntos, encabezados ni metadatos extra.
${bandDna.fewShotSection || ""}`;
}

/**
 * Prompt para el Contestador: redacta la respuesta a un mensaje REAL ya recibido de una sala/
 * medio/festival (negociación, petición de más info, confirmación, rechazo...), no el primer
 * contacto. Comparte el ADN de la banda con buildEnhancedPitchSystemPrompt, pero cambia el
 * objetivo (responder, no presentar) y las fuentes de estilo (hilo real + ejemplos de
 * respuestas pasadas, en vez de campaña + directrices de primer contacto).
 */
export function buildReplySystemPrompt(
  bandDna: BandDnaProfile,
  lead: any,
  incomingMessage: string,
  threadSoFar: Array<{ remitente: "sala" | "banda"; mensaje: string }>,
  replyFewShotSection: string
): string {
  const languageHint = detectPitchLanguage(lead);
  const historialTexto = threadSoFar.length > 0
    ? threadSoFar.map((m) => `[${m.remitente === "banda" ? bandDna.bandName : (lead?.nombre_sala || "Sala")}]: "${m.mensaje}"`).join("\n\n")
    : "Sin mensajes previos registrados en el hilo (es la primera respuesta que se les envía tras el contacto inicial).";

  return `Eres el Director de Booking y Mánager de Comunicación de la banda "${bandDna.bandName}".
Te acaba de llegar una respuesta REAL de "${lead?.nombre_sala || "un contacto"}" a una propuesta que ya les enviasteis. Tu tarea es redactar la CONTESTACIÓN a ese mensaje, no un pitch nuevo desde cero: responde específicamente a lo que dicen, sin repetir toda la presentación de la banda desde el principio.

═════════════════════════════════════════════════════════════════════
🧬 ADN Y VECTORES DE IDENTIDAD DE "${bandDna.bandName}":
═════════════════════════════════════════════════════════════════════
- Género / Fusión: ${bandDna.genero}
- Concepto artístico: ${bandDna.biografia}
- Formato escénico: ${bandDna.formato} (${bandDna.numMusicos} músicos en escenario). ${bandDna.reglaDeOroInstrumentos}
- Modelo económico: ${bandDna.flexibilidadEconomica}
- Co-booking: ${bandDna.propuestaCoBooking}
${(bandDna.tonoComunicacion || bandDna.tratamientoHabitual || (bandDna.vocabularioClave && bandDna.vocabularioClave.length > 0) || (bandDna.frasesEmblematicas && bandDna.frasesEmblematicas.length > 0) || bandDna.recomendacionPitch) ? `
ADN DE VOZ Y CARÁCTER ENTRENADO POR EL MÁNAGER (MANDA SOBRE EL TONO GENÉRICO):
${bandDna.tonoComunicacion ? `- Tono de comunicación habitual: ${bandDna.tonoComunicacion}` : ""}
${bandDna.tratamientoHabitual ? `- Tratamiento habitual: ${bandDna.tratamientoHabitual}` : ""}
${bandDna.vocabularioClave && bandDna.vocabularioClave.length > 0 ? `- Vocabulario propio (úsalo de verdad): ${bandDna.vocabularioClave.join(", ")}` : ""}
${bandDna.frasesEmblematicas && bandDna.frasesEmblematicas.length > 0 ? `- Frases/expresiones emblemáticas suyas: ${bandDna.frasesEmblematicas.map((f) => `"${f}"`).join(" | ")}` : ""}
${bandDna.recomendacionPitch ? `- Recomendación de enfoque para esta banda: ${bandDna.recomendacionPitch}` : ""}
` : ""}
${bandDna.reglasEstiloAprendidas && bandDna.reglasEstiloAprendidas.length > 0 ? `
REGLAS DE ESTILO APRENDIDAS DE CORRECCIONES PREVIAS:
${bandDna.reglasEstiloAprendidas.map((r) => `- ⭐ ${r}`).join("\n")}
${bandDna.terminosAEvitar && bandDna.terminosAEvitar.length > 0 ? `- Expresiones prohibidas: ${bandDna.terminosAEvitar.join(", ")}` : ""}
` : ""}

═════════════════════════════════════════════════════════════════════
🎯 PERFIL DEL DESTINATARIO:
═════════════════════════════════════════════════════════════════════
- Nombre de la Entidad: "${lead?.nombre_sala || "Sala"}"
- Ciudad: ${lead?.ciudad || "España"}
- Tipo: ${String(lead?.tipo || "sala").toLowerCase()}
${lead?.contacto_nombre ? `- Responsable de programación: ${lead.contacto_nombre}` : ""}

═════════════════════════════════════════════════════════════════════
📜 HILO DE LA CONVERSACIÓN HASTA AHORA:
═════════════════════════════════════════════════════════════════════
${historialTexto}

═════════════════════════════════════════════════════════════════════
📩 MENSAJE ENTRANTE AL QUE HAY QUE RESPONDER AHORA:
═════════════════════════════════════════════════════════════════════
"${incomingMessage}"
${replyFewShotSection}
═════════════════════════════════════════════════════════════════════
📐 DIRECTRICES DE LA RESPUESTA:
═════════════════════════════════════════════════════════════════════
1. ${languageHint.instruction}
2. Responde específicamente a lo que dice el mensaje entrante: si pide fecha, propón o confirma fecha; si pregunta precio/condiciones, responde con el modelo económico de la banda; si pone objeciones, gestiónalas sin ser insistente; si es un rechazo claro, agradece con cortesía y deja la puerta abierta sin insistir.
3. NO repitas la presentación completa de la banda como si fuera el primer contacto: ya la tienen, ve al grano de esta respuesta concreta.
4. Mantén el mismo tono y vocabulario que ya viene usando la banda en su ADN de voz y en los ejemplos reales de respuestas anteriores, si los hay.
5. REGLA DE NO DOBLE FIRMA: no escribas bloques de firma manuales al final; el sistema añade la firma automáticamente.
6. Devuelve ÚNICAMENTE el cuerpo del email de respuesta, sin asunto ni metadatos.`;
}

/**
 * Formatea hilos de ejemplo reales (pegados por el mánager o resueltos de verdad) para el
 * prompt del Contestador: a diferencia del few-shot de pitches, aquí interesa la conversación
 * completa (incluida la respuesta real de la sala), no solo el mensaje inicial.
 */
export function formatReplyFewShotForPrompt(threads: Array<{
  titulo?: string;
  resultado?: string;
  mensajes: Array<{ rol: "banda" | "sala"; texto: string; orden: number }>;
}>): string {
  if (!threads || threads.length === 0) return "";

  const formatted = threads.map((t, i) => {
    const ordenados = [...t.mensajes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    const cuerpo = ordenados.map((m) => `  [${m.rol === "banda" ? "Banda" : "Sala"}]: "${m.texto}"`).join("\n");
    const resultadoTxt = t.resultado === "positiva" ? " | RESULTADO: POSITIVO" : t.resultado === "negativa" ? " | Resultado: no prosperó, pero así se gestionó" : "";
    return `EJEMPLO REAL ${i + 1} (${t.titulo || "conversación real"}${resultadoTxt}):\n${cuerpo}`;
  }).join("\n\n");

  return `
═════════════════════════════════════════════════════════════════════
💎 EJEMPLOS REALES DE CÓMO ESTA BANDA HA GESTIONADO CONVERSACIONES SIMILARES:
═════════════════════════════════════════════════════════════════════
Imita el tono, la cadencia y el estilo de respuesta de estos hilos reales, adaptándolo a este caso concreto:

${formatted}
`;
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
  activeCampaign?: any;
}): string {
  const { bandDna, lead, activeCampaign } = params;
  const leadTipo = String(lead?.tipo || "sala").toLowerCase();
  const salaNombre = lead?.nombre_sala || "la sala";
  const ciudad = lead?.ciudad || "";
  const ciudadStr = ciudad ? ` (${ciudad})` : "";
  const aforo = lead?.aforo ? Number(lead.aforo) : 0;
  const aforoStr = aforo > 0 ? ` para aforos de unas ${aforo} personas` : "";
  const customNote = params.customInstruction ? `\n[Ajuste solicitado por el mánager: "${params.customInstruction.trim()}"]\n` : "";

  const campDatesText = activeCampaign?.targetDatesText || (Array.isArray(activeCampaign?.targetDates) && activeCampaign.targetDates.length > 0 ? activeCampaign.targetDates.join(', ') : (Array.isArray(activeCampaign?.target_dates) ? activeCampaign.target_dates.join(', ') : ''));
  const campName = activeCampaign?.name || '';
  const campaignIntro = campDatesText 
    ? `Actualmente estamos coordinando la ruta de conciertos de nuestra **${campName || 'campaña de directo'}** y nos gustaría proponeros cuadrar fecha para **${campDatesText}** en ${salaNombre}${ciudadStr}.`
    : `Actualmente estamos cerrando el calendario de los próximos meses y nos encantaría valorar disponibilidad de fechas en vuestra sala.`;

  const greetingPerson = lead?.contacto_nombre ? `Hola ${lead.contacto_nombre.split(" ")[0]}, equipo de ${salaNombre}` : `Hola equipo de ${salaNombre}`;

  // 1. CASO: MEDIOS / PRENSA / RADIO / PODCAST
  if (leadTipo.includes("medio") || leadTipo.includes("prensa") || leadTipo.includes("radio") || leadTipo.includes("podcast")) {
    return `${greetingPerson}${ciudadStr}:
${customNote}
Os escribimos desde el equipo de **${bandDna.bandName}** (${bandDna.genero}). Os hacemos llegar nuestra propuesta informativa con motivo de nuestra gira de conciertos y lanzamientos 2026.

${bandDna.biografia}

Nos encantaría ponernos a vuestra disposición para:
• Remitiros temas en calidad broadcast / WAV para sonar en vuestra programación.
• Entrevistas, acústicos en directo en estudio o reseñas del nuevo material.

Tenéis acceso a todos los temas, material audiovisual y kit de prensa completo en nuestro **Dossier Oficial & EPK** que encontraréis referenciado al pie de este correo.

Quedamos a vuestra entera disposición para cualquier contenido o consulta. ¡Muchas gracias por apoyar la música independiente en directo!

Un cordial saludo,`;
  }

  // 2. CASO: FESTIVALES DE MÚSICA
  if (leadTipo.includes("festiv")) {
    return `Estimada organización y equipo de programación de ${salaNombre}${ciudadStr}:
${customNote}
Nos ponemos en contacto desde la oficina de **${bandDna.bandName}** para presentar nuestra propuesta artística (${bandDna.genero}) de cara a la próxima edición de vuestro festival.

${bandDna.bandName} ofrece un espectáculo en directo de alto impacto concebido para escenarios de festival (${bandDna.duracionDirecto}):
• ${bandDna.formato} con un directo potente, dinámico y festivo (${bandDna.instrumentacion}).
• Montaje rápido y rotación ágil de escenario (${bandDna.montajeRapido}), facilitando la operativa técnica del festival.
• ${bandDna.cifrasClaveTexto}

Disponéis de nuestro **Dossier Oficial, EPK y Rider Técnico** completo con vídeos de directo y temas al pie de la firma de este mensaje.

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

Podéis consultar nuestro dossier interactivo y rider técnico al pie de este correo.

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

Disponen del Dossier de Prensa y Rider Técnico oficial referenciado al pie de esta comunicación.

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

Podéis consultar nuestro directo, dossier y propuesta en el enlace de la firma al pie de este mensaje.

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos una breve llamada para cuadrar calendarios?

¡Un fuerte abrazo!`;
  }

  // 6. CASO ESTÁNDAR: SALAS Y TEATROS DE CONCIERTOS
  return `${greetingPerson}${ciudadStr}:
${customNote}
Os escribimos desde el equipo de **${bandDna.bandName}** (${bandDna.genero}). Seguimos de cerca la programación de ${salaNombre} y creemos que nuestra propuesta de directo encaja perfectamente con vuestra línea artística y vuestro público habitual.

**Sobre nuestra propuesta de directo:**
• **Formato:** ${bandDna.formato} — show continuo, dinámico y participativo (${bandDna.instrumentacion}) con una duración de ${bandDna.duracionDirecto}.
• **Producción:** Montaje y prueba de sonido ágil (${bandDna.montajeRapido}) con rider técnico limpio y eficiente${aforoStr}.
• **Condiciones:** ${bandDna.flexibilidadEconomica} Además, tenemos total disposición para colaborar con bandas locales de ${ciudad || "la zona"} para asegurar convocatoria y venta de barra.

Tenéis a vuestra disposición el **Dossier Oficial, EPK y Rider Técnico** completo con vídeos de directo y audios referenciado en la firma al pie de este mensaje.

${campaignIntro} ¿Cómo tenéis la agenda para valorar una fecha conjunta?

¡Muchas gracias por vuestro tiempo y por seguir apostando por la música en directo!

Un saludo cordial,`;
}
