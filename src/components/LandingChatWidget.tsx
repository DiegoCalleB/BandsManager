/**
 * LandingChatWidget — Chatbot flotante de conversión para la landing pública.
 *
 * Sin backend. Sin API. Las respuestas son estáticas para garantizar
 * carga instantánea y cero coste. Cada respuesta termina con un CTA
 * que lleva al usuario a registrarse.
 *
 * Integración: importar y colocar al final de PublicLanding.tsx,
 * pasando el mismo `onEntrar` que usa el componente padre.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  /** 'bot' | 'user' — quién lo dice */
  from: 'bot' | 'user';
  text: string;
}

interface QuickQuestion {
  label: string;
  answer: string;
}

// ─── Contenido por idioma ─────────────────────────────────────────────────────

const CONTENT = {
  es: {
    greet: '¡Hola! 👋 Soy el asistente de BandManager. ¿Qué quieres saber?',
    questions: [
      {
        label: '¿Es gratis?',
        answer:
          'Sí. Hay un plan gratuito para empezar desde hoy, sin tarjeta. Los planes de pago añaden más créditos y funciones avanzadas, y los ves dentro de la app sin sorpresas.',
      },
      {
        label: '¿Cómo funciona el escrow?',
        answer:
          'Al firmar el contrato, la sala deposita la señal pactada vía Stripe. El dinero queda retenido en custodia neutra hasta el día del show. Si cancela sin aviso, el importe te lo quedas tú.',
      },
      {
        label: '¿Necesita la sala una cuenta?',
        answer:
          'No. La sala recibe un enlace público, firma el contrato desde el móvil y deposita la señal sin registrarse. Tú sí necesitas cuenta — y es gratis.',
      },
      {
        label: '¿Funciona en el móvil?',
        answer:
          'Sí. Está pensado para el móvil primero: se instala como app, tiene modo escenario para leer el setlist en directo y el rider siempre está a mano.',
      },
      {
        label: '¿Sirve para varias bandas?',
        answer:
          'Sí. Puedes gestionar varios proyectos desde la misma cuenta y cambiar de banda en un toque. Ideal si tocas en varios grupos o representas a otros.',
      },
      {
        label: '¿Puedo probar sin compromiso?',
        answer:
          'Por supuesto. El plan gratuito no caduca y no pide tarjeta. Si más adelante quieres más, los planes de pago se activan y se cancelan cuando quieras.',
      },
    ] satisfies QuickQuestion[],
    other: '¿Otra pregunta?',
    otherLink: 'Ver todas las preguntas frecuentes →',
    cta: 'Crear cuenta gratis →',
    close: 'Cerrar chat',
    open: 'Abrir chat',
    restart: 'Volver al inicio',
  },
  en: {
    greet: 'Hey! 👋 I\'m the BandManager assistant. What would you like to know?',
    questions: [
      {
        label: 'Is it free?',
        answer:
          'Yes. There\'s a free plan to get started today — no card required. Paid plans add more credits and advanced features, visible inside the app with no surprises.',
      },
      {
        label: 'How does escrow work?',
        answer:
          'When the contract is signed, the venue deposits the agreed fee via Stripe. The money is held in neutral escrow until show day. If they cancel without notice, you keep it.',
      },
      {
        label: 'Does the venue need an account?',
        answer:
          'No. The venue gets a public link, signs the contract on their phone and deposits the fee without registering. You need an account — and it\'s free.',
      },
      {
        label: 'Does it work on mobile?',
        answer:
          'Yes. It\'s mobile-first: installs as an app, has a stage mode for reading the setlist live, and your rider is always at hand.',
      },
      {
        label: 'Can I manage several bands?',
        answer:
          'Yes. You can manage multiple projects from one account and switch between bands in one tap. Perfect if you play in several groups or manage others.',
      },
      {
        label: 'Can I try it without commitment?',
        answer:
          'Of course. The free plan never expires and doesn\'t ask for a card. If you want more later, paid plans activate and cancel whenever you like.',
      },
    ] satisfies QuickQuestion[],
    other: 'Another question?',
    otherLink: 'See all FAQs →',
    cta: 'Create free account →',
    close: 'Close chat',
    open: 'Open chat',
    restart: 'Back to start',
  },
} as const;

