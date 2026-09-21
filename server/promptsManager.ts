export function getGlobalPitchFeedbackSummary(leads: any[]) {
  if (!Array.isArray(leads)) return [];
  const logs: Array<{
    sala_o_medio: string;
    tipo: string;
    ciudad?: string;
    fecha: string;
    tono_rating?: number;
    contenido_rating?: number;
    comentario?: string;
  }> = [];

  for (const lead of leads) {
    if (Array.isArray(lead.historial_feedback_pitch)) {
      for (const item of lead.historial_feedback_pitch) {
        if (!item.deshecho && (item.comentario || item.tono_rating || item.contenido_rating)) {
          logs.push({
            sala_o_medio: lead.nombre_sala || 'Entidad',
            tipo: lead.tipo || 'sala',
            ciudad: lead.ciudad || '',
            fecha: item.fecha || '',
            tono_rating: item.tono_rating,
            contenido_rating: item.contenido_rating,
            comentario: item.comentario || ''
          });
        }
      }
    }
  }

  return logs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 15);
}

export function formatGlobalPitchFeedbackForPrompt(leads: any[]): string {
  const summary = getGlobalPitchFeedbackSummary(leads);
  if (summary.length === 0) {
    return "Sin historial previo de feedback. Usar tono bailable, directo y fresco sin instrumentos de viento.";
  }

  return summary.map((log, idx) => {
    const parts = [];
    if (log.comentario) parts.push(`Indicación del mánager: "${log.comentario}"`);
    if (log.tono_rating) parts.push(`Tono: ${log.tono_rating}/5`);
    if (log.contenido_rating) parts.push(`Contenido: ${log.contenido_rating}/5`);
    return `${idx + 1}. [${log.tipo.toUpperCase()} - ${log.sala_o_medio} (${log.ciudad || 'España'})]: ${parts.join(" | ")}`;
  }).join("\n");
}

export interface TemplateFeedbackLog {
  timestamp: string;
  toneRating?: number;
  contentRating?: number;
  comment?: string;
  source?: string; // 'manager_ui' | 'python_agent' | 'web_sandbox'
  leadName?: string;
}

export interface CategoryTemplateConfig {
  category: string; // 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements' | 'ayuntamientos'
  title: string;
  subject: string;
  body: string;
  guidelines: string;
  toneRating: number;
  contentRating: number;
  customInstruction: string;
  feedbackLogs: TemplateFeedbackLog[];
  updatedAt: string;
}

/**
 * A qué categoría de plantilla pertenece un lead según su `tipo`, con el mismo criterio difuso
 * que ya usa buildEnhancedPitchSystemPrompt para adaptar el enfoque por tipo de destinatario.
 * "ayuntamiento" tiene su propia categoría (registro mucho más formal e institucional que una
 * sala de conciertos) en vez de caer en "salas": antes de esta categoría, las correcciones del
 * mánager a pitches de ayuntamientos se mezclaban con las de salas normales en el mismo cubo de
 * aprendizaje (self-refining tone DNA), contaminando ambos estilos.
 */
export function mapLeadTipoToTemplateCategory(leadTipo: string | undefined | null): string {
  const tipo = String(leadTipo || "").toLowerCase();
  if (tipo.includes("ayunt") || tipo.includes("municip") || tipo.includes("fiesta")) return "ayuntamientos";
  if (tipo.includes("medio") || tipo.includes("prensa") || tipo.includes("radio") || tipo.includes("podcast")) return "medios";
  if (tipo.includes("festiv")) return "festivales";
  if (tipo.includes("disco") || tipo.includes("club")) return "discotecas";
  if (tipo.includes("grup") || tipo.includes("artist") || tipo.includes("banda")) return "grupos";
  if (tipo.includes("agencia") || tipo.includes("manager") || tipo.includes("management") || tipo.includes("sello")) return "managements";
  return "salas";
}

