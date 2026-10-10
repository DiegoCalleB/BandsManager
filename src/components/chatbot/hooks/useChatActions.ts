/**
 * Confirma, descarta y ejecuta las acciones propuestas por el asistente (leads, conciertos, ensayos, agentes).
 * Extraído de Chatbot.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { ActiveAgentRun } from "../chatTypes";
import React, { Dispatch, FormEvent, SetStateAction } from "react";
import type { User } from "../../../types";
import { Concert, Lead, Rehearsal } from "../../../types";
import type { ChatAutonomyConfig, ChatMessage, ProposedAction } from "../chatTypes";
import { useAgentTriggerAction } from "./useAgentTriggerAction";
import { useEntityActions } from "./useEntityActions";
import { useLeadEmailActions } from "./useLeadEmailActions";


/** Dependencias que el componente contenedor inyecta al hook. */
export interface ChatActionsParams {
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  leads: Lead[];
  autonomyConfig: ChatAutonomyConfig;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  currentUser: User;
  onAddConcert: (concert: Concert) => void;
  onAddRehearsal: (rehearsal: Rehearsal) => void;
  onCreateLead?: (lead: Lead) => Promise<Lead | undefined | void> | Lead | undefined | void;
  onNavigate?: (view: string, options?: Record<string, unknown>) => void;
  setActiveRun: Dispatch<SetStateAction<ActiveAgentRun | null>>;
  inputText: string;
  isLoading: boolean;
  handleSendMessage: (e: FormEvent | React.KeyboardEvent) => Promise<void>;
}

/**
 * Confirma, descarta y ejecuta las acciones propuestas por el asistente (leads, conciertos, ensayos, agentes).
 * @param params Estado y callbacks del contenedor ({@link ChatActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useChatActions({ setMessages, leads, autonomyConfig, onUpdateLead, currentUser, onAddConcert, onAddRehearsal, onCreateLead, onNavigate, setActiveRun, inputText, isLoading, handleSendMessage }: ChatActionsParams) {
  const updateActionStatusInMessages = (msgId: string, actionIndex: number, action: ProposedAction, status: 'applied' | 'dismissed') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const currentActions = m.proposedActions ? [...m.proposedActions] : [];
          let targetIdx = actionIndex;
          if (targetIdx < 0 || targetIdx >= currentActions.length || !currentActions[targetIdx]) {
            targetIdx = currentActions.findIndex(
              (a) =>
                (action.leadId && a.leadId === action.leadId) || (a.description && a.description === action.description) || a === action
            );
          }
          if (targetIdx !== -1 && currentActions[targetIdx]) {
            currentActions[targetIdx] = {
              ...currentActions[targetIdx],
              status,
            };
          }
          const nonTriggers = currentActions.filter((a) => a.type !== 'propose_agent_trigger');
          const allResolved = nonTriggers.length === 0 || nonTriggers.every((a) => a.status === 'applied' || a.status === 'dismissed');
          return {
            ...m,
            proposedActions: currentActions,
            actionStatus: allResolved ? status : 'pending',
          };
        }
        return m;
      })
    );
  };

  const { applyLeadApproval, applyDraftEmail, applySendEmail } = useLeadEmailActions({ leads, autonomyConfig, onUpdateLead, setMessages });

  const { applyStatusChange, applyBand, applyConcert, applyRehearsal, applyTour, applyLogoUpdate, applyAddLead, applyUpdateLead } = useEntityActions({ leads, onUpdateLead, updateActionStatusInMessages, setMessages, currentUser, onAddConcert, onAddRehearsal, onCreateLead, onNavigate });

  const { applyAgentTrigger } = useAgentTriggerAction({ autonomyConfig, updateActionStatusInMessages, setMessages, setActiveRun, leads });

  async function handleConfirmAllActions(msgId: string, actions: ProposedAction[]) {
    const pendingItems = actions
      .map((act, idx) => ({ act, idx }))
      .filter(
        (item) =>
          item.act.type !== 'propose_agent_trigger' &&
          item.act.type !== 'propose_accompaniment' &&
          item.act.type !== 'propose_melodic_idea' &&
          (item.act.status || 'pending') === 'pending'
      );

    for (const item of pendingItems) {
      await handleConfirmAction(msgId, item.idx, item.act);
    }
    try {
      window.dispatchEvent(new CustomEvent('app-data-updated'));
    } catch {
      // Ignorado a propósito: es un efecto secundario opcional (evento de actualización, dictado o limpieza).
    }
  }

  async function handleConfirmAction(msgId: string, actionIndex: number, action: ProposedAction) {
    // 1. Apply changes
    if (action.type === 'propose_lead_approval') await applyLeadApproval(msgId, actionIndex, action);
    else if (action.type === 'propose_status_change') await applyStatusChange(msgId, actionIndex, action);
    else if (action.type === 'propose_band' || action.band) await applyBand(msgId, actionIndex, action);
    else if (action.type === 'propose_concert' || action.type === 'propose_add_concert' || action.concert) await applyConcert(msgId, actionIndex, action);
    else if (action.type === 'propose_rehearsal' || action.rehearsal) await applyRehearsal(msgId, actionIndex, action);
    else if (action.type === 'propose_tour' || action.tour) await applyTour(msgId, actionIndex, action);
    else if (action.type === 'propose_update_logo') await applyLogoUpdate(msgId, actionIndex, action);
    else if (action.type === 'propose_add_lead' || action.lead) await applyAddLead(msgId, actionIndex, action);
    else if (action.type === 'propose_update_lead' && action.leadId) await applyUpdateLead(msgId, actionIndex, action);
    else if (action.type === 'propose_draft_email' && action.leadId) await applyDraftEmail(msgId, actionIndex, action);
    else if (action.type === 'propose_send_email' && action.leadId) await applySendEmail(msgId, actionIndex, action);
    else if (action.type === 'propose_agent_trigger' && action.agentName) await applyAgentTrigger(msgId, actionIndex, action);
    try {
      window.dispatchEvent(new CustomEvent('app-data-updated'));
    } catch {
      // Ignorado a propósito: es un efecto secundario opcional (evento de actualización, dictado o limpieza).
    }
  }

  const handleDismissAction = (msgId: string, actionIndex?: number, action?: ProposedAction) => {
    if (typeof actionIndex === 'number' && action) {
      updateActionStatusInMessages(msgId, actionIndex, action, 'dismissed');
    } else {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            const currentActions = (m.proposedActions || []).map((a) => ({ ...a, status: 'dismissed' as const }));
            return { ...m, proposedActions: currentActions, actionStatus: 'dismissed' };
          }
          return m;
        })
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim() && !isLoading) {
        handleSendMessage(e);
      }
    }
  };

  return { handleConfirmAllActions, handleConfirmAction, handleDismissAction, handleKeyDown };
}
