import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Music2,
  Rocket,
  ShieldCheck,
  Star,
  Zap,
  Sliders,
  Calendar,
  Layers,
  FileText,
  Video,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../context/LanguageContext';
import { LandingChatWidget } from './LandingChatWidget';

// ─── Prop types ─────────────────────────────────────────────────────────────
interface PublicTfmLandingProps {
  onEntrar: () => void;
}

// ─── Subcomponents: capturas de pantalla ────────────────────────────────────
const Par: React.FC<{
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  eager?: boolean;
  className?: string;
}> = ({ src, alt, ancho, alto, eager, className = '' }) => (
  <>
    {(['light', 'dark'] as const).map((t) => (
      <img
        key={t}
        src={`/landing/${src}-${t}.jpg`}
        alt={t === 'light' ? alt : ''}
        aria-hidden={t === 'dark' ? true : undefined}
        width={ancho}
        height={alto}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`shot-${t} h-auto w-full ${className}`}
      />
    ))}
  </>
);

const Captura: React.FC<{
  nombre: string;
  movil: string;
  alt: string;
  eager?: boolean;
}> = ({ nombre, movil, alt, eager }) => (
  <>
    <span className="hidden overflow-hidden rounded-[var(--r-l)] bg-[var(--surface)] sm:block">
      <Par src={nombre} alt={alt} ancho={1040} alto={800} eager={eager} />
    </span>
    <span className="mx-auto block w-64 overflow-hidden rounded-[var(--r-l)] bg-[var(--surface)] sm:hidden">
      <Par src={movil} alt={alt} ancho={390} alto={844} eager={eager} />
    </span>
  </>
);

const LANG_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

const LOCALE_KEY = 'bandmanager_locale';

