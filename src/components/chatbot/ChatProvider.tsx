import type { ReactNode } from 'react';
import { ChatContext, type ChatContextValue } from './ChatContext';

/**
 * Proveedor del contexto del chat.
 * @param props.value Valor completo (controlador + props del chat).
 */
export function ChatProvider({ value, children }: { value: ChatContextValue; children: ReactNode }) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
