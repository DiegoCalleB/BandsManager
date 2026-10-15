/**
 * Formulario de entrada: texto, dictado por voz y envío.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Mic, Send } from "lucide-react";
import { Button, Textarea } from "../ui";
import { useChat } from "./ChatContext";

/**
 * Formulario de entrada: texto, dictado por voz y envío.
 * @returns Sección de interfaz.
 */
export function ChatInputForm() {
  const { handleSendMessage, textareaRef, inputText, setInputText, handleKeyDown, isListening, handleToggleMic, speechSupported, isLoading } = useChat();
  return (
    <>
      {/* Input Message Form Footer */}
      <form onSubmit={handleSendMessage} className={`p-3 flex gap-2 items-end ${'bg-[var(--bg)]'}`}>
      <Textarea
        id="chatbot-text-input"
        ref={textareaRef}
        rows={1}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
        className="flex-1 max-h-28 min-h-[38px]"
      />
      <Button
        variant={isListening ? "danger" : "neutral"}
        id="chatbot-mic-btn"
        type="button"
        onClick={handleToggleMic}
        disabled={!speechSupported}
        title={
          speechSupported
            ? isListening
              ? 'Detener dictado por voz'
              : 'Dar instrucciones por voz'
            : 'Tu navegador no soporta dictado por voz'
        }
        className="items-center justify-center shrink-0 mb-0.5"
      >
        <Mic className="w-4 h-4" />
      </Button>
      <Button variant={inputText.trim() ? "inverse" : "neutral"} aria-label="Enviar"
        id="chatbot-send-btn"
        type="submit"
        disabled={!inputText.trim() || isLoading}
        className="items-center justify-center shrink-0 mb-0.5"
      >
        <Send className={`w-4 h-4 ${inputText.trim() ? 'text-[var(--ink)]' : 'text-[var(--ink-2)]'}`} />
      </Button>
      </form>
    </>
  );
}
