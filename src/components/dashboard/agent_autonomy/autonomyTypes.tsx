/**
 * Tipos y constantes de la configuración de autonomía de los agentes (zonas horarias, días, horas, niveles).
 * Viven fuera del modal para que hooks y vistas los compartan; el modal reexporta los públicos.
 */

export interface LearnedRuleBucket {
  reglas_estilo_aprendidas?: string[];
  reglas_manuales?: string[];
  vocabulario_aprendido?: string[];
  terminos_a_evitar?: string[];
}

export type DispatchAutonomyLevel =
  | "draft_only"
  | "scheduled_window"
  | "autonomous_first_contact";
export type NegotiationDepthLevel =
  | "outreach_only"
  | "filter_conditions"
  | "advanced_negotiation";

export interface AgentAutonomyConfig {
  dispatchLevel: DispatchAutonomyLevel;
  negotiationDepth: NegotiationDepthLevel;
  minCacheByType?: {
    salas?: number;
    festivales?: number;
    discotecas?: number;
    ayuntamientos?: number;
    medios?: number;
    grupos?: number;
  };
  // Caché de inicio de negociación (opcional): si la sala pregunta directamente por el caché,
  // el agente responde con esta cifra en vez del mínimo real, dejando margen para negociar.
  negotiationStartCacheByType?: {
    salas?: number;
    festivales?: number;
    discotecas?: number;
    ayuntamientos?: number;
    medios?: number;
    grupos?: number;
  };
  autoDeclineUnderMinCache: boolean;
  notifyOnEveryProposal: boolean;
  requireHumanForFinalSignOff: boolean;
  agentSenderEmail?: string;
  agentSenderName?: string;
  agentReplyToEmail?: string;
  dispatchMode?: "draft_gmail" | "direct_send";
  markAsReadInInbox?: boolean;
}


export const TIMEZONES = [
  {
    value: "Europe/Madrid",
    label: "Europe/Madrid (Madrid, Barcelona, París) [UTC+1/UTC+2]",
  },
  {
    value: "America/Mexico_City",
    label: "America/Mexico_City (Ciudad de México) [UTC-6]",
  },
  {
    value: "America/Bogota",
    label: "America/Bogota (Bogotá, Lima, Quito) [UTC-5]",
  },
  {
    value: "America/Argentina/Buenos_Aires",
    label: "America/Argentina/Buenos_Aires (Buenos Aires) [UTC-3]",
  },
  {
    value: "America/Santiago",
    label: "America/Santiago (Santiago de Chile) [UTC-3/UTC-4]",
  },
  {
    value: "America/New_York",
    label: "America/New_York (Nueva York, Miami) [UTC-5/UTC-4]",
  },
  {
    value: "Europe/London",
    label: "Europe/London (Londres, Dublín, Lisboa) [UTC+0/UTC+1]",
  },
];

export const DAYS_OF_WEEK = [
  {
    id: 1,
    name: "Lunes",
    short: "Lun",
    initial: "L",
    description: "Planificación semanal de salas",
    recommended: false,
  },
  {
    id: 2,
    name: "Martes",
    short: "Mar",
    initial: "M",
    description: "Día Top (+45% respuestas)",
    recommended: true,
    badge: "Top Booking",
  },
  {
    id: 3,
    name: "Miércoles",
    short: "Mié",
    initial: "X",
    description: "Día Top (Máxima atención de programadores)",
    recommended: true,
    badge: "Top Booking",
  },
  {
    id: 4,
    name: "Jueves",
    short: "Jue",
    initial: "J",
    description: "Día Top (Cierre de fechas y agenda)",
    recommended: true,
    badge: "Top Booking",
  },
  {
    id: 5,
    name: "Viernes",
    short: "Vie",
    initial: "V",
    description: "Moderado (Salas en producción de directos)",
    recommended: false,
  },
  {
    id: 6,
    name: "Sábado",
    short: "Sáb",
    initial: "S",
    description: "Bajo (Conciertos en vivo)",
    recommended: false,
  },
  {
    id: 7,
    name: "Domingo",
    short: "Dom",
    initial: "D",
    description: "Bajo (Descanso y cierre)",
    recommended: false,
  },
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i);


export const RESPONSE_LEARNED_CATEGORY_LABELS: Record<string, string> = {
  salas: "🏛️ Salas",
  festivales: "🎪 Festivales",
  discotecas: "🪩 Discotecas",
  medios: "📻 Medios",
  grupos: "🎸 Grupos",
  managements: "💼 Managements",
  ayuntamientos: "🎉 Ayuntamientos",
};

/** Lead/sala afectado por una ejecución de agente registrada en la auditoría. */
export interface AuditLeadItem {
  id?: string | number;
  nombre_sala?: string;
  email_contacto?: string;
  estado_anterior?: string;
  estado_nuevo?: string;
}

/** Entrada del registro de auditoría de agentes (`/api/agent-logs`). */
export interface AuditLogEntry {
  id?: string | number;
  created_at: string;
  agente?: string;
  motor?: string;
  disparado_por_tipo?: string;
  usuario_id?: string;
  usuario_email?: string;
  estado?: string;
  mensaje?: string;
  conteo_afectados?: number;
  duracion_ms?: number;
  leads_afectados?: AuditLeadItem[];
}
