/**
 * LandingChatWidget — Chatbot flotante de conversión para la landing pública.
 *
 * Modos:
 * - 'oficial': Preguntas centradas en gestión de grupos, repertorios, Iris stems, setlists personalizados, QR fans.
 * - 'tfm': Preguntas que incluyen booking, contratos digitales, escrow con Stripe y agentes de IA.
 *
 * Sin backend. Sin API. Cero latencia y cero coste.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
}

interface QuickQuestion {
  label: string;
  answer: string;
}

// ─── Contenido por modo e idioma ─────────────────────────────────────────────

const CONTENT_OFICIAL = {
  es: {
    greet: '¡Hola! 👋 Soy el asistente de BandManager. ¿En qué puedo ayudarte para gestionar tu banda?',
    questions: [
      {
        label: '¿Es gratis para empezar?',
        answer:
          '¡Sí, 100% gratis! No necesitas tarjeta de crédito. Puedes dar de alta tus bandas, crear setlists, organizar tu calendario y usar FanLanding sin pagar nada.',
      },
      {
        label: '¿Cómo funciona la separación de pistas con Iris?',
        answer:
          'Subes cualquier audio, maqueta o grabación de ensayo e Iris aísla automáticamente las pistas (voz, bajo, batería, guitarras, teclas). Puedes silenciar tu instrumento para ensayar encima o estudiar tu parte con metrónomo.',
      },
      {
        label: '¿Puedo gestionar varias bandas a la vez?',
        answer:
          'Sí, es una de las grandes ventajas: cambias de banda en 1 clic. Y lo mejor: el calendario conjunto cruza los bolos y ensayos de todos tus grupos para que jamás tengas un solape de fechas.',
      },
      {
        label: '¿Cómo funciona la impresión de setlists personalizados?',
        answer:
          'Al imprimir o compartir el setlist, cada miembro recibe su versión a medida: el batería con los BPMs y compases de entrada, el cantante con letras y notas, y los cuerdas con afinaciones y tonalidades.',
      },
      {
        label: '¿Cómo capto fans con el código QR?',
        answer:
          'Generas un QR para la mesa de merchan o la pantalla del escenario. El público lo escanea desde el móvil, se suscribe con consentimiento RGPD y se suman a tu base de fans y métricas de redes.',
      },
      {
        label: '¿Funciona en el móvil durante el directo?',
        answer:
          'Totalmente. Se instala como app en el móvil con Modo Escenario de alto contraste: pantalla siempre encendida, acordes y letras legibles con poca luz y sin distracciones.',
      },
    ] satisfies QuickQuestion[],
    other: '¿Otra duda?',
    otherLink: 'Ver todas las preguntas frecuentes →',
    cta: 'Crear cuenta gratis ahora →',
    close: 'Cerrar chat',
    open: 'Abrir chat de asistencia',
    restart: 'Ver otras preguntas',
  },
  en: {
    greet: 'Hey! 👋 I\'m the BandManager assistant. How can I help you manage your band?',
    questions: [
      {
        label: 'Is it free to get started?',
        answer:
          'Yes, 100% free! No credit card required. You can set up your bands, build setlists, organize your calendar, and use FanLanding right away.',
      },
      {
        label: 'How does Iris stem separation work?',
        answer:
          'Upload any audio track or rehearsal recording and Iris automatically extracts individual stems (vocals, bass, drums, guitars, keys). Mute your instrument to play along or isolate your part to practice.',
      },
      {
        label: 'Can I manage multiple bands?',
        answer:
          'Yes! Switch between bands in one tap. The unified calendar combines gigs and rehearsals across all your projects so you never double-book dates.',
      },
      {
        label: 'How do customized setlists work?',
        answer:
          'When printing or sharing setlists, each member gets a personalized view: the drummer gets BPMs and count-ins, the singer gets lyrics and cues, and guitar/bass get tunings and keys.',
      },
      {
        label: 'How does QR fan capture work?',
        answer:
          'Generate a QR code for your merch table or stage display. Fans scan it with their phone, sign up with full GDPR compliance, and feed your growing fan database and social metrics.',
      },
      {
        label: 'Does it work on mobile during shows?',
        answer:
          'Absolutely. It installs as a mobile web app with a high-contrast Stage Mode: screen stays awake, chords and lyrics are crystal clear in dim stage lighting.',
      },
    ] satisfies QuickQuestion[],
    other: 'Another question?',
    otherLink: 'See all FAQs →',
    cta: 'Create free account now →',
    close: 'Close chat',
    open: 'Open assistant chat',
    restart: 'Back to questions',
  },
} as const;

const CONTENT_TFM = {
  es: {
    greet: '¡Hola! 👋 Asistente de BandManager.io (Entorno de Demostración TFM). ¿Qué deseas consultar?',
    questions: [
      {
        label: '¿Cómo funciona la custodia de señal (Escrow)?',
        answer:
          'Al emitir el contrato digital con la sala, el promotor deposita el 50% de señal vía Stripe Connect. El dinero queda protegido en custodia neutra hasta el día del show, garantizando el cobro y eliminando impagos.',
      },
      {
        label: '¿Necesita la sala tener cuenta creada para firmar?',
        answer:
          'No. La sala recibe un enlace público seguro, revisa el contrato digital con el rider técnico y firma biométricamente desde su móvil en segundos.',
      },
      {
        label: '¿Cómo funciona la separación de pistas con Iris?',
        answer:
          'El motor de IA acústica Iris descompone cualquier audio en pistas aisladas (voz, bajo, batería, guitarra, teclados) para ensayos y preparación técnica.',
      },
      {
        label: '¿Cómo opera la arquitectura multibanda?',
        answer:
          'Permite gestionar múltiples proyectos musicales bajo un mismo tenant de usuario, con aislamiento estricto de datos y calendario conjunto unificado.',
      },
      {
        label: '¿Qué aporta el sistema de setlists inteligentes?',
        answer:
          'Curva de mapa de energía por concierto, modo escenario de alto contraste e impresión adaptada con notas personalizadas para cada miembro de la banda.',
      },
      {
        label: '¿Cómo gestiona MoureDev sus dos bandas?',
        answer:
          'Brais Moure gestiona con la misma cuenta Os Herdeiros do Código (Rock Bravú) y Master of Prompts (Metal). El calendario conjunto evita solapes entre ensayos y fechas en Sala Capitol o Resurrection Fest.',
      },
      {
        label: '¿Qué modelo de negocio y planes tiene?',
        answer:
          'Cuenta con plan gratuito de entrada y suscripciones escalables con balance de créditos para procesamiento de audio y agentes autónomos.',
      },
    ] satisfies QuickQuestion[],
    other: '¿Otra consulta?',
    otherLink: 'Ver documentación y FAQs →',
    cta: 'Iniciar prueba de la plataforma →',
    close: 'Cerrar chat',
    open: 'Abrir chat TFM',
    restart: 'Reiniciar opciones',
  },
  en: {
    greet: 'Hello! 👋 BandManager.io Assistant (TFM Demonstration Environment). What would you like to explore?',
    questions: [
      {
        label: 'How does the Escrow deposit work?',
        answer:
          'When issuing a digital venue contract, the promoter deposits a 50% advance fee via Stripe Connect. Funds remain secured in neutral escrow until show day, eliminating unpaid shows.',
      },
      {
        label: 'Does the venue need an account to sign?',
        answer:
          'No. The venue receives a secure public link, reviews the digital agreement with technical rider, and signs on mobile in seconds.',
      },
      {
        label: 'How does Iris stem separation work?',
        answer:
          'The Iris acoustic AI engine separates any master audio into isolated stems (vocals, bass, drums, guitars, keys) for rehearsal and practice.',
      },
      {
        label: 'How does multi-band architecture operate?',
        answer:
          'Allows managing multiple musical projects under a single user tenant, with strict data boundaries and a unified shared calendar.',
      },
      {
        label: 'How does MoureDev manage both bands?',
        answer:
          'Brais Moure manages Os Herdeiros do Código and Master of Prompts from one account. The shared calendar eliminates clashes between rehearsals and venue gigs (Sala Capitol, Resurrection Fest).',
      },
      {
        label: 'What is the pricing model?',
        answer:
          'Offers a free starter tier alongside scalable subscription tiers powered by credit balances for AI agents and stem separation.',
      },
    ] satisfies QuickQuestion[],
    other: 'Another question?',
    otherLink: 'See all documentation & FAQs →',
    cta: 'Start platform trial now →',
    close: 'Close chat',
    open: 'Open TFM chat',
    restart: 'Restart options',
  },
} as const;

// ─── Componente principal ─────────────────────────────────────────────────────

interface LandingChatWidgetProps {
  onEntrar: () => void;
  mode?: 'oficial' | 'tfm';
}

export const LandingChatWidget: React.FC<LandingChatWidgetProps> = ({ onEntrar, mode = 'oficial' }) => {
  const { language } = useLanguage();

  const lang = language === 'en' ? 'en' : 'es';
  const c = mode === 'tfm' ? CONTENT_TFM[lang] : CONTENT_OFICIAL[lang];

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

  // Resetear mensajes cuando cambia el idioma o el modo
  useEffect(() => {
    setMessages([]);
    setAnswered(false);
  }, [language, mode]);

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

  // Burbuja con indicador tras 5s si no se ha abierto
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
          aria-label={lang === 'es' ? 'Asistente de BandManager' : 'BandManager Assistant'}
          className="fixed bottom-24 right-4 z-50 flex w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:right-6"
          style={{ maxHeight: 'calc(100dvh - 8rem)' }}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--acc)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-white/20">
                <MessageCircle className="size-4 text-white" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  BandManager {mode === 'tfm' ? '· TFM' : ''}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-green-400" aria-hidden />
                  <span className="text-[10px] text-white/80">
                    {lang === 'es' ? 'En línea' : 'Online'}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.close}
              className="cursor-pointer rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
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
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                {c.questions.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => handleQuestion(q)}
                    className="w-full cursor-pointer rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--sunken)] hover:border-[var(--acc)]"
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
                  onClick={() => {
                    setOpen(false);
                    onEntrar();
                  }}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 shadow-md"
                >
                  {c.cta} <ArrowRight className="size-3.5" aria-hidden />
                </button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="cursor-pointer text-xs text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline"
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
        className="fixed bottom-5 right-4 z-50 flex size-14 cursor-pointer items-center justify-center rounded-full bg-[var(--acc)] text-white shadow-xl transition-all hover:scale-105 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--acc)]/50 sm:right-6"
      >
        {open ? (
          <X className="size-6" aria-hidden />
        ) : (
          <MessageCircle className="size-6" aria-hidden />
        )}

        {/* Indicador de mensaje no leído */}
        {!open && unread && (
          <span
            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm"
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
