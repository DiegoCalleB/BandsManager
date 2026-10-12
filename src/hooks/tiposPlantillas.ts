/**
 * Respuestas de `/api/templates/*` que lee `useEmailTemplates` (server/routes/leads/templates.ts).
 * Aparte porque el hook ya supera las 400 líneas.
 */

/** Plantilla de email de una categoría (salas, festivales…) con sus pautas para la IA. */
export interface PlantillaEmail {
  subject?: string;
  body?: string;
  guidelines?: string;
}

/** Uso y respuesta de una plantilla, por categoría. */
export interface EstadisticaPlantilla {
  totalUses: number;
  positiveResponses: number;
  responseRate: number;
  invalidEmails: number;
  bouncedEmails: number;
}

/** Campos comunes a todas las respuestas de `/api/templates/*`. */
interface RespuestaPlantillasBase {
  success?: boolean;
  error?: string;
  message?: string;
}

/** `GET /api/templates` y `POST /api/templates/generate-all`: plantillas por categoría. */
export interface RespuestaMapaPlantillas extends RespuestaPlantillasBase {
  templates?: Record<string, PlantillaEmail>;
}

/** `POST /api/templates/optimize`. */
export interface RespuestaOptimizarPlantilla extends RespuestaPlantillasBase {
  optimized?: PlantillaEmail & { explanation?: string };
  feedbackCountUsed?: number;
}

/** `POST /api/templates/preview`: asunto y cuerpo ya rellenados. */
export interface RespuestaPreviewPlantilla extends RespuestaPlantillasBase {
  subject?: string;
  body?: string;
}

/** `GET /api/templates/stats`. */
export interface RespuestaEstadisticasPlantillas extends RespuestaPlantillasBase {
  stats?: Record<string, EstadisticaPlantilla>;
}

/** `POST /api/templates/reset`: la plantilla por defecto de la categoría. */
export interface RespuestaResetPlantilla extends RespuestaPlantillasBase {
  template?: PlantillaEmail;
}

/** `POST /api/templates/save`. */
export type RespuestaGuardarPlantilla = RespuestaPlantillasBase;
