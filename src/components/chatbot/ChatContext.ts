/**
 * Contexto del chat del asistente: reparte el estado y las acciones del controlador a las vistas.
 * Existe para que cada vista lea solo lo que usa, sin encadenar decenas de props desde el contenedor.
 */
import { createContext, useContext } from 'react';
import type { ChatbotProps } from './chatTypes';
import type { useChatController } from './hooks/useChatController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type ChatController = ReturnType<typeof useChatController>;

/** Valor del contexto: controlador + props del chat. */
export type ChatContextValue = ChatController & Omit<ChatbotProps, 'key'>;

export const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * Lee el contexto del chat.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link ChatProvider} (error de programación, falla rápido).
 */
export function useChat(): ChatContextValue {
  const value = useContext(ChatContext);
  if (!value) throw new Error('useChat debe usarse dentro de <ChatProvider>');
  return value;
}
