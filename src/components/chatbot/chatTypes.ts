/**
 * Contratos del chat del asistente: acciones propuestas y mensajes.
 * Viven fuera del componente para que hooks, vistas y la cabecera los compartan sin dependencias circulares.
 */
import type { Concert, DrumPatternStyle, EPKConfig, Lead, MelodicInstrument, MelodicNoteEvent, Rehearsal, SongAudioIdea, ThemeColors, User as UserType } from "../../types";
import type { AgentAutonomyConfig } from "../dashboard/agent_autonomy/autonomyTypes";

/** Parámetros con los que se lanza un agente (región/tipo de sala); admite campos extra del agente. */
export interface AgentRunParams {
  ciudad?: string;
  region?: string;
  tipo?: string;
  [key: string]: unknown;
}

/** Paso de un workflow de GitHub Actions que ejecuta un agente. */
export interface AgentRunStep {
  name: string;
  status: string;
  conclusion: string | null;
  number?: number;
}

/** Ejecución de agente que el chat monitoriza (real de GitHub Actions o simulada). */
export interface ActiveAgentRun {
  id: number | null;
  status: 'queued' | 'in_progress' | 'completed' | 'unknown' | 'fetching' | 'error';
  conclusion: string | null;
  agentName: string;
  triggeredAt: number;
  steps: AgentRunStep[];
  isDemo: boolean;
  initialLeadIds?: string[];
  region?: string;
  params?: AgentRunParams;
}

/** Ejecución tal y como la devuelve `/api/agent-runs`. */
export interface RemoteAgentRun {
  id: number;
  status: ActiveAgentRun['status'];
  conclusion: string | null;
  created_at: string;
}

export interface ProposedAction {
  status?: 'pending' | 'applied' | 'dismissed';
  type:
    | 'propose_lead_approval'
    | 'propose_rehearsal'
    | 'propose_status_change'
    | 'propose_agent_trigger'
    | 'propose_concert'
    | 'propose_add_concert'
    | 'propose_band'
    | 'propose_tour'
    | 'propose_update_logo'
    | 'propose_send_email'
    | 'propose_draft_email'
    | 'propose_add_lead'
    | 'propose_update_lead'
    | 'propose_accompaniment'
    | 'propose_melodic_idea';
  leadId?: string;
  bandId?: string;
  targetType?: 'lead' | 'band';
  targetName?: string;
  leadName?: string;
  description: string;
  newStatus?: string;
  agentName?: string;
  params?: AgentRunParams;
  concert?: Partial<Concert>;
  rehearsal?: Partial<Rehearsal>;
  band?: Record<string, unknown>;
  tour?: Record<string, unknown>;
  imagen_url?: string;
  icono?: string;
  subject?: string;
  body?: string;
  senderName?: string;
  attachDossier?: boolean;
  incluirFirmaRedes?: boolean;
  lead?: Partial<Lead> & { festivalStartDate?: string; festivalEndDate?: string };
  updatedFields?: Partial<Lead>;
  accompaniment?: {
    bpm: number;
    keyName: string;
    drumPattern: DrumPatternStyle;
    includeDrums: boolean;
    includeBass: boolean;
    durationSecs: number;
    songId?: string;
    songTitle?: string;
  };
  melodicIdea?: {
    instrument: MelodicInstrument;
    bpm: number;
    keyName: string;
    escala?: 'mayor' | 'menor';
    durationSecs: number;
    seccion?: SongAudioIdea['seccion'];
    songId?: string;
    songTitle?: string;
    eventos: MelodicNoteEvent[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  proposedActions?: ProposedAction[];
  actionStatus?: 'pending' | 'applied' | 'dismissed';
}

/** Props públicas del chat del asistente. */
export interface ChatbotProps {
  key?: string;
  colors: ThemeColors;
  leads: Lead[];
  rehearsals: Rehearsal[];
  concerts: Concert[];
  epkConfig?: Partial<EPKConfig>;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  onCreateLead?: (lead: Lead) => Promise<Lead | undefined | void> | Lead | undefined | void;
  onAddRehearsal: (rehearsal: Rehearsal) => void;
  onAddConcert?: (concert: Concert) => void;
  onNavigate?: (view: string, options?: Record<string, unknown>) => void;
  isFloating?: boolean;
  onClose?: () => void;
  userRole?: string;
  currentUser?: UserType | null;
  activeBandName?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

/** Resultado por lead de `/api/trigger-agent` (enviador/redactor). */
export interface TriggerAgentResult {
  id: string;
  error?: string;
  status?: string;
  estado_nuevo?: string;
  fecha_envio?: string;
}

/** Respuesta de `/api/trigger-agent`. */
export interface TriggerAgentResponse {
  success?: boolean;
  error?: string;
  message?: string;
  detectedRef?: string;
  simulated?: boolean;
  results?: TriggerAgentResult[];
}

/** Configuración de autonomía tal y como la lee el chat (puede venir incompleta de localStorage/API). */
export type ChatAutonomyConfig = Partial<AgentAutonomyConfig>;

/** Mensaje tal y como se guarda en localStorage: la fecha viaja serializada y faltan campos en versiones antiguas. */
export interface RawChatMessage extends Omit<ChatMessage, "timestamp" | "id"> {
  id?: string;
  timestamp?: string | number | Date;
}
