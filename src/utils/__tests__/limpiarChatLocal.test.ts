import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { limpiarChatLocal, PREFIJO_CHAT_LOCAL } from '../limpiarChatLocal';

/** Almacén mínimo en memoria con la misma interfaz que `Storage`. */
function almacenFalso(inicial: Record<string, string>): Storage {
  const datos = new Map(Object.entries(inicial));
  return {
    get length() { return datos.size; },
    key: (i: number) => [...datos.keys()][i] ?? null,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    clear: () => datos.clear(),
  };
}

describe('limpiarChatLocal', () => {
  it('borra todas las conversaciones y conserva el resto de claves', () => {
    const almacen = almacenFalso({
      [`${PREFIJO_CHAT_LOCAL}u1_b1`]: '[]',
      [`${PREFIJO_CHAT_LOCAL}guest_default`]: '[]',
      bandmanager_agents_enabled: 'true',
    });
    limpiarChatLocal(almacen);
    expect(almacen.length).toBe(1);
    expect(almacen.getItem('bandmanager_agents_enabled')).toBe('true');
  });

  it('usa el mismo prefijo con el que el chat guarda la conversación', () => {
    const identidad = readFileSync('src/components/chatbot/hooks/useChatIdentity.ts', 'utf8');
    expect(identidad).toContain('`' + PREFIJO_CHAT_LOCAL + '${currentUser');
  });
});
