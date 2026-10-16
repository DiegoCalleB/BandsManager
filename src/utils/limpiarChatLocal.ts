/** Prefijo con el que `Chatbot` guarda la conversación en `localStorage` (una clave por usuario y banda). */
export const PREFIJO_CHAT_LOCAL = 'bandmanager_chat_messages_';

/** Borra del navegador todas las conversaciones del asistente; se llama al cerrar sesión. */
export function limpiarChatLocal(almacen: Storage = localStorage): void {
  const claves: string[] = [];
  for (let i = 0; i < almacen.length; i++) {
    const clave = almacen.key(i);
    if (clave?.startsWith(PREFIJO_CHAT_LOCAL)) claves.push(clave);
  }
  claves.forEach((clave) => almacen.removeItem(clave));
}
