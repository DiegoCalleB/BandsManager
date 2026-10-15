/**
 * Compone los hooks del chat (identidad, mensajes, voz, agentes, audio, formato, envío y acciones).
 * Extraído de Chatbot.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { User } from "../../../types";
import { parseMarkdown } from "../chatFormatting";
import { useAgentRuns } from "./useAgentRuns";
import { useChatActions } from "./useChatActions";
import { useChatAudioGeneration } from "./useChatAudioGeneration";
import { useChatIdentity } from "./useChatIdentity";
import { useChatMessages } from "./useChatMessages";
import { useChatSend } from "./useChatSend";
import { useVoiceInput } from "./useVoiceInput";

import { Concert, Lead, Rehearsal } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ChatControllerParams {
  userRole: string;
  currentUser: User;
  activeBandName: string;
  onLoadingChange: (isLoading: boolean) => void;
  leads: Lead[];
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  onAddConcert: (concert: Concert) => void;
  onAddRehearsal: (rehearsal: Rehearsal) => void;
  onCreateLead?: (lead: Lead) => Promise<Lead | undefined | void> | Lead | undefined | void;
  onNavigate?: (view: string, options?: Record<string, unknown>) => void;
}

/**
 * Compone los hooks del chat (identidad, mensajes, voz, agentes, audio, formato, envío y acciones).
 * @param params Estado y callbacks del contenedor ({@link ChatControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useChatController({ userRole, currentUser, activeBandName, onLoadingChange, leads, onUpdateLead, onAddConcert, onAddRehearsal, onCreateLead, onNavigate }: ChatControllerParams) {
  const { storageKey, ensureUniqueMessageIds, getWelcomeMessageText, cleanUserName, bandDisplayName, generateUniqueMsgId, isAdmin } = useChatIdentity({ userRole, currentUser, activeBandName });

  const { setInputText, inputText, isLoading, setMessages, setIsLoading, messages, messagesEndRef, textareaRef } = useChatMessages({ storageKey, ensureUniqueMessageIds, getWelcomeMessageText, cleanUserName, bandDisplayName, onLoadingChange, generateUniqueMsgId });

  const { isListening, handleToggleMic, speechSupported } = useVoiceInput({ setInputText });

  const { agentsEnabled, autonomyConfig, setActiveRun, setIsAutonomyModalOpen, setAgentsEnabled, activeRun, isAutonomyModalOpen } = useAgentRuns();

  const { accompanimentAudio, songPicker, setSongPicker, handleSaveAccompanimentToSong, handleGenerateAccompanimentAudio, melodicIdeaAudio, handleDownloadMelodicIdeaMidi, handleSaveMelodicIdeaToSong, handleGenerateMelodicIdeaAudio } = useChatAudioGeneration({ currentUser, cleanUserName });


  const { handleSendMessage } = useChatSend({ inputText, isLoading, setInputText, setMessages, setIsLoading, currentUser, userRole, messages, agentsEnabled, autonomyConfig });

  const { handleConfirmAllActions, handleConfirmAction, handleDismissAction, handleKeyDown } = useChatActions({ setMessages, leads, autonomyConfig, onUpdateLead, currentUser, onAddConcert, onAddRehearsal, onCreateLead, onNavigate, setActiveRun, inputText, isLoading, handleSendMessage });

  return { bandDisplayName, isAdmin, setIsAutonomyModalOpen, autonomyConfig, cleanUserName, storageKey, setMessages, agentsEnabled, setAgentsEnabled, messages, parseMarkdown, handleConfirmAllActions, accompanimentAudio, songPicker, setSongPicker, handleSaveAccompanimentToSong, handleGenerateAccompanimentAudio, melodicIdeaAudio, handleDownloadMelodicIdeaMidi, handleSaveMelodicIdeaToSong, handleGenerateMelodicIdeaAudio, handleConfirmAction, handleDismissAction, isLoading, activeRun, setActiveRun, messagesEndRef, handleSendMessage, textareaRef, inputText, setInputText, handleKeyDown, isListening, handleToggleMic, speechSupported, isAutonomyModalOpen };
}