export const DEFAULT_CATEGORY_TEMPLATES: Record<string, CategoryTemplateConfig> = {
  salas: {
    category: "salas",
    title: "Salas y Teatros de Conciertos",
    subject: "Propuesta de directo: {{nombre_banda}} en {{nombre_sala}}",
    body: `Buenas equipo de {{nombre_sala}}:

Os escribo desde {{nombre_banda}} ({{estilo}}). Seguimos de cerca vuestra programación y el mimo que ponéis en los directos, y nos encantaría cuadrar fecha en vuestra sala aprovechando que estamos preparando ruta por la zona para los próximos meses.

Llevamos un directo en cuarteto muy vivo y dinámico, pensado para conectar de verdad con el público y generar muy buena energía de principio a fin.

Tenéis el dossier oficial con vídeos en directo y rider completo al pie.

¿Cómo tenéis enfocada la programación para el próximo trimestre o qué fechas soléis tener disponibles para directos de fuera?

¡Un saludo!`,
    guidelines: "Tono natural, directo y cercano sin clichés de IA. Muestra interés genuino por su programación y labor cultural antes de presentar la banda. Evita listas de viñetas simétricas y lenguaje corporativo acartonado.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [
      {
        timestamp: new Date().toISOString(),
        toneRating: 5,
        contentRating: 5,
        comment: "Plantilla base humana, con interés genuino por la programación y sin clichés robóticos de IA.",
        source: "system"
      }
    ],
    updatedAt: new Date().toISOString()
  },
  festivales: {
    category: "festivales",
    title: "Festivales de Música",
    subject: "Propuesta de contratación cartel 2026: {{nombre_banda}} ({{estilo}})",
    body: `Hola equipo de programación de {{nombre_sala}},

Os escribo en representación de {{nombre_banda}} ({{estilo}}) para presentar la propuesta de directo de cara a la próxima edición de vuestro festival.

Ofrecemos un show de alto ritmo pensado para grandes escenarios, con un directo muy festivo y bailable que funciona genial en horarios de tarde o noche. Además, nuestro montaje es rápido y eficiente, adaptándonos fácilmente a los cambios de set de festival.

Tenéis disponible nuestro Dossier Oficial, EPK y Rider Técnico en el pie de este correo para consultar vídeos de directo y audios.

Estaremos encantados de enviaros la propuesta económica y disponibilidad de agenda para valorar nuestra incorporación al cartel.

Un saludo,
Booking & Management — {{nombre_banda}}`,
    guidelines: "Tono enérgico, enfocado al impacto en festival y agilidad técnica. Sin muletillas de IA ni lenguaje acartonado.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  discotecas: {
    category: "discotecas",
    title: "Discotecas y Clubbing Nocturno",
    subject: "Propuesta Live Set nocturno: {{nombre_banda}} en {{nombre_sala}}",
    body: `Buenas equipo de {{nombre_sala}}:

Os escribo desde {{nombre_banda}} para proponeros un formato de Live Set nocturno ({{estilo}}), pensado específicamente para sesiones de discoteca y club.

Es un directo enérgico y muy bailable que combina electrónica analógica, violín y base rítmica para encender la pista y sumar un momento de música en vivo potente a vuestra noche.

Tenéis vídeos de directo y audios en el dossier al pie.

¿Cómo tenéis enfocada la programación de directos de madrugada para las próximas semanas?

¡Un saludo!`,
    guidelines: "Tono nocturno y directo para discotecas. Destaca la energía del Live Set y el buen encaje con la fiesta sin entrar en detalles de minutos de montaje.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  medios: {
    category: "medios",
    title: "Medios de Comunicación, Radio y Prensa",
    subject: "[Nota de prensa] {{nombre_banda}} presenta gira 2026 y nuevo material",
    body: `Hola equipo de {{nombre_sala}},

Os escribo desde {{nombre_banda}} ({{estilo}}) para haceros llegar nuestro dossier de prensa con motivo del lanzamiento de nuestro nuevo material y la gira de conciertos 2026.

Estaríamos encantados de enviaros los temas en calidad broadcast (WAV) para sonar en vuestra programación, o ponernos a vuestra disposición para entrevistas, acústicos o reseñas.

Tenéis el dossier interactivo con videoclips y audios en el enlace al pie.

Muchas gracias por apoyar la música independiente,

Prensa & Comunicación — {{nombre_banda}}`,
    guidelines: "Tono periodístico, claro y directo. Sin pedir taquillas ni fechas de conciertos.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  grupos: {
    category: "grupos",
    title: "Grupos y Bandas para Intercambio de Fechas",
    subject: "Concierto compartido e intercambio de fechas: {{nombre_banda}} x {{nombre_sala}}",
    body: `¡Buenas, gente de {{nombre_sala}}!

Os escribo desde {{nombre_banda}} ({{estilo}}). Nos gusta mucho lo que hacéis y creemos que nuestros estilos encajarían muy bien en una fecha compartida.

Queríamos proponeros un intercambio de fechas (date swap): os invitamos a tocar con nosotros en nuestra zona compartiendo escenario y taquilla, y montamos la fecha de vuelta en vuestra ciudad para sumar públicos locales y compartir gastos.

Podéis escuchar lo que hacemos en el enlace de abajo.

¿Cómo lo veis? ¿Hablamos por WhatsApp esta semana para cuadrarlo?

¡Un abrazo!
{{nombre_banda}}`,
    guidelines: "Tono de músico a músico: cercano, colega, directo y colaborativo. Sin fórmulas de IA.",
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
    body: `Hola equipo de {{nombre_sala}},

Os escribo en representación de {{nombre_banda}} ({{estilo}}) para presentar nuestra propuesta artística de cara a posibles colaboraciones, coproducciones o incorporación a vuestro catálogo de booking para 2026.

Es un proyecto con un directo muy sólido, buena respuesta en venta de entradas y una logística de producción muy eficiente y fácil de girar.

Podéis consultar el dossier corporativo con vídeos de directo y datos de gira en el enlace al pie.

Estaré encantado de hacer una breve llamada cuando os vaya bien para comentar posibles sinergias.

Un saludo,
Booking & Management — {{nombre_banda}}`,
    guidelines: "Tono profesional y directo para agencias y mánagers. Muestra solvencia técnica y atractivo comercial.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  ayuntamientos: {
    category: "ayuntamientos",
    title: "Ayuntamientos y Fiestas Patronales",
    subject: "Propuesta de concierto cultural / Fiestas patronales: {{nombre_banda}} en {{nombre_sala}}",
    body: `Estimados responsables del Área de Cultura y Festejos de {{nombre_sala}},

Nos dirigimos a ustedes desde la representación de {{nombre_banda}} ({{estilo}}) para presentar nuestra propuesta de concierto en directo de cara a la programación cultural y festejos de la próxima temporada.

Ofrecemos un espectáculo participativo y de alta energía, adecuado para todos los públicos en plazas y recintos al aire libre. Disponemos de solvencia técnica, facturación oficial y rigurosa puntualidad en producción.

Tienen a su disposición el Dossier Oficial y Rider Técnico en el enlace referenciado al pie.

Quedamos a su disposición para remitirles la propuesta presupuestaria formal.

Atentamente,
Oficina de Producción — {{nombre_banda}}`,
    guidelines: "Tono formal e institucional. Dirígete a 'ustedes', destaca facturación oficial y solvencia técnica sin perder agilidad.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  }
};

/**
 * Ensures state has categoryTemplates initialized and updated
 */
export function ensureCategoryTemplatesInState(state: any): Record<string, CategoryTemplateConfig> {
  if (!state.categoryTemplates) {
    state.categoryTemplates = JSON.parse(JSON.stringify(DEFAULT_CATEGORY_TEMPLATES));
  } else {
    // Ensure all categories exist
    for (const [catKey, defaultVal] of Object.entries(DEFAULT_CATEGORY_TEMPLATES)) {
      if (!state.categoryTemplates[catKey]) {
        state.categoryTemplates[catKey] = JSON.parse(JSON.stringify(defaultVal));
      }
    }
  }
  return state.categoryTemplates;
}
