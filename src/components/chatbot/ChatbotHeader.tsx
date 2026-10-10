import { Guitar, Sliders, X } from 'lucide-react';
import React from 'react';
import { ChatMessage } from '../Chatbot';
import { Button } from '../ui';

export interface ChatbotHeaderProps {
  isStitchLight: boolean;
  bandDisplayName: string;
  isAdmin: boolean;
  onOpenAutonomyModal: () => void;
  autonomyConfig: {
    dispatchLevel?: string;
    minCacheThreshold?: number;
  };
  cleanUserName: string;
  storageKey: string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onClose?: () => void;
}

export const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({
  bandDisplayName,
  isAdmin,
  onOpenAutonomyModal,
  autonomyConfig,
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

  const dispatchLabel =
    autonomyConfig.dispatchLevel === 'draft_only'
      ? 'Borrador'
      : autonomyConfig.dispatchLevel === 'scheduled_window'
        ? 'Ventana 3h'
        : 'Auto 1er Contacto';
  const minCache = autonomyConfig.minCacheThreshold || 300;

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
          <Guitar className="w-4 h-4" />
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
          <span className="text-micro font-mono text-[var(--ink-2)]">{bandDisplayName.toUpperCase()} // SUPABASE INTEGRATION</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAdmin ? (
          <Button
            variant="neutral"
            size="xs"
            type="button"
            onClick={onOpenAutonomyModal}
            className="hidden items-center gap-1.5"
            title="Configurar niveles de autonomía de los agentes (solo administradores)"
          >
            <Sliders className="w-3 h-3 text-[var(--acc)]" />
            <span>
              Autonomía: {dispatchLabel} • Min {minCache}€
            </span>
            <span className="px-1 py-0.2 text-micro rounded font-bold bg-[var(--acc)]/40 text-[var(--ink)] ml-0.5">ADMIN</span>
          </Button>
        ) : (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-mono font-semibold opacity-80 ${
              'bg-[var(--acc-soft)] text-[var(--acc)] '
            }`}
            title="Límites de autonomía configurados (Configuración restringida a Administradores)"
          >
            <Sliders className="w-3 h-3 text-[var(--acc)]" />
            <span>
              Autonomía: {dispatchLabel} • Min {minCache}€
            </span>
          </div>
        )}

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
