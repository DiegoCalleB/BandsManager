import React from 'react';
import { Guitar, Sliders, X } from 'lucide-react';
import { ChatMessage } from '../Chatbot';

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
  isStitchLight,
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
        isStitchLight ? 'bg-slate-50 border-slate-200/80' : 'bg-[#050507]/90 border-neutral-900/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-1.5 rounded-lg border ${
            isStitchLight
              ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
          }`}
        >
          <Guitar className="w-4 h-4" />
        </div>
        <div>
          <h4
            className={`text-xs font-display font-medium tracking-widest flex items-center gap-1.5 uppercase ${
              isStitchLight ? 'text-slate-800' : 'text-neutral-100'
            }`}
          >
            Mánager Virtual AI{' '}
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse ${
                isStitchLight
                  ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.8)]'
                  : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
              }`}
            />
          </h4>
          <span className="text-[9px] font-mono text-neutral-500">
            {bandDisplayName.toUpperCase()} // SUPABASE INTEGRATION
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAdmin ? (
          <button
            type="button"
            onClick={onOpenAutonomyModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isStitchLight
                ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300 shadow-sm'
                : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-500/40 shadow-sm'
            }`}
            title="Configurar niveles de autonomía de los agentes (Solo Administradores)"
          >
            <Sliders className="w-3 h-3 text-purple-400" />
            <span>
              Autonomía: {dispatchLabel} • Min {minCache}€
            </span>
            <span className="px-1 py-0.2 text-[8px] rounded font-black bg-purple-500/40 text-purple-100 ml-0.5">
              ADMIN
            </span>
          </button>
        ) : (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border font-semibold opacity-80 ${
              isStitchLight
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
            }`}
            title="Límites de autonomía configurados (Configuración restringida a Administradores)"
          >
            <Sliders className="w-3 h-3 text-purple-400" />
            <span>
              Autonomía: {dispatchLabel} • Min {minCache}€
            </span>
          </div>
        )}

        <button
          id="clear-chat-btn"
          onClick={handleClearChat}
          className={`text-[9px] font-mono tracking-wider uppercase transition-all flex items-center gap-1 hover:underline cursor-pointer active:scale-95 ${
            isStitchLight
              ? 'text-slate-400 hover:text-indigo-600'
              : 'text-neutral-500 hover:text-cyan-400'
          }`}
        >
          Limpiar Hilo
        </button>
        {onClose && (
          <button
            id="close-floating-chat-btn"
            onClick={onClose}
            className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
              isStitchLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-800'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white'
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
