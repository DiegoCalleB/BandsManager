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
    return "Sin historial previo de feedback. Usar tono conciso, directo, respetuoso y adecuado a la identidad y propuesta musical de la banda.";
  }

  return summary.map((log, idx) => {
    const parts = [];
    if (log.comentario) parts.push(`Indicación del mánager: "${log.comentario}"`);
    if (log.tono_rating) parts.push(`Tono: ${log.tono_rating}/5`);
    if (log.contenido_rating) parts.push(`Contenido: ${log.contenido_rating}/5`);
    return `${idx + 1}. [${log.tipo.toUpperCase()} - ${log.sala_o_medio} (${log.ciudad || 'España'})]: ${parts.join(" | ")}`;
  }).join("\n");
}

import { CLEAN_CATEGORY_TEMPLATES, type CategoryTemplateConfig } from "./utils/promptGuidelines.js";
export type { CategoryTemplateConfig };

export interface TemplateFeedbackLog {
  timestamp: string;
  toneRating?: number;
  contentRating?: number;
  comment?: string;
  source?: string; // 'manager_ui' | 'python_agent' | 'web_sandbox'
  leadName?: string;
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

export const DEFAULT_CATEGORY_TEMPLATES: Record<string, CategoryTemplateConfig> = CLEAN_CATEGORY_TEMPLATES;


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
