/**
 * Historial del chat: persistencia por banda/usuario, scroll, autoajuste del campo y estado de carga.
 * Extraído de Chatbot.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useRef, useState } from "react";
import type { ChatMessage, RawChatMessage } from "../chatTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ChatMessagesParams {
  storageKey: string;
  ensureUniqueMessageIds: (rawMessages: RawChatMessage[]) => ChatMessage[];
  getWelcomeMessageText: (name: string, band: string) => string;
  cleanUserName: string;
  bandDisplayName: string;
  onLoadingChange: (isLoading: boolean) => void;
  generateUniqueMsgId: (prefix?: string) => string;
}

/**
 * Historial del chat: persistencia por banda/usuario, scroll, autoajuste del campo y estado de carga.
 * @param params Estado y callbacks del contenedor ({@link ChatMessagesParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useChatMessages({ storageKey, ensureUniqueMessageIds, getWelcomeMessageText, cleanUserName, bandDisplayName, onLoadingChange, generateUniqueMsgId }: ChatMessagesParams) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return ensureUniqueMessageIds(parsed);
        }
      } catch (e) {
        console.error('Error al cargar historial del chat:', e);
      }
    }
    return [
      {
        id: 'welcome-1',
        sender: 'bot',
        text: getWelcomeMessageText(cleanUserName, bandDisplayName),
        timestamp: new Date(),
      },
    ];
  });

  const [inputText, setInputText] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const onLoadingChangeRef = useRef(onLoadingChange);

  const prevLoadingRef = useRef<boolean>(isLoading);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Re-sync messages when storageKey or active band changes
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura el historial guardado al cambiar de banda/usuario
          setMessages(ensureUniqueMessageIds(parsed));
          return;
        }
      } catch (e) {
        console.error('Error re-loading chat for band:', e);
      }
    }
    setMessages([
      {
        id: generateUniqueMsgId('welcome'),
        sender: 'bot',
        text: getWelcomeMessageText(cleanUserName, bandDisplayName),
        timestamp: new Date(),
      },
    ]);
  }, [storageKey, bandDisplayName]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error('Error al guardar historial del chat:', e);
    }
  }, [messages, storageKey]);

  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
  }, [onLoadingChange]);

  useEffect(() => {
    if (prevLoadingRef.current !== isLoading) {
      prevLoadingRef.current = isLoading;
      const timer = setTimeout(() => {
        if (onLoadingChangeRef.current) {
          onLoadingChangeRef.current(isLoading);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Auto-scroll chat to bottom on mount and on message/loading updates
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    // Scroll immediately
    scrollToBottom();
    // Re-scroll after layout paint
    const timer1 = setTimeout(scrollToBottom, 80);
    const timer2 = setTimeout(scrollToBottom, 250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages.length, isLoading]);

  return { setInputText, inputText, isLoading, setMessages, setIsLoading, messages, messagesEndRef, textareaRef };
}