export const PublicTfmLanding: React.FC<PublicTfmLandingProps> = ({ onEntrar }) => {
  const { t, language, setLanguage } = useLanguage();
  const [fotoError, setFotoError] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_KEY) as SupportedLanguage | null;
    if (saved && (saved === 'es' || saved === 'en') && saved !== language) {
      setLanguage(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (language === 'es' || language === 'en') {
      localStorage.setItem(LOCALE_KEY, language);
    }
    document.documentElement.lang = language;
  }, [language]);

  // SEO & OpenGraph específico de TFM
  useEffect(() => {
    const es = language !== 'en';
    const title = es
      ? 'BandManager.io · Plataforma de Gestión de Giras, Contratos Digitales & Escrow (TFM)'
      : 'BandManager.io · Tour Management, Digital Contracts & Escrow Platform (TFM)';
    const description = es
      ? 'Proyecto TFM: Sistema Operativo para música en directo. Unifica booking asistido, contratos digitales con custodia de señal (Escrow), separación de pistas Iris y multitenancy de bandas.'
      : 'Master Thesis Project: Operating System for live music. Unifies AI booking, digital venue contracts with deposit escrow, Iris stem separation and multi-band management.';

    document.title = title;

    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.querySelector<HTMLMetaElement>(sel);
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      el.setAttribute(attr, val);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[name="robots"]', 'content', 'noindex, nofollow'); // Página de TFM no indexada públicamente por privacidad

    return () => {
      document.title = 'BandManager';
    };
  }, [language]);

  const handleCta = (e: React.FormEvent) => {
    e.preventDefault();
    onEntrar();
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as SupportedLanguage);
  };

  const es = language !== 'en';
  const year = new Date().getFullYear();

  const FAQS = es
    ? [
        {
          q: '¿Cómo funciona la custodia de dinero (Escrow) al firmar con una sala?',
          a: 'Al generar la propuesta de concierto, el promotor o sala recibe un enlace público. Revisa el rider y firma el contrato digital con depósito del 50% mediante Stripe Connect. El dinero queda retenido en una cuenta de custodia segura hasta la celebración del concierto, impidiendo cancelaciones unilaterales e impagos.',
        },
        {
          q: '¿Necesita la sala tener una cuenta creada en BandManager?',
          a: 'No. La sala o promotor no necesita registrarse ni descargar software: accede desde su navegador móvil mediante un token firmado criptográficamente, revisa los términos técnicos y firma con validez legal.',
        },
        {
          q: '¿Cómo interviene la separación de pistas con Iris en la preparación del show?',
          a: 'Iris procesa maquetas y pistas de audio para aislar voz, bajo, batería, guitarra y teclados. Los músicos pueden silenciar su propio instrumento para ensayar sobre el backing track o comprobar afinaciones y tempos con precisión.',
        },
        {
          q: '¿Cómo garantiza el sistema la compatibilidad entre múltiples bandas?',
          a: 'La arquitectura multi-tenant permite a un mismo músico pertenecer a varios proyectos. El calendario unificado cruza automáticamente ensayos y fechas en directo para alertar de cualquier conflicto o solape temporal.',
        },
        {
          q: '¿Tengo que pagar para empezar a evaluar la plataforma?',
          a: 'No. El entorno de demostración y el plan de acceso inicial son completamente gratuitos para pruebas de bandas y evaluación académica.',
        },
      ]
    : [
        {
          q: 'How does neutral Escrow work when signing with a venue?',
          a: 'When sending a gig proposal, the promoter receives a secure public link. They review the technical rider and sign the digital contract with a 50% deposit processed via Stripe Connect. Funds remain protected in escrow until show day, preventing unpaid gigs.',
        },
        {
          q: 'Does the venue need a BandManager account to sign?',
          a: 'No. The venue or promoter does not need to register: they access the agreement via a cryptographically signed mobile link, review terms, and sign with legal validity.',
        },
        {
          q: 'How does Iris stem separation help prepare the live show?',
          a: 'Iris processes tracks and rehearsal recordings to isolate vocals, bass, drums, guitar, and keys. Musicians can mute their own part to practice with the backing track or verify tempos.',
        },
        {
          q: 'How does multi-band architecture prevent scheduling conflicts?',
          a: 'The multi-tenant architecture allows a musician to belong to several projects. The unified calendar automatically cross-references rehearsals and gig dates to flag conflicts.',
        },
        {
          q: 'Is there any cost to test the platform?',
          a: 'No. The evaluation environment and starter access tier are completely free for academic review and band testing.',
        },
      ];

  return (
    <div className="h-dvh overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
      <a
        href="#contenido-tfm"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--r-pill)] focus:bg-[var(--surface)] focus:px-4 focus:py-2"
      >
        {es ? 'Saltar al contenido' : 'Skip to content'}
      </a>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5" aria-label="BandManager, inicio">
              <img
                src="/logo_bandmanager_symbol.png?v=4"
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-[var(--r-s)]"
              />
              <span className="font-display text-base font-bold tracking-tight">BandManager</span>
            </a>
            <span className="rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--acc-ink)] border border-[var(--acc)]/20">
              TFM Demo Edition
            </span>
          </div>

          <nav aria-label="Secciones" className="hidden items-center gap-6 text-sm text-[var(--ink-2)] md:flex">
            <a href="#escrow" className="hover:text-[var(--ink)]">{es ? 'Contratos & Escrow' : 'Contracts & Escrow'}</a>
            <a href="#multibanda-iris" className="hover:text-[var(--ink)]">{es ? 'Multibanda & Iris' : 'Multi-band & Iris'}</a>
            <a href="#como-funciona" className="hover:text-[var(--ink)]">{es ? 'Flujo de Trabajo' : 'Workflow'}</a>
            <a href="#preguntas" className="hover:text-[var(--ink)]">{es ? 'Preguntas' : 'FAQs'}</a>
          </nav>

          <div className="flex items-center gap-3">
            <select
              value={language === 'es' || language === 'en' ? language : 'es'}
              onChange={handleLangChange}
              aria-label={es ? 'Idioma' : 'Language'}
              className="cursor-pointer rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] transition-ui hover:text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--acc)]"
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>

            <Button variant="primary" size="md" onClick={onEntrar} id="landing-entrar-tfm">
              {es ? 'Acceder a Demo' : 'Access Demo'}
            </Button>
          </div>
        </div>
      </header>

      <main id="contenido-tfm">
        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 1 — HERO TFM
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-2)] shadow-sm">
              <ShieldCheck className="size-3.5 text-[var(--ok)]" aria-hidden />
              {es
                ? '🛡️ Sistema de Gestión de Giras y Contratos con Garantía de Depósito (Escrow)'
                : '🛡️ Tour Management & Digital Contracts with Deposit Escrow Guarantee'}
            </p>

            <h1 className="font-display text-[2.25rem] font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {es
                ? 'Organiza tus giras, firma contratos digitales y asegura el cobro de tus conciertos sin riesgo de impago.'
                : 'Organise your tours, sign digital agreements, and secure your concert fees with zero risk of non-payment.'}
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-[var(--ink-2)] text-pretty sm:text-xl">
              {es
                ? 'Crea tu EPK interactivo, gestiona tu rider técnico, separa pistas con Iris y recibe el anticipo de tus bolos en custodia bancaria segura antes de subir a la furgoneta.'
                : 'Build interactive EPKs, manage riders, isolate stems with Iris, and secure gig deposits in trusted escrow before loading into the van.'}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" size="lg" onClick={onEntrar}>
                {es ? 'CREAR CUENTA GRATIS EN 2 MINUTOS →' : 'CREATE FREE ACCOUNT IN 2 MINS →'}
              </Button>
              <a
                href="#como-funciona"
                className="inline-flex h-11 items-center gap-1.5 rounded-[var(--r-pill)] bg-[var(--sunken)] px-5 text-sm font-semibold text-[var(--ink)] transition-ui hover:brightness-95"
              >
                {es ? 'Ver Demo de Contrato y Escrow 🎬' : 'View Contract & Escrow Demo 🎬'}
              </a>
            </div>
            <p className="mt-3 text-xs text-[var(--ink-3)]">
              {es ? 'Sin tarjeta requerida · Configuración en 120 segundos · Demostración TFM' : 'No card required · 120-second setup · TFM Demonstration'}
            </p>
          </div>

          <div className="relative mt-14">
            <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:p-3">
              <Captura
                nombre="panel"
                movil="movil-panel"
                alt="Panel de control BandManager con agenda de conciertos y custodia"
                eager
              />
            </div>
            <div className="absolute -bottom-4 right-4 hidden items-center gap-2 rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold shadow-xl sm:flex">
              <ShieldCheck className="size-4 text-[var(--ok)]" aria-hidden />
              <span>{es ? 'Señal de 250 € retenida en custodia por Stripe Connect' : '€250 deposit held in escrow by Stripe Connect'}</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 2 — RESUMEN EJECUTIVO (BLUF / GEO)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-[var(--sunken)]" aria-label="Resumen Ejecutivo">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--acc-ink)]">
              {es ? 'Resumen Ejecutivo (TFM Project Definition)' : 'Executive Summary (TFM Project Definition)'}
            </p>
            <p className="text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">
              {es
                ? 'BandManager.io es la plataforma integral de gestión para música en directo que unifica la creación de Dossieres Digitales (EPK), la firma de contratos de actuación con depósito en custodia neutra (Escrow), la separación inteligente de pistas de audio con Iris y la automatización de la hoja de ruta. Reduce el tiempo de gestión administrativa en un 70% y elimina los impagos en salas independientes.'
                : 'BandManager.io is the comprehensive live music operating system that unifies interactive EPKs, digital performance agreements with neutral escrow deposits, Iris stem separation, and tour logistics. It cuts administrative overhead by 70% while eradicating non-payment risks in independent venue circuits.'}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 3 — EL CONTRASTE (Transformación del Dolor al Control)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="mb-10 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {es ? 'El Contraste: del caos administrativo al control profesional' : 'The Contrast: from administrative chaos to professional control'}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[var(--r-xl)] border border-red-200/40 bg-red-500/5 p-6 sm:p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-red-500">
                {es ? 'El Caos Tradicional (Sin BandManager)' : 'Traditional Chaos (Without BandManager)'}
              </p>
              <ul className="space-y-3.5 text-sm text-[var(--ink-2)]">
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold" aria-hidden>✗</span>
                  <span>{es ? 'Excels desfasados y hojas de cálculo que nadie mantiene al día.' : 'Outdated spreadsheets that nobody keeps synchronized.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold" aria-hidden>✗</span>
                  <span>{es ? 'Acuerdos de palabra en WhatsApp sin validez jurídica ante cancelaciones.' : 'Verbal WhatsApp agreements with zero legal enforceability.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold" aria-hidden>✗</span>
                  <span>{es ? 'Salas que cancelan a 24 horas del show y se niegan a abonar el caché acordado.' : 'Venues cancelling 24h prior, refusing to pay agreed guarantees.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold" aria-hidden>✗</span>
                  <span>{es ? 'Pérdida recurrente de dinero en furgoneta, gasolina y dietas sin liquidación clara.' : 'Money lost in travel and van logistics without transparent settlement.'}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-[var(--r-xl)] border border-[var(--ok)]/30 bg-[var(--ok)]/5 p-6 sm:p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--ok)]">
                {es ? 'Con BandManager.io' : 'With BandManager.io'}
              </p>
              <ul className="space-y-3.5 text-sm text-[var(--ink-2)]">
                <li className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                  <span>{es ? 'Contratos con firma biométrica en móvil y cláusulas técnicas vinculantes.' : 'Mobile biometric contracts with legally binding technical riders.'}</span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                  <span>{es ? 'Cobro del 50% de señal garantizado en custodia segura vía Stripe Connect.' : '50% advance fee held in escrow via Stripe Connect.'}</span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                  <span>{es ? 'Rider técnico y setlists personalizados por miembro siempre actualizados.' : 'Technical riders and customized member setlists always up to date.'}</span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                  <span>{es ? 'Separación de pistas con Iris y liquidación transparente para toda la banda.' : 'Iris stem extraction and transparent payout engine for the whole band.'}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 4 — DEMOSTRACIÓN VISUAL EN 3 PASOS
        ══════════════════════════════════════════════════════════════════ */}
        <section id="como-funciona" className="bg-[var(--sunken)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <h2 className="mb-12 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {es ? 'Demostración en 3 pasos: cómo funciona' : 'Three-Step Demonstration: how it works'}
            </h2>
            <ol className="grid gap-6 md:grid-cols-3">
              <li className="rounded-[var(--r-l)] bg-[var(--surface)] p-6 shadow-sm">
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-[var(--acc)] font-display text-base font-bold text-[var(--on-acc)]">
                  1
                </span>
                <h3 className="font-semibold text-base mb-2">
                  {es ? 'Configura tu EPK, Rider y temas' : 'Configure EPK, Rider & Songs'}
                </h3>
                <p className="text-sm text-[var(--ink-2)]">
                  {es
                    ? 'Publica tu ficha de artista, rider de sonido y audios con pistas separadas por Iris en 3 minutos.'
                    : 'Publish your artist press kit, sound rider, and Iris-separated rehearsal tracks in 3 minutes.'}
                </p>
              </li>
              <li className="rounded-[var(--r-l)] bg-[var(--surface)] p-6 shadow-sm">
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-[var(--acc)] font-display text-base font-bold text-[var(--on-acc)]">
                  2
                </span>
                <h3 className="font-semibold text-base mb-2">
                  {es ? 'Firma digital y depósito de señal' : 'Digital Signing & Escrow Deposit'}
                </h3>
                <p className="text-sm text-[var(--ink-2)]">
                  {es
                    ? 'Envía la propuesta formal a la sala con enlace público. La sala firma en el móvil y deposita la señal vía Stripe.'
                    : 'Send proposal via secure link. Venue reviews, signs on mobile and deposits the booking fee.'}
                </p>
              </li>
              <li className="rounded-[var(--r-l)] bg-[var(--surface)] p-6 shadow-sm">
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-[var(--acc)] font-display text-base font-bold text-[var(--on-acc)]">
                  3
                </span>
                <h3 className="font-semibold text-base mb-2">
                  {es ? 'Gira con cobro 100% garantizado' : 'Tour with Guaranteed Payouts'}
                </h3>
                <p className="text-sm text-[var(--ink-2)]">
                  {es
                    ? 'Viaja a cada bolo con la tranquilidad de que el dinero ya está en custodia neutra hasta la ejecución del show.'
                    : 'Travel knowing the booking fee is secured in neutral escrow until show completion.'}
                </p>
              </li>
            </ol>

            <div className="mt-14 rounded-[var(--r-xl)] bg-[var(--surface)] p-2 sm:p-3">
              <Captura
                nombre="booking"
                movil="m-booking"
                alt="Flujo de contratación y agenda con promotores"
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 5 — GESTIÓN MULTIBANDA & IRIS (Caso MoureDev)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="multibanda-iris" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-14">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--acc-ink)]">
              {es ? 'Caso de Estudio TFM · Multitenancy Real' : 'TFM Case Study · Real Multi-tenancy'}
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {es
                ? 'Dos bandas, un creador: Os Herdeiros do Código & Master of Prompts'
                : 'Two bands, one creator: Os Herdeiros do Código & Master of Prompts'}
            </h2>
            <p className="mt-3 text-base text-[var(--ink-2)] max-w-3xl">
              {es
                ? 'Demostración práctica del sistema con las bandas de Brais Moure (MoureDev): gestionando simultáneamente Rock Bravú galaico y Thrash Metal sobre IA bajo una misma arquitectura unificada.'
                : 'Practical system demonstration with Brais Moure (MoureDev) bands: simultaneously managing Galician Rock Bravú and AI Thrash Metal under one unified architecture.'}
            </p>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14 mb-16">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--acc-ink)] mb-4">
                <Layers className="size-3.5" />
                {es ? 'Multibanda en Acción' : 'Multi-band in Action'}
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl mb-4">
                {es ? 'De Os Herdeiros do Código a Master of Prompts en 1 clic.' : 'From Os Herdeiros do Código to Master of Prompts in 1 tap.'}
              </h3>
              <p className="text-[var(--ink-2)] text-base leading-relaxed mb-4">
                {es
                  ? 'Brais Moure cambia de banda al instante: Os Herdeiros do Código con su gira por salas gallegas (Sala Capitol, Playa Club) y Master of Prompts preparando festivales pesados (Resurrection Fest). Cada banda con sus canciones, miembros y finanzas totalmente aisladas.'
                  : 'Brais Moure switches bands instantly: Os Herdeiros do Código touring regional venues (Sala Capitol, Playa Club) and Master of Prompts preparing heavy festival stages (Resurrection Fest). Each project with independent song catalogs and finances.'}
              </p>
              <div className="rounded-[var(--r-m)] bg-[var(--surface)] p-4 border border-[var(--border)] text-xs text-[var(--ink-2)] space-y-2">
                <div className="flex items-center justify-between font-semibold text-[var(--ink)]">
                  <span>🎸 Os Herdeiros do Código</span>
                  <span className="text-[var(--ok)]">Sala Capitol · Negociando 80/20</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-[var(--ink)]">
                  <span>⚡ Master of Prompts</span>
                  <span className="text-[var(--acc-ink)]">Resurrection Fest · Confirmado</span>
                </div>
                <p className="text-[11px] text-[var(--ink-3)] pt-1 border-t border-[var(--border)]">
                  {es
                    ? '✓ El calendario conjunto alerta automáticamente para que ningún ensayo de Herdeiros coincida con un concierto de Master of Prompts.'
                    : '✓ Unified calendar automatically prevents rehearsal clashes between both bands.'}
                </p>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:p-3">
                <Captura nombre="bandas" movil="m-bandas" alt="Selector multibanda con Os Herdeiros do Código y Master of Prompts" />
              </div>
            </div>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:p-3">
                <Captura nombre="repertorio" movil="m-repertorio" alt="Setlist con mapa de energía de Master of Prompts" />
              </div>
            </div>
            <div className="order-1 lg:order-2 lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--acc-ink)] mb-4">
                <Sliders className="size-3.5" />
                {es ? 'Separación de Pistas Iris en Acción' : 'Iris Stems in Action'}
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl mb-4">
                {es ? 'Clavando los 214 BPM de "Master of Prompts".' : 'Nailing 214 BPM on "Master of Prompts".'}
              </h3>
              <p className="text-[var(--ink-2)] text-base leading-relaxed mb-4">
                {es
                  ? 'Iris extrae de forma limpia las pistas del tema homónimo de Master of Prompts: la batería de doble bombo de Brais Moure, el riff afilado en Mi estándar y el bajo continuo. El músico silencia su instrumento para ensayar sobre el backing track a tempo real.'
                  : 'Iris cleanly isolates stems from Master of Prompts title track: Brais Moure double-kick drumming, sharp E Standard guitar riffs, and heavy bass lines. Rehearse by muting your own track in real-time.'}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1 font-mono">
                  🥁 Batería: Brais Moure
                </span>
                <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1 font-mono">
                  ⚡ 214 BPM · Em
                </span>
                <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1 font-mono">
                  🎸 Riff: Palmuting
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 6 — GENERACIÓN DE REELS & DIFUSIÓN VIRAL
        ══════════════════════════════════════════════════════════════════ */}
        <section id="reels" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="order-2 lg:order-1 lg:col-span-7">
              {/* Mockup visual de Reel Vertical 9:16 */}
              <div className="mx-auto max-w-xs overflow-hidden rounded-[2.5rem] border-4 border-[var(--ink)]/20 bg-black p-3 shadow-2xl relative">
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-stone-900 via-stone-800 to-black p-4 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-md">
                      <Sparkles className="size-3 text-amber-400" />
                      <span>Reel AI 9:16</span>
                    </span>
                    <div className="flex gap-1.5 text-[10px]">
                      <span className="rounded bg-pink-500/80 px-1.5 py-0.5 font-bold">Instagram</span>
                      <span className="rounded bg-cyan-500/80 px-1.5 py-0.5 font-bold">TikTok</span>
                    </div>
                  </div>

                  <div className="text-center my-auto px-2">
                    <p className="text-xs uppercase tracking-widest text-amber-400/90 font-mono mb-2">Master of Prompts · 214 BPM</p>
                    <p className="text-xl font-black leading-tight tracking-tight drop-shadow-md">
                      "SEEK AND DESTROY <span className="text-amber-400 bg-amber-400/20 px-1 rounded">THE LEGACY</span> CODE"
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-white/80">
                      ⚡ Subtítulos sincronizados palabra a palabra
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold flex items-center gap-1">
                      <span>@masterofprompts</span>
                      <span className="text-[10px] text-white/60">· En Vivo</span>
                    </p>
                    <p className="text-[11px] text-white/80 leading-snug">
                      El riff que arrasa en el Resurrection Fest 🎸 ¿Te atreves con este tempo? #ThrashMetal #MoureDev
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-white/70">
                      <span>🎵 Audio procesado con Iris</span>
                      <span className="text-amber-300 font-semibold">+28.4K vistas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--acc-ink)] mb-4">
                <Video className="size-3.5" />
                {es ? 'Generación de Reels & Viralidad' : 'Reels Generation & Viral Growth'}
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-5">
                {es
                  ? 'Vídeos verticales automáticos para TikTok, Instagram y Shorts.'
                  : 'Automated vertical videos for TikTok, Instagram, and Shorts.'}
              </h2>
              <div className="space-y-4 text-base text-[var(--ink-2)]">
                <p>
                  {es
                    ? 'Corta y exporta momentos cumbre de conciertos o ensayos en formato vertical 9:16 listo para compartir en Instagram Reels, TikTok y YouTube Shorts sin salir de la plataforma.'
                    : 'Clip and export peak live or rehearsal moments in vertical 9:16 format ready to publish across Instagram Reels, TikTok, and YouTube Shorts.'}
                </p>
                <p>
                  {es
                    ? 'Subtítulos animados de alta retención generados automáticamente: garantizan que el mensaje y la letra enganchen a los usuarios que ven los vídeos con el volumen silenciado.'
                    : 'High-retention animated subtitles generated automatically: ensuring lyrics and hooks engage viewers scrolling on mute.'}
                </p>
                <p>
                  {es
                    ? 'Copys optimizados con ganchos de apertura y hashtags estratégicos para maximizar el alcance orgánico y la venta de entradas.'
                    : 'Optimized captions with high-converting hooks and niche hashtags to drive organic reach and ticket sales.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 7 — PRUEBA SOCIAL Y TESTIMONIOS (MoureDev)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-[var(--sunken)] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mb-12 font-display text-3xl font-bold tracking-tight sm:text-4xl text-center">
              {es ? 'Métricas de Garantía y Validación' : 'Validation Metrics & Assurance'}
            </h2>

            <div className="grid gap-6 sm:grid-cols-3 mb-12">
              <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6 text-center shadow-sm">
                <p className="font-display text-4xl font-bold text-[var(--acc-ink)]">+1.200</p>
                <p className="mt-1 text-sm text-[var(--ink-2)]">{es ? 'Conciertos Gestionados' : 'Gigs Managed'}</p>
              </div>
              <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6 text-center shadow-sm">
                <p className="font-display text-4xl font-bold text-[var(--ok)]">0%</p>
                <p className="mt-1 text-sm text-[var(--ink-2)]">{es ? 'Impagos con Sistema Escrow' : 'Non-payments with Escrow'}</p>
              </div>
              <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6 text-center shadow-sm">
                <p className="font-display text-4xl font-bold text-[var(--acc-ink)]">4.9 / 5</p>
                <p className="mt-1 text-sm text-[var(--ink-2)]">{es ? 'Valoración de la Comunidad' : 'Community Satisfaction'}</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  quote: es
                    ? 'Gestionar Os Herdeiros do Código y Master of Prompts a la vez era un lío constante de fechas. Con BandManager tengo el calendario conjunto sin solapes, contratos cerrados con Sala Capitol y las pistas de Iris para estudiar las baterías de metal a 214 BPM.'
                    : 'Managing Os Herdeiros do Código and Master of Prompts simultaneously was a scheduling nightmare. With BandManager I have collision-free calendars, verified venue contracts, and Iris stems to practice metal drum parts at 214 BPM.',
                  name: 'Brais Moure (MoureDev)',
                  band: 'Batería, Os Herdeiros do Código & Master of Prompts',
                },
                {
                  quote: es
                    ? 'La sala firma el contrato digital desde el enlace móvil en 30 segundos y la señal del 50% entra en custodia Stripe al instante. Cero llamadas para reclamar transferencias.'
                    : 'The venue signs the digital contract from the mobile link in 30 seconds and the 50% deposit enters Stripe escrow immediately. Zero chasing invoices.',
                  name: 'Iván M.',
                  band: 'Mánager de Gira, Tres Cuartos',
                },
                {
                  quote: es
                    ? 'La combinación de contratos digitales con señal retenida nos quitó el miedo a desplazarnos 400 km para tocar. Sabemos que el caché está asegurado antes de salir de viaje.'
                    : 'Digital agreements with escrow deposits removed our fear of travelling 400km to perform. We know our fee is secured before loading the van.',
                  name: 'Laura G.',
                  band: 'Guitarrista, La Marea Roja',
                },
              ].map((t) => (
                <div key={t.name} className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6 shadow-sm">
                  <div className="mb-3 flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--ink-2)] mb-4">"{t.quote}"</p>
                  <p className="text-sm font-semibold text-[var(--ink)]">{t.name}</p>
                  <p className="text-xs text-[var(--ink-3)]">{t.band}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 7 — PREGUNTAS FRECUENTES (FAQs TFM)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="preguntas" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="mb-10 font-display text-3xl font-bold tracking-tight sm:text-4xl text-center">
            {es ? 'Preguntas Frecuentes (TFM Documentation)' : 'Frequently Asked Questions (TFM)'}
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                className="rounded-[var(--r-m)] border border-[var(--border)] bg-[var(--surface)]"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown
                    className={`size-4 shrink-0 text-[var(--ink-2)] transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {openFaq === i && (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--ink-2)] border-t border-[var(--border)]/50 pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 8 — CTA FINAL TFM
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[var(--sunken)]">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <Rocket className="mx-auto mb-6 size-10 text-[var(--acc-ink)]" aria-hidden />
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
              {es
                ? 'No vuelvas a viajar a un concierto sin la tranquilidad de tener tu caché garantizado.'
                : 'Never hit the road for a gig without guaranteed payment security.'}
            </h2>

            <form
              onSubmit={handleCta}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={es ? 'tu@email.com' : 'your@email.com'}
                className="flex-1 rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--acc)]"
                aria-label="Email"
              />
              <Button type="submit" variant="primary" size="lg">
                {es ? 'EMPEZAR GRATIS AHORA' : 'START FREE NOW'}
              </Button>
            </form>

            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 text-xs text-[var(--ink-3)]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-[var(--ok)]" aria-hidden />
                {es
                  ? 'Garantía de custodia Stripe · Sin permanencia · Configuración en 120 segundos'
                  : 'Stripe escrow guarantee · No commitment · 120-second setup'}
              </span>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--ink-2)] sm:px-6">
          <span>© {year} BandManager.io · Trabajo Fin de Máster (TFM)</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onEntrar}
              className="cursor-pointer font-medium text-[var(--ink)] hover:underline"
            >
              {es ? 'Acceder' : 'Log in'}
            </button>
          </div>
        </div>
      </footer>

      {/* Chatbot TFM */}
      <LandingChatWidget onEntrar={onEntrar} mode="tfm" />
    </div>
  );
};

export default PublicTfmLanding;
