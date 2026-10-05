import { ShowIcon } from './ui/ShowIcon';
import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  Rocket,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import { Button } from './ui';
import { useLanguage, SupportedLanguage } from '../context/LanguageContext';
import { LandingChatWidget } from './LandingChatWidget';

interface PublicTfmLandingProps {
  onEntrar: () => void;
}

const LANG_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

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

export const PublicTfmLanding: React.FC<PublicTfmLandingProps> = ({ onEntrar }) => {
  const { language, setLanguage } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const es = language === 'es';

  useEffect(() => {
    document.title = 'BandManager.io · Demostración TFM';
  }, []);

  const handleCta = (e: React.FormEvent) => {
    e.preventDefault();
    onEntrar();
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as SupportedLanguage);
  };

  const year = new Date().getFullYear();

  const FAQS = es
    ? [
        {
          q: '¿Cómo funciona la custodia de pagos (Escrow) con Stripe?',
          a: 'Al cerrar un bolo, la sala firma digitalmente y deposita el 50% de señal en una cuenta fiduciaria segura vía Stripe Connect. El dinero queda protegido y se libera automáticamente a la banda tras la actuación.',
        },
        {
          q: '¿Cómo separa las pistas la IA de Iris?',
          a: 'Iris procesa cualquier pista o maqueta en alta fidelidad y extrae de forma limpia pistas individuales (voz, bajo, batería, guitarra, teclado) para ensayar silenciando instrumentos o estudiando pasajes concretos.',
        },
        {
          q: '¿Qué diferencia hay entre gestionar una o varias bandas?',
          a: 'La arquitectura multi-inquilino permite a un mismo músico pertenecer a varios proyectos. El calendario unificado cruza ensayos y conciertos para avisar al instante de posibles solapes de fechas.',
        },
        {
          q: '¿Tiene algún coste probar la plataforma?',
          a: 'No. El entorno de evaluación académica y el plan de arranque son completamente gratuitos para pruebas y revisión del TFM.',
        },
      ]
    : [
        {
          q: 'How does Stripe deposit escrow work?',
          a: 'When confirming a gig, the venue signs digitally and deposits a 50% advance into a secure trust account via Stripe Connect. Funds are held safely and released to the band once the performance is completed.',
        },
        {
          q: 'How does the Iris stem separation AI work?',
          a: 'Iris processes raw audio files or rehearsal takes to cleanly isolate stems (vocals, bass, drums, guitars, keys) so musicians can mute their part to practice along.',
        },
        {
          q: 'What is the advantage of managing multiple bands?',
          a: 'The multi-tenant architecture allows a musician to belong to several projects. The unified calendar automatically cross-references rehearsals and gig dates to flag conflicts.',
        },
        {
          q: 'Is there any cost to test the platform?',
          a: 'No. The evaluation environment and starter access tier are completely free for academic review and band testing.',
        },
      ];

  return (
    <div className="h-dvh overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/95">
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
            <span className="rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--ink)]">
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
              data-raw
              value={language === 'es' || language === 'en' ? language : 'es'}
              onChange={handleLangChange}
              aria-label={es ? 'Idioma' : 'Language'}
              className="cursor-pointer rounded-[var(--r-pill)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] transition-ui hover:text-[var(--ink)] focus:outline-none"
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
        {/* HERO TFM */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-2)]">
              <ShieldCheck className="size-3.5 text-[var(--ok)]" aria-hidden />
              {es
                ? 'Sistema de Gestión de Giras y Contratos con Garantía de Depósito'
                : 'Tour Management & Digital Contracts with Deposit Escrow Guarantee'}
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
                {es ? 'Crear cuenta gratis →' : 'Create free account →'}
              </Button>
              <a
                href="#como-funciona"
                className="inline-flex h-11 items-center gap-1.5 rounded-[var(--r-pill)] bg-[var(--sunken)] px-5 text-sm font-semibold text-[var(--ink)] transition-ui hover:brightness-95"
              >
                {es ? 'Ver Demo de Contrato y Escrow' : 'View Contract & Escrow Demo'}
              </a>
            </div>
            <p className="mt-3 text-xs text-[var(--ink-2)]">
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
            <div className="absolute -bottom-4 right-4 hidden items-center gap-2 rounded-[var(--r-pill)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold sm:flex">
              <ShieldCheck className="size-4 text-[var(--ok)]" aria-hidden />
              <span>{es ? 'Señal de 250 € retenida en custodia por Stripe Connect' : '€250 deposit held in escrow by Stripe Connect'}</span>
            </div>
          </div>
        </section>

        {/* RESUMEN EJECUTIVO */}
        <section className="bg-[var(--sunken)]" aria-label="Resumen Ejecutivo">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <p className="mb-2 text-xs font-bold text-[var(--acc-ink)]">
              {es ? 'Resumen Ejecutivo (TFM Project Definition)' : 'Executive Summary (TFM Project Definition)'}
            </p>
            <p className="text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">
              {es
                ? 'BandManager.io es la plataforma integral de gestión para música en directo que unifica la creación de Dossieres Digitales (EPK), la firma de contratos de actuación con depósito en custodia neutra (Escrow), la separación inteligente de pistas de audio con Iris y la automatización de la hoja de ruta. Reduce el tiempo de gestión administrativa en un 70% y elimina los impagos en salas independientes.'
                : 'BandManager.io is the comprehensive live music operating system that unifies interactive EPKs, digital performance agreements with neutral escrow deposits, Iris stem separation, and tour logistics. It cuts administrative overhead by 70% while eradicating non-payment risks in independent venue circuits.'}
            </p>
          </div>
        </section>

        {/* CONTRASTE */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="mb-10 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {es ? 'El Contraste: del caos administrativo al control profesional' : 'The Contrast: from administrative chaos to professional control'}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-6 sm:p-8">
              <p className="mb-4 text-sm font-bold text-[var(--alert)]">
                {es ? 'El Caos Tradicional (Sin BandManager)' : 'Traditional Chaos (Without BandManager)'}
              </p>
              <ul className="space-y-3.5 text-sm text-[var(--ink-2)]">
                <li className="flex gap-3">
                  <span className="text-[var(--alert)] font-bold" aria-hidden>✕</span>
                  <span>{es ? 'Excels desfasados y hojas de cálculo que nadie mantiene al día.' : 'Outdated spreadsheets that nobody keeps synchronized.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--alert)] font-bold" aria-hidden>✕</span>
                  <span>{es ? 'Acuerdos de palabra en WhatsApp sin validez jurídica ante cancelaciones.' : 'Verbal WhatsApp agreements with zero legal enforceability.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--alert)] font-bold" aria-hidden>✕</span>
                  <span>{es ? 'Salas que cancelan a 24 horas del show y se niegan a abonar el caché acordado.' : 'Venues cancelling 24h prior, refusing to pay agreed guarantees.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--alert)] font-bold" aria-hidden>✕</span>
                  <span>{es ? 'Pérdida recurrente de dinero en furgoneta, gasolina y dietas sin liquidación clara.' : 'Money lost in travel and van logistics without transparent settlement.'}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6 sm:p-8">
              <p className="mb-4 text-sm font-bold text-[var(--ok)]">
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

        {/* DEMOSTRACIÓN EN 3 PASOS */}
        <section id="como-funciona" className="bg-[var(--sunken)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <h2 className="mb-12 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {es ? 'Demostración en 3 pasos: cómo funciona' : 'Three-Step Demonstration: how it works'}
            </h2>
            <ol className="grid gap-6 md:grid-cols-3">
              <li className="rounded-[var(--r-l)] bg-[var(--surface)] p-6">
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
              <li className="rounded-[var(--r-l)] bg-[var(--surface)] p-6">
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
              <li className="rounded-[var(--r-l)] bg-[var(--surface)] p-6">
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

        {/* MULTIBANDA & IRIS */}
        <section id="multibanda-iris" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-14">
            <p className="mb-2 text-xs font-bold text-[var(--acc-ink)]">
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
              <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--ink)] mb-4">
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
              <div className="rounded-[var(--r-m)] bg-[var(--surface)] p-4 text-xs text-[var(--ink-2)] space-y-2">
                <div className="flex items-center justify-between font-semibold text-[var(--ink)]">
                  <span><ShowIcon inline emoji="🎸" /> Os Herdeiros do Código</span>
                  <span className="text-[var(--ok)]">Sala Capitol · Negociando 80/20</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-[var(--ink)]">
                  <span><ShowIcon inline emoji="⚡" /> Master of Prompts</span>
                  <span className="text-[var(--acc-ink)]">Resurrection Fest · Confirmado</span>
                </div>
                <p className="text-micro text-[var(--ink-2)] pt-1">
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
              <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--ink)] mb-4">
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
                <span className="rounded-[var(--r-pill)] bg-[var(--surface)] px-3 py-1 font-mono">
                  <ShowIcon inline emoji="🥁" /> Batería: Brais Moure
                </span>
                <span className="rounded-[var(--r-pill)] bg-[var(--surface)] px-3 py-1 font-mono">
                  <ShowIcon inline emoji="⚡" /> 214 BPM · Em
                </span>
                <span className="rounded-[var(--r-pill)] bg-[var(--surface)] px-3 py-1 font-mono">
                  <ShowIcon inline emoji="🎸" /> Riff: Palmuting
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PRUEBA SOCIAL */}
        <section className="bg-[var(--sunken)] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mb-12 font-display text-3xl font-bold tracking-tight sm:text-4xl text-center">
              {es ? 'Métricas de Garantía y Validación' : 'Validation Metrics & Assurance'}
            </h2>

            <div className="grid gap-6 sm:grid-cols-3 mb-12">
              <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6 text-center">
                <p className="font-display text-4xl font-bold text-[var(--acc-ink)]">+1.200</p>
                <p className="mt-1 text-sm text-[var(--ink-2)]">{es ? 'Conciertos Gestionados' : 'Gigs Managed'}</p>
              </div>
              <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6 text-center">
                <p className="font-display text-4xl font-bold text-[var(--ok)]">0%</p>
                <p className="mt-1 text-sm text-[var(--ink-2)]">{es ? 'Impagos con Sistema Escrow' : 'Non-payments with Escrow'}</p>
              </div>
              <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6 text-center">
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
                <div key={t.name} className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6">
                  <div className="mb-3 flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--ink-2)] mb-4">"{t.quote}"</p>
                  <p className="text-sm font-semibold text-[var(--ink)]">{t.name}</p>
                  <p className="text-xs text-[var(--ink-2)]">{t.band}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PREGUNTAS FRECUENTES */}
        <section id="preguntas" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="mb-10 font-display text-3xl font-bold tracking-tight sm:text-4xl text-center">
            {es ? 'Preguntas Frecuentes (TFM Documentation)' : 'Frequently Asked Questions (TFM)'}
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                className="rounded-[var(--r-m)] bg-[var(--surface)]"
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
                  <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--ink-2)] pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative overflow-hidden bg-[var(--sunken)]">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <Rocket className="mx-auto mb-6 size-10 text-[var(--acc-ink)]" aria-hidden />
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
              {es
                ? 'No vuelvas a viajar a un concierto sin la tranquilidad de tener tu caché garantizado.'
                : 'Never hit the road for a gig without guaranteed payment security.'}
            </h2>

            <div className="mt-8 flex justify-center">
              <Button onClick={onEntrar} variant="primary" size="lg">
                {es ? 'Empezar gratis ahora' : 'Start free now'} <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>

            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 text-xs text-[var(--ink-2)]">
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

      {/* FOOTER */}
      <footer className="bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--ink-2)] sm:px-6">
          <span><ShowIcon inline emoji="©" /> {year} BandManager.io · Trabajo Fin de Máster (TFM)</span>
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
