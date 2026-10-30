import { useCallback, useState } from 'react';
import { MAX_MENSAJES, type MensajeChat } from '../../../utils/asesor/chat';
import { preguntarAlAsesor } from '../../../utils/asesorApi';

/**
 * La conversación con el asesor, solo durante la sesión: no se guarda. Cada respuesta puede traer un
 * botón (`accion`) que la banda decide si pulsa. Si falla, la pregunta no se
 * queda en la conversación (devuelve false y la pantalla conserva lo escrito para reintentar).
 */
export function useChatAsesor() {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preguntar = useCallback(async (texto: string): Promise<boolean> => {
    const pregunta = texto.trim();
    if (!pregunta || enviando) return false;
    const conPregunta: MensajeChat[] = [...mensajes, { rol: 'banda', texto: pregunta }];
    setMensajes(conPregunta);
    setEnviando(true);
    setError(null);
    try {
      // Al servidor solo viaja el texto de cada mensaje: los botones no se reenvían.
      const { respuesta, accion } = await preguntarAlAsesor(conPregunta.slice(-MAX_MENSAJES).map(({ rol, texto: t }) => ({ rol, texto: t })));
      setMensajes([...conPregunta, { rol: 'asesor', texto: respuesta, accion }]);
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
