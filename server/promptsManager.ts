import fs from "fs";
import path from "path";

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
  category: string; // 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements'
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

export const DEFAULT_CATEGORY_TEMPLATES: Record<string, CategoryTemplateConfig> = {
  salas: {
    category: "salas",
    title: "Salas y Teatros de Conciertos",
    subject: "Propuesta de concierto 2026: {{nombre_banda}} en {{nombre_sala}}",
    body: `Hola equipo de booking de {{nombre_sala}},

Nos dirigimos a vosotros desde {{nombre_banda}}, proyecto independiente de música en directo ({{estilo}}).

Seguimos la programación de {{nombre_sala}} y creemos que nuestro directo encaja perfectamente con vuestra línea artística. Ofrecemos un espectáculo enérgico y profesional de directo probado en múltiples salas y escenarios.

Detalles técnicos y de producción:
- Formato adaptado y versátil.
- Material promocional, dossier y enlaces de escucha: {{website}}

Nos gustaría consultar vuestra disponibilidad de fechas para la próxima temporada y valorar propuesta de condiciones (alquiler, taquilla compartida o caché).

Quedamos a vuestra disposición. Un saludo cordial,
{{nombre_banda}} Agent Manager IA`,
    guidelines: "Tono profesional, cercano y apasionado por el directo. Enfócate en la calidad musical, la energía en vivo y la facilidad logística. Adapta el mensaje al aforo y estilo de la sala.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [
      {
        timestamp: new Date().toISOString(),
        toneRating: 5,
        contentRating: 5,
        comment: "Plantilla base genérica con marcadores de banda y estilo.",
        source: "system"
      }
    ],
    updatedAt: new Date().toISOString()
  },
  festivales: {
    category: "festivales",
    title: "Festivales de Música",
    subject: "Propuesta de contratación para cartel 2026: {{nombre_banda}} (Live Set)",
    body: `Estimada organización de {{nombre_sala}},

Escribimos en representación de {{nombre_banda}} para presentar nuestra propuesta artística ({{estilo}}) de cara a la próxima edición de vuestro festival.

{{nombre_banda}} es un proyecto de alto impacto para escenarios de festivales, destacando por una propuesta enérgica, bailable y con gran conexión con el público.

Puntos clave de la propuesta:
- Espectáculo dinámico adaptado a horarios de máxima afluencia.
- Montaje técnico limpio y adaptable a cambios rápidos de escenario.
- Dossier completo y enlaces de escucha: {{website}}

Estaríamos encantados de enviaros nuestro rider técnico y propuesta económica para vuestra consideración.

Atentamente,
{{nombre_banda}} Agent Manager IA`,
    guidelines: "Tono enérgico, enfocado al impacto en festival y grandes aforos. Destaca el ritmo, la conexión con el público y la rapidez en cambios de escenario.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  discotecas: {
    category: "discotecas",
    title: "Discotecas y Clubbing Nocturno",
    subject: "Propuesta Live Set: {{nombre_banda}} en {{nombre_sala}}",
    body: `Hola equipo de programación de {{nombre_sala}},

Os escribimos desde {{nombre_banda}} para presentar nuestro formato especial de directo ({{estilo}}), diseñado para la sesión nocturna de clubes y discotecas.

Nuestro formato integra secuencias, percusión en vivo y energía escénica, creando un puente perfecto entre la música en directo y la pista de baile en horario de madrugada.

- Formato ideal para sesiones entre DJs o como show principal de la noche.
- Escucha y vídeos en directo: {{website}}

¿Tenéis fechas disponibles para este trimestre para coordinar una sesión?

Saludos cordiales,
{{nombre_banda}} Agent Manager IA`,
    guidelines: "Tono moderno, enfocado a clubes y discotecas de noche. Resalta el formato bailable perfecto para la madrugada.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  medios: {
    category: "medios",
    title: "Medios de Comunicación, Radio y Prensa",
    subject: "[Nota de Prensa / Dossier] {{nombre_banda}} presenta su nuevo lanzamiento y gira 2026",
    body: `Hola equipo de redacción de {{nombre_sala}},

Nos ponemos en contacto desde {{nombre_banda}}, proyecto independiente de música en directo ({{estilo}}).

Les remitimos nuestro último comunicado de prensa y dossier promocional con motivo de nuestra gira de conciertos y lanzamientos 2026. Nos encantaría enviarles material en calidad broadcast para sonar en su programa/radio, o ponernos a su disposición para entrevistas, acústicos en directo o reseñas.

Dossier y videoclip oficial: {{website}}

Muchas gracias por su apoyo a la difusión de la música independiente,
{{nombre_banda}} Agent Manager IA`,
    guidelines: "Tono periodístico, profesional y directo para medios de comunicación. Dirígete al redactor, locutor o equipo de prensa. IMPORTANTE: No pidas fechas de conciertos ni taquillas.",
    toneRating: 5,
    contentRating: 5,
    customInstruction: "",
    feedbackLogs: [],
    updatedAt: new Date().toISOString()
  },
  grupos: {
    category: "grupos",
    title: "Grupos y Bandas para Intercambio de Fechas",
    subject: "Propuesta de concierto compartido e intercambio de fechas: {{nombre_banda}} x {{nombre_sala}}",
    body: `¡Buenas chavales de {{nombre_sala}}!

Os escribimos desde {{nombre_banda}}, banda de {{estilo}}. Nos mola mucho vuestro proyecto y creemos que nuestros estilos conectan genial en directo.

Queremos proponer un INTERCAMBIO DE FECHAS / CO-BOOKING para esta temporada:
1. Os invitamos a tocar con nosotros en nuestra ciudad compartiendo escenario y taquilla.
2. Vosotros nos invitáis a tocar en {{ciudad}} en vuestro espacio habitual.

Así aseguramos llenar las dos salas sumando ambos públicos y compartimos gastos de viaje y backline.

Podéis escuchar lo que hacemos aquí: {{website}}

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos llamada esta semana?

¡Un abrazo!
{{nombre_banda}} Agent Manager IA`,
    guidelines: "Tono de músico a músico: cercano, colega, directo y colaborativo. Propón claramente la estrategia de ganar-ganar (date swap), compartir público local y abaratar gastos.",
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
    body: `Estimado equipo de {{nombre_sala}},

Nos dirigimos a vuestra agencia para presentar la propuesta artística de {{nombre_banda}} ({{estilo}}) con vista a posibles colaboraciones, coproducciones o inclusión en vuestro catálogo de booking para giras y festivales 2026.

{{nombre_banda}} es un proyecto consolidado que destaca por una logística ágil, alta rentabilidad en venta de entradas y un directo arrollador probado en salas y festivales.

Dossier corporativo y enlaces: {{website}}

Estaríamos encantados de agendar una breve reunión telefónica para valorar posibles sinergias.

Atentamente,
{{nombre_banda}} Agent Manager IA`,
    guidelines: "Tono ejecutivo-musical profesional para mánagers, agencias y agentes de booking. Destaca la profesionalidad técnica, el atractivo comercial y la facilidad logística.",
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
    // Ensure all 6 categories exist
    for (const [catKey, defaultVal] of Object.entries(DEFAULT_CATEGORY_TEMPLATES)) {
      if (!state.categoryTemplates[catKey]) {
        state.categoryTemplates[catKey] = JSON.parse(JSON.stringify(defaultVal));
      }
    }
  }
  return state.categoryTemplates;
}

