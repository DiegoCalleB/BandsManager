// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ChatMessage } from '../../chatTypes';
import { useChatSend, type ChatSendParams } from '../useChatSend';

/** Aplica al estado los actualizadores que el hook le pasa a `setMessages`. */
function montar() {
  let mensajes: ChatMessage[] = [];
  const params = {
    inputText: 'hola',
    isLoading: false,
    setInputText: vi.fn(),
    setMessages: vi.fn((a: ChatMessage[] | ((p: ChatMessage[]) => ChatMessage[])) => {
      mensajes = typeof a === 'function' ? a(mensajes) : a;
    }),
    setIsLoading: vi.fn(),
    currentUser: { band_id: 'band-a' },
    userRole: 'leader',
    messages: [],
  } as unknown as ChatSendParams;
  const { result } = renderHook(() => useChatSend(params));
  const enviar = () => result.current.handleSendMessage({ preventDefault() {} } as React.FormEvent);
  return { enviar, textoDelBot: () => mensajes.filter((m) => m.sender === 'bot').map((m) => m.text) };
}

function responder(status: number, cuerpo: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => cuerpo,
  })));
}

afterEach(() => vi.unstubAllGlobals());

describe('useChatSend: avisos del servidor', () => {
  it('con un 429 enseña el aviso del servidor, no «Error de Conexión»', async () => {
    responder(429, { success: false, error: 'Estás enviando muchos mensajes seguidos.' });
    const { enviar, textoDelBot } = montar();
    await enviar();
    expect(textoDelBot().join(' ')).toContain('Estás enviando muchos mensajes seguidos.');
    expect(textoDelBot().join(' ')).not.toContain('Error de Conexión');
  });

  it('con un 400 enseña el motivo', async () => {
    responder(400, { error: 'El mensaje no es válido o es demasiado largo.' });
    const { enviar, textoDelBot } = montar();
    await enviar();
    expect(textoDelBot().join(' ')).toContain('demasiado largo');
  });

  it('con un fallo del servidor sigue diciendo «Error de Conexión» y no filtra detalles', async () => {
    responder(500, { error: 'detalle interno de la base de datos' });
    const { enviar, textoDelBot } = montar();
    await enviar();
    expect(textoDelBot().join(' ')).toContain('Error de Conexión');
    expect(textoDelBot().join(' ')).not.toContain('base de datos');
  });
});
