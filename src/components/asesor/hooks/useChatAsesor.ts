import { useCallback, useState } from 'react';
import { MAX_MENSAJES, type Mensaje } from '../../../utils/asesor/chat';
import { preguntarAlAsesor } from '../../../utils/asesorApi';

/**
 * La conversación con el asesor, solo durante la sesión: no se guarda. Si falla, la pregunta no se
 * queda en la conversación (devuelve false y la pantalla conserva lo escrito para reintentar).
 */
export function useChatAsesor() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preguntar = useCallback(async (texto: string): Promise<boolean> => {
    const pregunta = texto.trim();
    if (!pregunta || enviando) return false;
    const conPregunta: Mensaje[] = [...mensajes, { rol: 'banda', texto: pregunta }];
    setMensajes(conPregunta);
    setEnviando(true);
    setError(null);
    try {
      const { respuesta } = await preguntarAlAsesor(conPregunta.slice(-MAX_MENSAJES));
      setMensajes([...conPregunta, { rol: 'asesor', texto: respuesta }]);
      return true;
    } catch (e) {
      setMensajes(mensajes);
      setError(e instanceof Error && e.message ? e.message : 'El asesor no ha podido responder.');
      return false;
    } finally {
      setEnviando(false);
    }
  }, [mensajes, enviando]);

  return { mensajes, enviando, error, preguntar };
}
