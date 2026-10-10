/**
 * Mensajes de éxito/error de la sincronización de conciertos que muestra el calendario.
 * Lo escribe el modal de sincronización y lo lee el aviso superior, por eso vive aparte de la vista.
 */
import { useState } from "react";

/**
 * Estado de los avisos de sincronización.
 * @returns Mensajes y sus setters.
 */
export function useConcertSyncMessages() {

  const [syncSuccessMessage, setSyncSuccessMessage] = useState('');

  const [syncErrorMessage, setSyncErrorMessage] = useState('');

  return { setSyncSuccessMessage, syncSuccessMessage, syncErrorMessage, setSyncErrorMessage };
}
