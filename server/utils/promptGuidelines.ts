/**
 * MÓDULO MAESTRO DE HUMANIZACIÓN, ANTI-DETECCIÓN Y DIRECTRICES DE BOOKING
 *
 * Fuente única de verdad para la generación de mensajes (Cold Outreach y Contestador).
 * Diseñado para maximizar la conversión B2B, eliminar contradicciones internas y evitar
 * la saturación de tokens (Attention Dilution / Negative Constraint Violations).
 */

export interface CategoryTemplateConfig {
  category: string;
  title: string;
  subject: string;
  body: string;
  guidelines: string;
  toneRating: number;
  contentRating: number;
  customInstruction: string;
  recommendedWordRange?: { min: number; max: number; optimal: string };
  buyerPersona?: string;
  primaryValueDriver?: string;
  bannedApproaches?: string[];
  feedbackLogs: Array<{
    timestamp: string;
    toneRating?: number;
    contentRating?: number;
    comment?: string;
    source?: string;
    leadName?: string;
  }>;
  updatedAt: string;
}

/**
 * LISTA NEGRA UNIVERSAL DE MULETILLAS E IA-ISMOS
 * Palabras y fórmulas que activan detectores de IA o denotan texto autogenerado.
 */
export const BANNED_AI_WORDS: string[] = [
  "crucial", "esencial", "fundamental", "profundizar", "explorar", "aprovechar",
  "optimizar", "facilitador", "revolucionario", "vanguardia", "paisaje", "tapiz",
  "paisaje musical", "sinfonía de", "amalgama de", "en el mundo de hoy",
  "en el cambiante panorama", "en los tiempos que corren", "sumergirse en",
  "un sinfín de", "resonar con", "es fundamental destacar", "en última instancia",
  "experiencia inolvidable", "marcar un hito", "delve", "tapestry", "multifaceted",
  "furthermore", "moreover", "leverage", "harness the power of"
];

export const BANNED_OPENINGS: string[] = [
  "Espero que este correo te encuentre bien",
  "Espero que estés bien",
  "Me dirijo a ti",
  "Nos complace ponernos en contacto",
  "Nos alegra en gran medida",
  "Por medio de la presente"
];

export const DIRECT_WORD_SUBSTITUTIONS: Record<string, string> = {
  "utilizar / aprovechar / optimizar": "usar",
  "crucial / fundamental / esencial": "clave (o eliminar el adjetivo)",
  "profundizar / explorar": "ver o tratar",
  "quedamos a su entera disposición": "¿Cómo lo veis? / ¿Hablamos esta semana? / Un saludo"
};

/**
 * PLANTILLAS BASE POR VERTICAL (100% Humanizadas, sin clichés, sin em-dashes y sin contradicciones)
 */
