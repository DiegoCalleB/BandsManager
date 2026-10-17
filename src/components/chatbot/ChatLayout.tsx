/**
 * Maqueta del chat: cabecera, hilo de mensajes y entrada.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ActiveRunPanel } from "./ActiveRunPanel";
import { ChatbotHeader } from "./ChatbotHeader";
import { useChat } from "./ChatContext";
import { ChatInputForm } from "./ChatInputForm";
import { ChatLoadingIndicator } from "./ChatLoadingIndicator";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { isStitchLight } from "./chatTheme";

/**
 * Maqueta del chat: cabecera, hilo de mensajes y entrada.
 * @returns Sección de interfaz.
 */
export function ChatLayout() {
  const { isFloating, bandDisplayName, cleanUserName, storageKey, setMessages, onClose, messages, messagesEndRef } = useChat();
  return (
    <>
      <div
      className={`flex flex-col ${isFloating ? 'h-[550px]' : 'h-full min-h-[500px]'} ${'bg-[var(--surface)]'} rounded-[var(--r-l)] overflow-hidden font-sans w-full max-w-full overflow-x-hidden`}
    >
      {/* Bot Header */}
      <ChatbotHeader
      isStitchLight={isStitchLight}
      bandDisplayName={bandDisplayName}
      cleanUserName={cleanUserName}
      storageKey={storageKey}
      setMessages={setMessages}
      onClose={onClose}
      />


      {/* Messages Thread Container */}
      <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${'bg-[var(--bg)]/50'}`}>
      {messages.map((msg) => (
        <ChatMessageBubble key={msg.id} msg={msg} />
      ))}

      <ChatLoadingIndicator />

      <ActiveRunPanel />

      <div ref={messagesEndRef} />
      </div>

      <ChatInputForm />

    </div>
    </>
  );
}
