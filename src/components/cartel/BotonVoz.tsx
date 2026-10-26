import React, { useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { IconButton } from '../ui';
import { cn } from '../../utils/cn';
import { useVoiceInput } from '../chatbot/hooks/useVoiceInput';

/**
 * Dictado de un campo de la idea del cartel: la persona habla y el texto se añade al final de lo que ya hay.
 * Usa el reconocimiento de voz del propio navegador (nada sale a ningún servidor); si no existe, no se pinta.
 */
export function BotonVoz({ valor, maximo, onTexto, etiqueta }: { valor: string; maximo: number; onTexto: (texto: string) => void; etiqueta: string }) {
  // El reconocimiento se crea al pulsar y vive varios segundos: lee siempre el valor más reciente.
  const actual = useRef(valor);
  useEffect(() => {
    actual.current = valor;
  }, [valor]);
  const { isListening, handleToggleMic, speechSupported } = useVoiceInput({
    setInputText: (siguiente) => onTexto((typeof siguiente === 'function' ? siguiente(actual.current) : siguiente).slice(0, maximo)),
  });
  if (!speechSupported) return null;
  return (
    <IconButton
      label={isListening ? 'Parar el dictado' : etiqueta}
      size="icon-xs"
      variant="raised"
      aria-pressed={isListening}
      className={cn('absolute bottom-1.5 right-1.5', isListening && 'animate-pulse')}
      onClick={handleToggleMic}
    >
      {isListening ? <Square className="size-3" aria-hidden /> : <Mic className="size-3.5" aria-hidden />}
    </IconButton>
  );
}