export const CLEAN_CATEGORY_TEMPLATES: Record<string, CategoryTemplateConfig> = {
  salas: {
    category: "salas",
    title: "Salas y Teatros de Conciertos",
    subject: "[{{mes_o_fechas}}] - {{ciudad}} - {{nombre_banda}} ({{estilo}} / ref: {{artistas_referencia}})",
    body: `hola equipo de {{nombre_sala}},

Vimos vuestra programación y nos gusta mucho cómo cuidáis los directos de fin de semana en {{ciudad}}. Estamos cerrando ruta para los próximos meses y queremos hacer fecha con vosotros.

Hacemos {{estilo}} festivo con un show muy bailable para mover la pista y el consumo de barra. En nuestra última parada por la zona tuvimos muy buena respuesta de público.

Para sumar gente de {{ciudad}}, activaremos campaña geolocalizada en vuestro código postal las dos semanas previas. ¿Cómo tenéis la agenda para {{mes_o_fechas}}?

Un saludo y gracias por vuestro tiempo.`,
    guidelines: "Tono de socio comercial (mitigación de riesgo y barra). Cero bio fluff, cero instrumentos listados y cero muletillas de tiempos de montaje.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [
      {
        timestamp: new Date().toISOString(),
        toneRating: 5,
        contentRating: 5,
        comment: "Plantilla base humana, directa y enfocada a taquilla y barra sin clichés de IA.",
        source: "system"
      }
    ],
    updatedAt: new Date().toISOString()
  },

  festivales: {
    category: "festivales",
    title: "Festivales de Música",
    subject: "[Edición {{anio_proxima_edicion}}] - {{nombre_sala}} - {{nombre_banda}} ({{estilo}} / ref: {{artistas_referencia}})",
    body: `hola equipo de programación de {{nombre_sala}},

Sabemos el nivel de fiesta y energía que pide el público de vuestro festival desde primera hora de la tarde.

Hacemos {{estilo}} festivo pensado para abrir pista en grandes escenarios. Encajamos en la franja de media tarde en la línea de las bandas de fiesta y baile de ediciones anteriores.

¿Tenéis abierto el plazo de recepción de propuestas para la próxima edición?

Un saludo y enhorabuena por el cartel.`,
    guidelines: "Tono festivalero y conciso. Aplica slot mirroring de franja horaria. Cero detalles de minutos de montaje o riders en este primer contacto.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },

  discotecas: {
    category: "discotecas",
    title: "Discotecas y Clubbing Nocturno",
    subject: "[{{mes_o_fechas}}] - {{ciudad}} - {{nombre_banda}} Live Set ({{estilo}})",
    body: `hola equipo de {{nombre_sala}},

Nos gusta mucho el ambiente de clubbing que tenéis en {{ciudad}}. Queremos proponeros un Live Set nocturno de {{estilo}} para vuestra sesión de noche.

Es un directo de alta energía pensado para mantener la pista encendida y aportar un momento de directo potente a la fiesta de madrugada.

¿Cómo tenéis enfocada la programación de directos para las próximas semanas?

Un saludo.`,
    guidelines: "Tono nocturno y directo. Cero listas de instrumentos analógicos o especificaciones de cabina en frío.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },

  ayuntamientos: {
    category: "ayuntamientos",
    title: "Ayuntamientos y Fiestas Patronales",
    subject: "[Programación Cultural / Fiestas] - {{nombre_banda}} en {{nombre_sala}} ({{estilo}})",
    body: `Estimado equipo del Área de Cultura y Festejos de {{nombre_sala}},

Nos ponemos en contacto desde {{nombre_banda}} ({{estilo}}) para presentarles nuestra propuesta de concierto de cara a la programación cultural y festejos de la próxima temporada.

Ofrecemos un espectáculo enérgico y participativo, adecuado para todos los públicos en plazas y recintos municipales. Contamos con facturación oficial, alta en régimen de artistas y solvencia organizativa.

Tienen a su disposición el dossier oficial y vídeos de directo en el enlace al pie.

¿En qué fechas tienen prevista la comisión de programación de los próximos festejos?

Atentamente.`,
    guidelines: "Tono institucional y formal ('ustedes'). Destaca facturación oficial, alta en régimen de artistas y espectáculo intergeneracional sin tecnicismos.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    recommendedWordRange: { min: 90, max: 180, optimal: "110-160 palabras" },
    buyerPersona: "Técnico de Festejos / Concejal de Cultura",
    primaryValueDriver: "Seguridad administrativa, facturación legal y espectáculo apto para todas las edades sin incidentes.",
    bannedApproaches: ["Prohibido hablar de dinamizar barras o venta de copas", "Prohibido terminología de clubbing o fiesta descontrolada"],
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },

  teatros: {
    category: "teatros",
    title: "Teatros, Auditorios y Fundaciones Culturales",
    subject: "[Temporada / Ciclo Cultural] - {{nombre_banda}} en {{nombre_sala}} ({{estilo}})",
    body: `Estimado equipo de programación de {{nombre_sala}},

Nos ponemos en contacto desde {{nombre_banda}} ({{estilo}}) para presentarles nuestro proyecto musical de cara a los próximos ciclos y temporadas del espacio.

Nuestra propuesta se caracteriza por un sonido orgánico y cuidado, diseñado para dialogar con la acústica de recintos escénicos y ofrecer una experiencia de escucha atenta y cercana al público.

Disponen del dossier artístico, ficha técnica y grabaciones en directo en el enlace al pie.

¿Tienen abierta la convocatoria de recepción de propuestas para la próxima programación?

Un cordial saludo.`,
    guidelines: "Tono formal, respetuoso y elegante. Destaca calidez tímbrica, escucha atenta y adecuación acústica al patio de butacas. Cero alusiones a barras o copas.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    recommendedWordRange: { min: 85, max: 165, optimal: "100-150 palabras" },
    buyerPersona: "Director Artístico / Programador de Artes Escénicas",
    primaryValueDriver: "Excelencia acústica, respeto al espacio escénico y valor cultural del proyecto.",
    bannedApproaches: ["Terminantemente prohibido hablar de mover barras, copas o consumo", "Cero jerga de fiesta salvaje"],
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },

  medios: {
    category: "medios",
    title: "Medios de Comunicación, Radio y Prensa",
    subject: "[Música / Novedad] - {{nombre_banda}} presenta nueva música y gira ({{estilo}})",
    body: `hola equipo de {{nombre_sala}},

Os escribo desde {{nombre_banda}} ({{estilo}}). Seguimos vuestra labor apoyando la escena independiente en {{ciudad}} y os hacemos llegar nuestro nuevo material con motivo de las próximas fechas de gira.

Disponemos de los temas en calidad de emisión (WAV) por si encajan en vuestra programación, y estamos disponibles para entrevistas breves o acústicos en estudio.

Tenéis el enlace con los temas y el dossier al pie.

Muchas gracias por vuestro tiempo y por difundir música en directo.

Un saludo.`,
    guidelines: "Tono periodístico y facilitador de contenido. Jamás pedir fechas de conciertos ni taquillas a un medio.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },

  grupos: {
    category: "grupos",
    title: "Grupos y Bandas para Intercambio de Fechas",
    subject: "Propuesta de concierto compartido en {{ciudad}}: {{nombre_banda}} x {{nombre_sala}}",
    body: `¡hola gente de {{nombre_sala}}!

Os escribo desde {{nombre_banda}} ({{estilo}}). Nos gusta mucho lo que hacéis y creemos que nuestros estilos encajarían genial en una fecha compartida.

Queríamos proponeros un intercambio de fechas: os invitamos a tocar con nosotros en nuestra zona compartiendo sala y taquilla, y montamos la vuelta en vuestra ciudad para sumar públicos y repartir gastos de furgoneta y backline.

Podéis escuchar lo que hacemos en el enlace de abajo.

¿Cómo lo veis? Si os cuadra la idea, ¿hablamos esta semana y vemos opciones?

¡Un abrazo!`,
    guidelines: "Tono entre músicos: cercano, directo, colaborativo y de mutuo beneficio (Date Swap).",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },

  managements: {
    category: "managements",
    title: "Agencias de Management y Booking",
    subject: "Propuesta de colaboración / Roster: {{nombre_banda}} ({{estilo}})",
    body: `hola equipo de {{nombre_sala}},

Os escribo desde {{nombre_banda}} ({{estilo}}) para presentaros nuestra propuesta artística de cara a posibles coproducciones o colaboraciones de gira en los próximos meses.

El proyecto cuenta con un directo muy rodado, buena respuesta de taquilla y una producción ágil y contrastada en carretera.

Tenéis los vídeos de directo y datos de gira en el enlace al pie.

Si os encaja la propuesta, ¿vemos disponibilidad para una breve conversación esta semana?

Un saludo.`,
    guidelines: "Tono profesional y ejecutivo para agencias. Destaca tracción de público y solvencia en directo.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  }
};

/**
 * BLOQUE CENTRALIZADO DE REGLAS ANTI-AI Y DE REDACCIÓN DE ALTA CONVERSIÓN
 * Inyectado directamente en los generadores de prompt para garantizar consistencia.
 */
export function getCoreAntiAiRulesPrompt(): string {
  return `
═════════════════════════════════════════════════════════════════════
🛡️ PROTOCOLO MAESTRO DE HUMANIZACIÓN EXTREMA Y ANTI-DETECCIÓN DE IA:
═════════════════════════════════════════════════════════════════════
1. CONTROL SINTÁCTICO Y RITMO (BURSTINESS ORACIONAL OBLIGATORIA):
   - Combina oraciones muy cortas (3-5 palabras) con frases medianas (10-15 palabras).
   - Inicia algunas oraciones de forma natural con conectores como "Y" o "Pero".
   - NUNCA escribas dos oraciones seguidas con la misma longitud o cadencia.
   - PROHIBICIÓN ESTRICTA DE GUIONES LARGOS (—) y dobles guiones (--). Usa únicamente puntos o comas.
   - PROHIBICIÓN DEL PATRÓN DE TRES ELEMENTOS (RULE OF THREE): no acumules adjetivos o verbos en tríadas típicas de IA.
   - PROHIBICIÓN ABSOLUTA DE "THROAT-CLEARING": elimina frases vacías iniciales ("Espero que estés bien", "Me dirijo a ti"). Ve directo al objeto del mensaje en la primera frase.
   - PROHIBICIÓN DE GERUNDIOS ENCADENADOS.
   - INSERCIÓN DEL "DATO IMPOSIBLE DE AUTOMATIZAR" (afinidad real con la cartelera).
   - PROPUESTA DE PROMOCIÓN GEOLOCALIZADA en el código postal de la sala.
   - ANCLAJE DE VALOR EN SEGUIMIENTOS.
   - THE READ ALOUD TEST: Léelo en voz alta; debe sonar a persona real hablando.

2. ZERO PERSONNEL & ZERO LISTAS DE INSTRUMENTOS EN PRIMER CONTACTO:
   - Prohibido nombrar músicos ("Juan al bajo...") o listar instrumentos (violín, guitarras, sintetizadores). El destinatario lo verá en 3 segundos en el vídeo del dossier web.
   - Habla exclusivamente de: género, estilo, energía de la fiesta, convocatoria y público.

3. PROHIBICIÓN ABSOLUTA DEL TÉRMINO "EPK" EN EL TEXTO DEL EMAIL:
   - Queda TERMINANTEMENTE PROHIBIDO usar la sigla o acrónimo "EPK" en el cuerpo o firma del correo.
   - Usa SIEMPRE únicamente **"Dossier web"**, **"Dossier"** o **"Dossier interactivo"**. La sigla EPK es jerga técnica interna que muchos programadores de salas no comprenden.

3. CERO OBSESIÓN OPERATIVA EN PRIMER CONTACTO:
   - Prohibido meter muletillas de tiempos de montaje ("montamos en 20 min", "rider ágil") o cifras de taquilla/caché en el primer correo frío. La logística y finanzas se tratan tras el interés inicial.

4. DATO ANCLA Y PRUEBA SOCIAL REAL (CERO POSTUREO AMATEUR):
   - PROHIBIDA la fórmula clónica de IA: "Tras meter más de X personas en nuestra última fecha en sala similar...". Suena forzada y artificial.
   - Si se cita tracción, que sea sobria y contextualizada (ej: "en nuestra última visita a la ciudad llenamos la sala X"). Si no hay histórico directo, enfocarse en la campaña geolocalizada en su código postal y venta anticipada.

5. CONTEXTUALIZACIÓN GEOGRÁFICA Y LOCAL NATURAL:
   - Alude a la ciudad o zona con naturalidad ("en el centro de Madrid", "en el casco antiguo", "en la zona universitaria").
   - NUNCA fuerces nombres de calles concretas ("en pleno Valverde", "en plena calle X") si suena artificial o forzado.

6. APROVECHAMIENTO DE AGENDA Y FECHAS (ZERO BLIND ASKING):
   - Si se conocen fechas libres u ocupadas de la sala por la cartelera, no preguntes a ciegas: muestra que conoces su programación ("vimos que el 4 tenéis evento X, pero nos cuadraría el viernes 5 o jueves 11 para el pase de 21h").

7. CERO ENLACES EN EL CUERPO Y MENCIÓN DEL DOSSIER WEB EN LA FIRMA:
   - PROHIBIDO incluir enlaces URL (como https://... o dominios web) en el cuerpo del email. El cuerpo debe mantenerse limpio y profesional.
   - En su lugar, menciona siempre de forma natural que pueden consultar el **"dossier web"** (destacando expresamente la palabra "web") y directo en la firma del correo (ej: "Tenéis nuestro dossier web y directo en la firma de este correo", "Podéis ver nuestro directo en el dossier web de la firma").
   - La firma automática de la plataforma incluye el botón interactivo con el enlace seguro cifrado a la landing oficial.

8. FILTRADO LÉXICO Y PALABRAS TERMINANTEMENTE PROHIBIDAS:
   - Prohibidas de forma absoluta: ${BANNED_AI_WORDS.join(", ")}.
   - REGLAS DE SUSTITUCIÓN DIRECTA:
     * En vez de "utilizar / aprovechar / optimizar" -> usa "usar".
     * En vez de "crucial / fundamental / esencial" -> usa "clave" o elimina el término.
     * En vez de "profundizar / explorar" -> usa "ver" o "tratar".

9. MANDATO SINGLE-LINK & CERO ADJUNTOS PESADOS (FORMATO SINGLE-LINK):
   - Toda la información técnica, fotos y vídeos residen exclusivamente en el enlace interactivo del Dossier Web en la firma. Cero archivos PDF adjuntos en el primer contacto.

10. EXTENSIÓN Y DENSIDAD ÓPTIMA (~80-150 PALABRAS RECOMENDADAS):
   - REGLA ANTI-TRUNCAMIENTO DE GMAIL: Mantén el mensaje compacto y estructurado para lectura en diagonal de 5 segundos en pantalla móvil (sin provocar truncamiento de Gmail).
   - RECOMENDACIÓN ERGONÓMICA POR VERTICAL (NO ES UNA PROHIBICIÓN RÍGIDA SINO UNA GUÍA DE CONVERSIÓN):
     * Salas y Clubes: ~75-135 palabras (ultra-directo, foco en público y barra).
     * Festivales: ~80-145 palabras (conciso, slot mirroring).
     * Ayuntamientos / Festejos / Cultura: ~100-180 palabras (permite el encabezado y las garantías de régimen de artistas / facturación oficial).
     * Teatros y Auditorios: ~90-160 palabras (foco en calidez acústica y respeto al recinto).
   - Evita textos farragosos de más de 200 palabras que activen scroll excesivo, pero no recortes contexto relevante por cumplir un límite artificial.
`;
}
