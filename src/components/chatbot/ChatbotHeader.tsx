import { X } from 'lucide-react';
import React from 'react';
import { ChatMessage } from '../Chatbot';
import { EcoAvatar } from '../ui/EcoAvatar';

export interface ChatbotHeaderProps {
  isStitchLight: boolean;
  bandDisplayName: string;
  cleanUserName: string;
  storageKey: string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onClose?: () => void;
}

export const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({
  bandDisplayName,
  cleanUserName,
  storageKey,
  setMessages,
  onClose,
}) => {
  const handleClearChat = () => {
    const resetMessages: ChatMessage[] = [
      {
        id: 'welcome-1',
        sender: 'bot',
        text: `👋 **¡Buenas, ${cleanUserName}!** He limpiado el hilo del chat de **${bandDisplayName}**.\n\n¿En qué os puedo ayudar para organizar los conciertos de la banda, el calendario de redes o revisar los correos para las salas hoy?`,
        timestamp: new Date(),
      },
    ];
    setMessages(resetMessages);
    try {
      localStorage.setItem(storageKey, JSON.stringify(resetMessages));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className={`px-5 py-4 flex items-center justify-between border-b ${
        'bg-[var(--sunken)] '
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-1.5 rounded-[var(--r-m)] ${
            'bg-[var(--acc-soft)] text-[var(--acc)]'
          }`}
        >
          <EcoAvatar className="size-6" />
        </div>
        <div>
          <h4
            className={`text-xs font-display font-medium flex items-center gap-1.5 ${
              'text-[var(--ink)]'
            }`}
          >
            Mánager Virtual IA{' '}
            <span
              className={`w-1.5 h-1.5 rounded-[var(--r-pill)] inline-block ${
                'bg-[var(--acc)]'
              }`}
            />
          </h4>
          <span className="text-micro font-mono text-[var(--ink-2)]">{bandDisplayName.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          id="clear-chat-btn"
          onClick={handleClearChat}
          className={`text-micro font-mono transition-ui flex items-center gap-1 hover:underline cursor-pointer active:scale-[0.97] ${
            'text-[var(--ink-2)] hover:text-[var(--acc)]'
          }`}
        >
          Limpiar hilo
        </button>
        {onClose && (
          <button
            id="close-floating-chat-btn"
            onClick={onClose}
            className={`p-1.5 rounded transition-ui cursor-pointer flex items-center justify-center active:scale-[0.97] ${
              'bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
            title="Cerrar Chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
