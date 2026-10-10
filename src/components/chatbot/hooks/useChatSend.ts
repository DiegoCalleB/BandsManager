/**
 * Envía el mensaje del usuario al asistente y encadena la respuesta con sus acciones propuestas.
 * Extraído de Chatbot.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction } from "react";
import type { User } from "../../../types";
import type { ChatAutonomyConfig, ChatMessage, ProposedAction } from "../chatTypes";


/** Dependencias que el componente contenedor inyecta al hook. */
export interface ChatSendParams {
  inputText: string;
  isLoading: boolean;
  setInputText: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  currentUser: User;
  userRole: string;
  messages: ChatMessage[];
  agentsEnabled: boolean;
  autonomyConfig: ChatAutonomyConfig;
}

/**
 * Envía el mensaje del usuario al asistente y encadena la respuesta con sus acciones propuestas.
 * @param params Estado y callbacks del contenedor ({@link ChatSendParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useChatSend({ inputText, isLoading, setInputText, setMessages, setIsLoading, currentUser, userRole, messages, agentsEnabled, autonomyConfig }: ChatSendParams) {
  const handleSendMessage = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsgText = inputText;
    setInputText('');

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('bakandeya_token');
      const activeBandId = currentUser?.band_id || '';
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-role': userRole || '',
          'x-band-id': activeBandId,
        },
        body: JSON.stringify({
          message: userMsgText,
          chatHistory: messages.slice(-8).map((m) => ({ sender: m.sender, text: m.text })),
          userRole: userRole || 'member',
          agentsEnabled: agentsEnabled,
          band_id: activeBandId,
          autonomyConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Response error from server');
      }

      const data = await response.json();

      const rawActions: ProposedAction[] = data.proposedActions || [];
      const processedActions: ProposedAction[] = rawActions.map((a) => ({
        ...a,
        status: a.status || 'pending',
      }));

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.text || 'He recibido los datos correctamente.',
        timestamp: new Date(),
        proposedActions: processedActions,
        actionStatus: processedActions.length > 0 ? 'pending' : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: '**Error de Conexión:** Ha habido un problema conectando con el servicio de Inteligencia Artificial. Por favor, inténtalo de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSendMessage };
}
