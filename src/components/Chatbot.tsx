/**
 * Chat del asistente de la banda: conversa, propone acciones y lanza agentes con aprobación humana.
 * Orquesta controlador, contexto y maqueta; la lógica vive en `chatbot/` (AGENTS.md §5.6).
 */
import { ChatLayout } from "./chatbot/ChatLayout";
import { ChatProvider } from "./chatbot/ChatProvider";
import type { ChatMessage, ChatbotProps, ProposedAction } from "./chatbot/chatTypes";
import { useChatController } from "./chatbot/hooks/useChatController";

export type { ChatMessage,ProposedAction };

/**
 * Asistente conversacional de BandManager.
 * @param props Datos de la banda, callbacks de edición y opciones de presentación.
 * @returns El chat completo con su contexto.
 */
export default function Chatbot(props: ChatbotProps) {
  const controller = useChatController({
    userRole: props.userRole,
    currentUser: props.currentUser,
    activeBandName: props.activeBandName,
    onLoadingChange: props.onLoadingChange,
    leads: props.leads,
    onUpdateLead: props.onUpdateLead,
    onAddConcert: props.onAddConcert,
    onAddRehearsal: props.onAddRehearsal,
    onCreateLead: props.onCreateLead,
    onNavigate: props.onNavigate,
  });

  return (
    <ChatProvider value={{ ...controller, ...props }}>
      <ChatLayout />
    </ChatProvider>
  );
}
