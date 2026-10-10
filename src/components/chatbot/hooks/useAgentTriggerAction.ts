/**
 * Lanza un agente autónomo propuesto por el asistente y registra su ejecución para monitorizarla.
 * Extraído de useChatActions.ts (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { ActiveAgentRun } from "../chatTypes";
import { Dispatch, SetStateAction } from "react";
import { Lead } from "../../../types";
import { getErrorMessage } from "../../../utils/errorMessage";
import type { ChatAutonomyConfig } from "../chatTypes";
import { ChatMessage, ProposedAction, TriggerAgentResponse } from "../chatTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AgentTriggerActionParams {
  autonomyConfig: ChatAutonomyConfig;
  updateActionStatusInMessages: (msgId: string, actionIndex: number, action: ProposedAction, status: "applied" | "dismissed") => void;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setActiveRun: Dispatch<SetStateAction<ActiveAgentRun | null>>;
  leads: Lead[];
}

/**
 * Lanza un agente autónomo propuesto por el asistente y registra su ejecución para monitorizarla.
 * @param params Estado y callbacks del contenedor ({@link AgentTriggerActionParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAgentTriggerAction({ autonomyConfig, updateActionStatusInMessages, setMessages, setActiveRun, leads }: AgentTriggerActionParams) {
  const applyAgentTrigger = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    try {
      const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token') || '';
      const pat = localStorage.getItem('bakandeya_github_pat') || '';
      const owner = localStorage.getItem('bakandeya_github_owner') || '';
      const repo = localStorage.getItem('bakandeya_github_repo') || '';
      const ref = localStorage.getItem('bakandeya_github_ref') || 'main';

      const customHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

      if (token) {
        customHeaders['Authorization'] = `Bearer ${token}`;
        customHeaders['x-auth-token'] = token;
      }
      if (pat) customHeaders['x-github-pat'] = pat;
      if (owner) customHeaders['x-github-owner'] = owner;
      if (repo) customHeaders['x-github-repo'] = repo;
      if (ref) customHeaders['x-github-ref'] = ref;

      const response = await fetch('/api/trigger-agent', {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify({
          agentName: action.agentName,
          params: {
            ...(action.params || {}),
            autonomyConfig,
          },
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: TriggerAgentResponse | null = null;

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        const rawText = await response.text().catch(() => '');
        try {
          data = JSON.parse(rawText);
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        const errorText = data?.error || data?.message || `Error del servidor (${response.status}): Fallo al disparar el agente.`;
        throw new Error(errorText);
      }

      if (!data) {
        data = {
          success: true,
          message: `Agente '${action.agentName}' ejecutado con éxito en Supabase.`,
        };
      }

      if (data.detectedRef) {
        localStorage.setItem('bakandeya_github_ref', data.detectedRef);
        window.dispatchEvent(new Event('github-ref-updated'));
      }

      updateActionStatusInMessages(msgId, actionIndex, action, 'applied');

      const isSim = data.simulated;
      const successMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'bot',
        text: isSim
          ? `⚙️ **Simulación del Agente '${action.agentName}':**\n\n${data.message || 'Ejecución completada.'}`
          : `🚀 **Agente '${action.agentName}' Iniciado:**\n\n${data.message || 'Ejecución completada.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMsg]);

      const targetRegion = action.params?.ciudad || action.params?.region || 'Huelva';

      if (isSim) {
        setActiveRun({
          id: 999,
          status: 'in_progress',
          conclusion: null,
          agentName: action.agentName,
          region: targetRegion,
          params: action.params,
          triggeredAt: Date.now(),
          steps: [
            { name: 'Configurar entorno', status: 'completed', conclusion: 'success', number: 1 },
            { name: 'Verificar repositorio', status: 'completed', conclusion: 'success', number: 2 },
            { name: 'Instalar dependencias', status: 'completed', conclusion: 'success', number: 3 },
            { name: `Ejecutar Agente de Supabase '${action.agentName}'`, status: 'in_progress', conclusion: null, number: 4 },
          ],
          isDemo: true,
          initialLeadIds: leads.map((l) => l.id),
        });
      } else {
        setActiveRun({
          id: null,
          status: 'completed',
          conclusion: 'success',
          agentName: action.agentName,
          region: targetRegion,
          params: action.params,
          triggeredAt: Date.now(),
          steps: [
            { name: 'Conectar con Supabase', status: 'completed', conclusion: 'success', number: 1 },
            { name: `Ejecutar Agente '${action.agentName}' en Supabase`, status: 'completed', conclusion: 'success', number: 2 },
            { name: 'Actualizar base de datos y auditoría', status: 'completed', conclusion: 'success', number: 3 },
          ],
          isDemo: false,
          initialLeadIds: leads.map((l) => l.id),
        });
      }
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `sys-err-${Date.now()}`,
        sender: 'bot',
        text: `❌ **Error al ejecutar el agente:** ${getErrorMessage(err, 'No se pudo contactar con el backend de Supabase.')}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return { applyAgentTrigger };
}
