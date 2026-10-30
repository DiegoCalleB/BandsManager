import React, { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { Button, IconButton, Textarea } from '../ui';
import { MAX_TEXTO_BANDA, PREGUNTAS_INICIALES } from '../../utils/asesor/chat';
import { useChatAsesor } from './hooks/useChatAsesor';

interface Props {
  onCerrar: () => void;
}

/**
 * Preguntas libres al asesor, en una hoja. Solo conversa: lo que aconseja sale de la estrategia y
 * de los números de la banda, y para cambiar el plan hay que usar las pestañas. Empieza con
 * preguntas hechas para que nadie se quede mirando una caja vacía.
 */
export function ChatAsesor({ onCerrar }: Props) {
  const { mensajes, enviando, error, preguntar } = useChatAsesor();
  const [texto, setTexto] = useState('');
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView?.({ block: 'end' });
  }, [mensajes.length, enviando]);

  const enviar = async (t: string) => {
    if (await preguntar(t)) setTexto('');
  };

  return (
    <ModalPortal isOpen onClose={onCerrar}>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[var(--scrim)]/75 sm:items-center sm:p-4" onClick={onCerrar}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preguntar al asesor"
          data-modulo="reels"
          className="flex h-[85vh] max-h-[92vh] w-full max-w-xl flex-col rounded-t-[var(--r-xl)] bg-[var(--surface)] text-[var(--ink)] sm:rounded-[var(--r-xl)]"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-start gap-3 px-5 pb-3 pt-5">
            <div className="grid min-w-0 flex-1 gap-0.5">
              <h2 className="text-lg font-semibold">Preguntar al asesor</h2>
              <p className="text-xs text-[var(--ink-2)]">Responde con vuestra estrategia y vuestros números. No cambia el plan.</p>
            </div>
            <IconButton label="Cerrar" variant="ghost" onClick={onCerrar}><X className="size-5" aria-hidden /></IconButton>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3" aria-live="polite">
            {mensajes.length === 0 ? (
              <div className="grid gap-2 py-2">
                <p className="text-sm text-[var(--ink-2)]">Pregunta lo que quieras de vuestras redes, o empieza por aquí:</p>
                {PREGUNTAS_INICIALES.map((q) => (
                  <button key={q} type="button" onClick={() => void enviar(q)} disabled={enviando}
                    className="rounded-[var(--r-s)] bg-[var(--sunken)] px-3 py-2.5 text-left text-sm text-[var(--ink)] disabled:opacity-50">
                    {q}
                  </button>
                ))}
              </div>
            ) : (
              <ol className="grid gap-2.5 py-1">
                {mensajes.map((m, i) => (
                  <li key={i} className={m.rol === 'banda' ? 'justify-self-end' : 'justify-self-start'} style={{ maxWidth: '88%' }}>
                    <p className={`whitespace-pre-line rounded-[var(--r-m)] px-3.5 py-2.5 text-sm ${m.rol === 'banda' ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]' : 'bg-[var(--sunken)] text-[var(--ink)]'}`}>
                      <span className="sr-only">{m.rol === 'banda' ? 'Vosotros: ' : 'Asesor: '}</span>
                      {m.texto}
                    </p>
                  </li>
                ))}
                {enviando && <li className="justify-self-start text-sm text-[var(--ink-2)]">El asesor está pensando…</li>}
              </ol>
            )}
            <div ref={fin} />
          </div>

          {error && <p role="alert" className="px-5 pb-1 text-sm text-[var(--alert)]">{error}</p>}
          <form className="flex items-end gap-2 px-5 pb-5 pt-2" onSubmit={(e) => { e.preventDefault(); void enviar(texto); }}>
            <Textarea aria-label="Tu pregunta" rows={2} maxLength={MAX_TEXTO_BANDA} value={texto} placeholder="Escribe tu pregunta"
              className="flex-1" style={{ minHeight: '3.5rem' }} onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enviar(texto); } }} />
            <Button type="submit" variant="primary" disabled={enviando || !texto.trim()}>
              <Send className="size-4" aria-hidden />
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