/**
 * Generates and writes PROMPTS_AGENTES_IA.md at workspace root
 */
export function updatePromptsMarkdownFile(categoryTemplatesMap: Record<string, CategoryTemplateConfig>, globalLeadsFeedbackSummary: string = ""): void {
  try {
    const markdownPath = path.join(process.cwd(), "PROMPTS_AGENTES_IA.md");
    
    let content = `# 🤖 MEMORIA Y DIRECCIÓN DE PROMPTS PARA AGENTES IA (BAKANDEYA)

> **Documento Central de Memoria y Aprendizaje Multiautónomo**
> Este archivo se actualiza en tiempo real cada vez que el mánager realiza ajustes, guarda plantillas o califica la redacción en la web.
> **Todos los Agentes Redactores (Python y Node.js)** deben consultar este archivo para redactar correos perfeccionados según el feedback acumulado.

---

## 🎵 Identidad Artística de Bakandeya
- **Estilo Musical**: Balkan-Ska-Reggae con Violín Solista, Percusión en Vivo y Electrónica Analógica.
- **Formato**: Cuarteto compacto (violín, sintetizadores/loops, batería/percusión, bajo/voz).
- **Regla de Oro**: **NUNCA mencionar instrumentos de viento** (trompetas, saxos, trombones) ni atribuirlos a la banda.
- **Fortalezas**: Alta energía bailable, logística ligera, montaje rápido y potente conexión en directo.

---

## 📊 Historial General de Aprendizajes y Feedback del Mánager
${globalLeadsFeedbackSummary ? globalLeadsFeedbackSummary : "Sin correcciones adicionales registradas en los contactos."}

---

## 📁 Pautas, Plantillas y Calificaciones por Categoría
`;

    for (const [key, cfg] of Object.entries(categoryTemplatesMap)) {
      const logsText = cfg.feedbackLogs && cfg.feedbackLogs.length > 0
        ? cfg.feedbackLogs.map((log, i) => {
            const toneStr = log.toneRating ? `Tono: ${log.toneRating}/5 ⭐` : "";
            const contentStr = log.contentRating ? `Contenido: ${log.contentRating}/5 ⭐` : "";
            const ratingPart = [toneStr, contentStr].filter(Boolean).join(" | ");
            return `  ${i + 1}. [${new Date(log.timestamp).toLocaleDateString()}] ${ratingPart ? `(${ratingPart})` : ""} ${log.comment || "Sin comentario"}`;
          }).join("\n")
        : "  - Sin valoraciones específicas acumuladas aún.";

      content += `
### ${cfg.title || key.toUpperCase()} (\`${key}\`)
- **Última Actualización**: ${cfg.updatedAt ? new Date(cfg.updatedAt).toLocaleString("es-ES") : "Reciente"}
- **Valoración de Tono y Estilo**: ${cfg.toneRating || 5} / 5 ⭐
- **Valoración de Contenido y Estructura**: ${cfg.contentRating || 5} / 5 ⭐
${cfg.customInstruction ? `- **Instrucción Especial Reciente del Mánager**: "${cfg.customInstruction}"\n` : ""}
#### 💡 Pautas de Redacción IA para Agentes:
\`\`\`text
${cfg.guidelines}
\`\`\`

#### ✉️ Asunto por Defecto:
\`${cfg.subject}\`

#### 📜 Cuerpo de la Plantilla Base:
\`\`\`text
${cfg.body}
\`\`\`

#### 📝 Historial de Aprendizajes de la Categoría:
${logsText}

---
`;
    }

    content += `\n*Generado automáticamente por Bakandeya Intelligence System - ${new Date().toISOString()}*\n`;

    fs.writeFileSync(markdownPath, content, "utf-8");
    console.log("Updated PROMPTS_AGENTES_IA.md successfully!");
  } catch (err) {
    console.error("Error writing PROMPTS_AGENTES_IA.md:", err);
  }
}