// ─── Componente principal ─────────────────────────────────────────────────────

interface LandingChatWidgetProps {
  onEntrar: () => void;
}

export const LandingChatWidget: React.FC<LandingChatWidgetProps> = ({ onEntrar }) => {
  const { language } = useLanguage();

  // Usamos 'es' como fallback para ca/gl/eu que no tienen contenido propio
  const lang = language === 'en' ? 'en' : 'es';
  const c = CONTENT[lang];

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answered, setAnswered] = useState(false);
  const [unread, setUnread] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mostrar saludo al abrir por primera vez
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ from: 'bot', text: c.greet }]);
      setUnread(false);
    }
  }, [open, messages.length, c.greet]);

  // Resetear mensajes cuando cambia el idioma (para que el saludo salga en el nuevo idioma)
  useEffect(() => {
    setMessages([]);
    setAnswered(false);
  }, [language]);

  // Scroll automático al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Burbuja parpadeante después de 5 s si no se ha abierto
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setUnread(true), 5000);
    return () => clearTimeout(timer);
  }, [open]);

  const handleQuestion = (q: QuickQuestion) => {
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: q.label },
      { from: 'bot', text: q.answer },
    ]);
    setAnswered(true);
  };

  const handleRestart = () => {
    setMessages([{ from: 'bot', text: c.greet }]);
    setAnswered(false);
  };

  return (
    <>
      {/* ── Panel del chat ──────────────────────────────────────────────── */}
      {open && (
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'es' ? 'Chat de soporte' : 'Support chat'}
          className="fixed bottom-24 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:right-6"
          style={{ maxHeight: 'calc(100dvh - 8rem)' }}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--acc)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-white/20">
                <MessageCircle className="size-4 text-white" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-white">BandManager</p>
              <span className="size-2 rounded-full bg-green-400" aria-hidden title={lang === 'es' ? 'En línea' : 'Online'} />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.close}
              className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <p
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-snug ${
                    msg.from === 'bot'
                      ? 'rounded-tl-sm bg-[var(--sunken)] text-[var(--ink)]'
                      : 'rounded-tr-sm bg-[var(--acc)] text-white'
                  }`}
                >
                  {msg.text}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Acciones: preguntas rápidas o CTA tras responder */}
          <div className="border-t border-[var(--border)] p-3 space-y-2">
            {!answered ? (
              // Botones de preguntas rápidas
              <div className="flex flex-col gap-1.5">
                {c.questions.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => handleQuestion(q)}
                    className="w-full rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--sunken)]"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            ) : (
              // Post-respuesta: CTA + opción de reiniciar
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onEntrar}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
                >
                  {c.cta} <ArrowRight className="size-3.5" aria-hidden />
                </button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline"
                  >
                    {c.restart}
                  </button>
                  <a
                    href="#preguntas"
                    onClick={() => setOpen(false)}
                    className="text-xs text-[var(--acc-ink)] hover:underline"
                  >
                    {c.otherLink}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Burbuja flotante ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setUnread(false); }}
        aria-label={open ? c.close : c.open}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-[var(--acc)] text-white shadow-xl transition-all hover:scale-105 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--acc)]/50 sm:right-6"
      >
        {open ? (
          <X className="size-6" aria-hidden />
        ) : (
          <MessageCircle className="size-6" aria-hidden />
        )}

        {/* Indicador de mensaje no leído */}
        {!open && unread && (
          <span
            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
            aria-hidden
          >
            1
          </span>
        )}
      </button>
    </>
  );
};

export default LandingChatWidget;
