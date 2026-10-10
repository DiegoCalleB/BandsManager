/**
 * Dictado por voz con la Web Speech API.
 * Extraído de Chatbot.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

/** Subconjunto de la Web Speech API que usa el dictado (no está en lib.dom de TypeScript). */
interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Devuelve el constructor de reconocimiento de voz del navegador (estándar o con prefijo webkit), si existe. */
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

/** Dependencias que el componente contenedor inyecta al hook. */
export interface VoiceInputParams {
  setInputText: Dispatch<SetStateAction<string>>;
}

/**
 * Dictado por voz con la Web Speech API.
 * @param params Estado y callbacks del contenedor ({@link VoiceInputParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useVoiceInput({ setInputText }: VoiceInputParams) {
  // Dictado por voz (Web Speech API) para poder dar instrucciones al chatbot hablando
  // en vez de escribir. No hay backend/servidor implicado: el reconocimiento corre en el
  // propio navegador y solo escribe el texto transcrito en el input existente.
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [isListening, setIsListening] = useState(false);

  const speechSupported = typeof window !== 'undefined' && !!getSpeechRecognitionCtor();

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // Ignorado a propósito: es un efecto secundario opcional (evento de actualización, dictado o limpieza).
        }
      }
    };
  }, []);

  const handleToggleMic = () => {
    if (!speechSupported) return;

    if (isListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      speechRecognitionRef.current = null;
    };
    recognition.onresult = (event: SpeechResultEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();
      if (!transcript) return;
      setInputText((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  return { isListening, handleToggleMic, speechSupported };
}
