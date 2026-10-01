import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  Music2,
  Printer,
  QrCode,
  Radio,
  Rocket,
  ShieldCheck,
  Sliders,
  Smartphone,
  Star,
  Truck,
  Users,
  Volume2,
} from 'lucide-react';
import { Button } from './ui';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../context/LanguageContext';
import { LandingChatWidget } from './LandingChatWidget';

// ─── Prop types ─────────────────────────────────────────────────────────────
interface PublicLandingProps {
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

const Una: React.FC<{
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  className?: string;
}> = ({ src, alt, ancho, alto, className = '' }) => (
  <img
    src={`/landing/${src}.jpg`}
    alt={alt}
    width={ancho}
    height={alto}
    loading="lazy"
    decoding="async"
    className={`h-auto w-full ${className}`}
  />
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

// ─── Componente principal (Landing Oficial) ──────────────────────────────────
export const PublicLanding: React.FC<PublicLandingProps> = ({ onEntrar }) => {
  const { language, setLanguage } = useLanguage();
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

  const es = language !== 'en';

  // SEO & OpenGraph específico de la Landing Oficial (Músicos, Multibanda, Iris, Setlists)
  useEffect(() => {
    const title = es
      ? 'BandManager · Tu banda, tus repertorios, tus ensayos y tus fans en un solo sitio'
      : 'BandManager · Your bands, setlists, rehearsals and fans in one single place';
    const description = es
      ? 'Plataforma para bandas y músicos independientes: gestión multibanda, separación de pistas con Iris, setlists personalizados por miembro, calendario conjunto y captación de fans con QR. Gratis para empezar.'
      : 'All-in-one platform for independent bands and musicians: multi-band management, Iris stem separation, personalized member setlists, shared calendar, and QR fan capture. Free to start.';

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
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);

    // JSON-LD SoftwareApplication
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BandManager.io',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web, iOS, Android',
      description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    };

    let ldScript = document.getElementById('ld-json-oficial') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'ld-json-oficial';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = 'BandManager';
    };
  }, [es]);

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
          q: '¿Es gratis para empezar a usar BandManager?',
          a: 'Sí, totalmente gratis. Puedes registrar tu banda, cargar repertorios, sincronizar tu calendario conjunto, crear páginas FanLanding con QR y probar las herramientas esenciales sin introducir tarjeta de crédito.',
        },
        {
          q: '¿Cómo funciona la separación de pistas con Iris?',
          a: 'Subes cualquier audio, maqueta o grabación de ensayo (MP3 o WAV) e Iris descompone la mezcla en pistas aisladas: Voz, Bajo, Batería, Guitarras y Teclados. Puedes silenciar tu propio instrumento para ensayar encima como un backing track profesional o aislar pasajes complejos para estudiarlos con metrónomo.',
        },
        {
          q: '¿Cómo funciona el soporte multibanda con una sola cuenta?',
          a: 'Si tocas en dos o más proyectos (o representas a varias bandas), no necesitas cuentas distintas. Cambias de banda en un clic desde el móvil. Lo mejor: el calendario conjunto unifica los ensayos y conciertos de todos tus proyectos para que nunca tengas un solape de fechas.',
        },
        {
          q: '¿Qué significa que los setlists se pueden imprimir personalizados por miembro?',
          a: 'Al imprimir o compartir el repertorio de un concierto, cada músico obtiene su vista específica: el batería ve los BPMs, metrónomo y compases de entrada; el cantante ve las letras y recordatorios; y los guitarristas o bajistas ven las afinaciones, tonalidades y cambios de instrumento.',
        },
        {
          q: '¿Cómo funciona el código QR para captar fans en conciertos?',
          a: 'Generas un código QR vinculado a tu FanLanding para colocar en la mesa de merchan o proyectar en pantalla. Los asistentes lo escanean con su móvil, se suscriben con consentimiento RGPD y se integran directamente en tu lista de fans y en la curva de crecimiento de tus redes sociales.',
        },
        {
          q: '¿Funciona bien en el móvil durante el directo?',
          a: 'Sí. BandManager está diseñado mobile-first e incluye un Modo Escenario de alto contraste que mantiene la pantalla siempre activa, con letras y acordes de lectura inmediata incluso con las luces del escenario.',
        },
      ]
    : [
        {
          q: 'Is it free to start using BandManager?',
          a: 'Yes, completely free. You can register your bands, upload setlists, sync your shared calendar, create FanLanding pages with QR codes, and use core tools without entering a credit card.',
        },
        {
          q: 'How does Iris stem separation work?',
          a: 'Upload any rehearsal recording or demo (MP3/WAV) and Iris isolates individual stems: Vocals, Bass, Drums, Guitars, and Keys. Mute your own instrument to play along with a pristine backing track, or isolate challenging sections to study with the metronome.',
        },
        {
          q: 'How does multi-band support work with a single account?',
          a: 'If you play in multiple projects or session gigs, you do not need separate accounts. Switch bands in one tap on mobile. The unified calendar merges all gigs and rehearsals to guarantee you never double-book dates.',
        },
        {
          q: 'What are personalized member setlists?',
          a: 'When printing or sharing a concert setlist, each musician receives their tailored version: the drummer gets tempos (BPM) and count-ins; the vocalist gets lyrics and notes; guitar and bass get keys, tunings, and instrument changes.',
        },
        {
          q: 'How does the QR code capture fans at live shows?',
          a: 'Generate a QR code linked to your FanLanding for your merch table or stage screen. Attendees scan it in seconds, subscribe with full GDPR compliance, and feed your fan base and social growth analytics.',
        },
        {
          q: 'Does it work smoothly on mobile during live performances?',
          a: 'Yes. Designed mobile-first, it includes a high-contrast Stage Mode that keeps your screen awake and renders chords and lyrics readable under stage lights.',
        },
      ];

  return (
    <div className="h-dvh overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
      <a
        href="#contenido-oficial"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--r-pill)] focus:bg-[var(--surface)] focus:px-4 focus:py-2"
      >
        {es ? 'Saltar al contenido' : 'Skip to content'}
      </a>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
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

          <nav aria-label="Secciones" className="hidden items-center gap-6 text-sm text-[var(--ink-2)] md:flex">
            <a href="#multibanda" className="hover:text-[var(--ink)]">{es ? 'Multibanda' : 'Multi-band'}</a>
            <a href="#iris" className="hover:text-[var(--ink)]">{es ? 'Pistas Iris' : 'Iris Stems'}</a>
            <a href="#repertorios" className="hover:text-[var(--ink)]">{es ? 'Setlists & Escenario' : 'Setlists & Stage'}</a>
            <a href="#fans" className="hover:text-[var(--ink)]">{es ? 'QR & Fans' : 'QR & Fans'}</a>
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

            <Button variant="primary" size="md" onClick={onEntrar} id="landing-entrar">
              {es ? 'Entrar' : 'Log in'}
            </Button>
          </div>
        </div>
      </header>

      <main id="contenido-oficial">
        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 1 — HERO OFICIAL (Para músicos y bandas)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-2)] shadow-sm">
              <span className="size-2 rounded-full bg-[var(--ok)] animate-pulse" />
              {es
                ? '⚡ Espacio integral para músicos y bandas · 100% Gratis para empezar'
                : '⚡ The all-in-one workspace for musicians & bands · 100% Free to start'}
            </p>

            <h1 className="font-display text-[2.25rem] font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {es
                ? 'Gestiona tus grupos, repertorios, calendario unificado y separación de pistas con Iris.'
                : 'Manage your bands, stage setlists, unified calendar, and Iris stem separation.'}
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-[var(--ink-2)] text-pretty sm:text-xl">
              {es
                ? 'Cambia de banda en un toque, ensaya aislando pistas de tus temas con Iris, evita solapes de fechas en el calendario conjunto y reparte setlists personalizados a cada miembro.'
                : 'Switch bands in one tap, practice with Iris-isolated stems, prevent calendar date collisions, and share personalized setlists tailored for every band member.'}
            </p>

            {/* Doble camino de conversión (Máster de Marketing Digital) */}
            <div className="mt-8 flex flex-wrap gap-3">
              {/* Camino 1: Alta intención de registro */}
              <Button variant="primary" size="lg" onClick={onEntrar} id="hero-cta-primario">
                {es ? 'CREAR CUENTA GRATIS EN 2 MINUTOS →' : 'CREATE FREE ACCOUNT IN 2 MINS →'}
              </Button>
              {/* Camino 2: Todavía necesita información / resolver dudas */}
              <a
                href="#es-para-mi"
                className="inline-flex h-11 items-center gap-1.5 rounded-[var(--r-pill)] bg-[var(--sunken)] px-5 text-sm font-semibold text-[var(--ink)] transition-ui hover:brightness-95 border border-[var(--border)]"
              >
                {es ? '¿Es para mi banda? · Resolver dudas' : 'Is it for my band? · FAQs'}
              </a>
            </div>
            <p className="mt-3 text-xs text-[var(--ink-3)]">
              {es
                ? 'Sin tarjeta de crédito · Configuración en 120 segundos · Cancela cuando quieras'
                : 'No credit card required · 120-second setup · Cancel anytime'}
            </p>
          </div>

          <div className="relative mt-14">
            <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:p-3">
              <Captura
                nombre="panel"
                movil="movil-panel"
                alt="Panel de control de BandManager con agenda de conciertos y repertorios"
                eager
              />
            </div>
            {/* Notificación flotante de Iris Stems & Calendario */}
            <div className="absolute -bottom-4 right-4 hidden items-center gap-2 rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold shadow-xl sm:flex">
              <Sliders className="size-4 text-[var(--acc-ink)]" aria-hidden />
              <span>{es ? '🎵 Pistas separadas con Iris listas para ensayar (Voz, Bajo, Batería, Guitarras)' : '🎵 Iris stems ready for rehearsal (Vocals, Bass, Drums, Guitars)'}</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 2 — RESUMEN EJECUTIVO (BLUF)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-[var(--sunken)]" aria-label="Resumen de la plataforma">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--acc-ink)]">
              {es ? 'Resumen de BandManager' : 'BandManager Overview'}
            </p>
            <p className="text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">
              {es
                ? 'BandManager.io es el espacio de trabajo definitivo para músicos y bandas independientes: sincroniza ensayos y conciertos de varios proyectos en un calendario conjunto sin solapes, separa pistas de tus audios con Iris para estudiar en casa silenciando tu instrumento, genera setlists impresos a medida de cada miembro y convierte al público de tus bolos en fans registrados mediante códigos QR en la mesa de merchan.'
                : 'BandManager.io is the definitive workspace for independent musicians and bands: synchronize rehearsals and gigs across multiple projects in a collision-free calendar, isolate audio stems with Iris to practice at home by muting your own instrument, generate personalized print-ready setlists for each player, and convert concert audiences into registered fans via merch table QR codes.'}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 3 — EL CONTRASTE (El Caos vs BandManager)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="mb-10 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {es ? 'Del caos del local de ensayo al control total' : 'From rehearsal room chaos to total control'}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[var(--r-xl)] border border-red-200/40 bg-red-500/5 p-6 sm:p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-red-500">
                {es ? 'Sin BandManager' : 'Without BandManager'}
              </p>
              <ul className="space-y-3.5 text-sm text-[var(--ink-2)]">
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold" aria-hidden>✗</span>
                  <span>{es ? 'Audios y notas de voz perdidas entre cientos de mensajes de WhatsApp.' : 'Voice memos and demos buried in chaotic WhatsApp chats.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold" aria-hidden>✗</span>
                  <span>{es ? 'Solapes de fechas entre ensayos y conciertos de tus distintas bandas.' : 'Date clashes between rehearsals and gigs of your different bands.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold" aria-hidden>✗</span>
                  <span>{es ? 'Setlists escritos a mano en servilletas donde el batería no sabe los BPMs.' : 'Setlists on napkins where the drummer has no BPM or count-in info.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold" aria-hidden>✗</span>
                  <span>{es ? 'Maquetas con mezcla saturada donde no puedes aislar tu instrumento para sacarlo.' : 'Muddled mix demos where you cannot isolate your instrument to learn parts.'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold" aria-hidden>✗</span>
                  <span>{es ? 'Gente que aplaude en el bolo pero de la que jamás vuelves a tener el contacto.' : 'Crowds that applaud at your shows but whose contact you never keep.'}</span>
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
                  <span>{es ? 'Multibanda en 1 clic: cada grupo con su repertorio, miembros y finanzas.' : '1-click Multi-band: each band with isolated setlists, members and money.'}</span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                  <span>{es ? 'Calendario conjunto que avisa de solapes antes de cerrar cualquier fecha.' : 'Shared calendar alerting of collisions before confirming any gig.'}</span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                  <span>{es ? 'Impresión de setlists personalizados por miembro (BPMs, letras, afinaciones).' : 'Personalized member setlists (BPMs for drums, lyrics for vocals, keys).' }</span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                  <span>{es ? 'Separación de pistas con Iris: silencia tu pista y toca sobre el backing track.' : 'Iris stem separation: mute your track and jam over the backing track.'}</span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                  <span>{es ? 'QR y FanLanding con consentimiento RGPD para construir tu base de seguidores.' : 'QR & FanLanding with GDPR consent to build your direct fan community.'}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 4 — MULTIBANDA (La clave para músicos activos)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="multibanda" className="bg-[var(--sunken)] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--acc-ink)] mb-4">
                  <Layers className="size-3.5" />
                  {es ? 'Gestión Multibanda' : 'Multi-band Management'}
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-5">
                  {es ? 'Dos o más bandas. Una sola cuenta.' : 'Two or more bands. One single account.'}
                </h2>
                <div className="space-y-4 text-base text-[var(--ink-2)]">
                  <p>
                    {es
                      ? 'Cambias de banda en un toque: cada proyecto mantiene su propio repertorio, sus miembros, sus archivos de audio y sus notas de ensayo.'
                      : 'Switch bands in one tap: every project keeps its own repertoire, bandmates, audio files, and rehearsal notes.'}
                  </p>
                  <p>
                    {es
                      ? '¿Tocas el bajo en un grupo de rock y el teclado en una big band? El calendario conjunto unifica los bolos y ensayos de todas tus bandas en una sola vista, alertándote si intentan fijar dos eventos el mismo día.'
                      : 'Play bass in a rock trio and keys in a jazz big band? The unified calendar merges rehearsals and shows across all projects, preventing double-bookings.'}
                  </p>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm text-[var(--ink-2)]">
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-[var(--ok)] shrink-0" />
                    <span>{es ? 'Aislamiento de repertorio y setlists por banda' : 'Separate setlists and song archives per band'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-[var(--ok)] shrink-0" />
                    <span>{es ? 'Calendario unificado anti-solapes' : 'Unified collision-free calendar'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-[var(--ok)] shrink-0" />
                    <span>{es ? 'Gestión de roles de miembro o administrador' : 'Admin & musician role permissions'}</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-7">
                <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-2 sm:p-3 shadow-md">
                  <Captura
                    nombre="bandas"
                    movil="m-bandas"
                    alt="Selector multibanda de BandManager con proyectos activos"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 5 — SEPARACIÓN DE PISTAS CON IRIS (SUPER IMPORTANTE)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="iris" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-6 sm:p-8 border border-[var(--border)]">
                {/* Visual interactivo simulado del motor Iris */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2.5">
                      <Sliders className="size-5 text-[var(--acc-ink)]" />
                      <span className="font-semibold text-base">{es ? 'Motor Iris · Separador de Pistas' : 'Iris Engine · Stem Separator'}</span>
                    </div>
                    <span className="rounded-full bg-[var(--ok)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--ok)]">
                      {es ? '5 pistas extraídas' : '5 stems extracted'}
                    </span>
                  </div>

                  {/* Pistas */}
                  {[
                    { nombre: es ? '🎤 Voz Principal' : '🎤 Lead Vocals', vol: 80, solo: false, mute: false },
                    { nombre: es ? '🎸 Guitarra' : '🎸 Guitars', vol: 90, solo: false, mute: false },
                    { nombre: es ? '🎹 Teclados / Secuencias' : '🎹 Keys & Synths', vol: 70, solo: false, mute: false },
                    { nombre: es ? '🎸 Bajo Eléctrico (Tu instrumento)' : '🎸 Bass (Your part)', vol: 0, solo: false, mute: true, highlight: true },
                    { nombre: es ? '🥁 Batería' : '🥁 Drums', vol: 85, solo: false, mute: false },
                  ].map((track) => (
                    <div
                      key={track.nombre}
                      className={`flex items-center justify-between rounded-[var(--r-m)] p-3 border ${
                        track.highlight
                          ? 'border-[var(--acc)] bg-[var(--acc)]/5'
                          : 'border-[var(--border)] bg-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Volume2 className={`size-4 ${track.mute ? 'text-red-400' : 'text-[var(--acc-ink)]'}`} />
                        <span className={`text-sm font-medium ${track.highlight ? 'text-[var(--acc-ink)] font-bold' : ''}`}>
                          {track.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {track.mute ? (
                          <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">
                            {es ? 'MUTED (Ensayando encima)' : 'MUTED (Playing along)'}
                          </span>
                        ) : (
                          <div className="h-2 w-20 rounded-full bg-[var(--border)] overflow-hidden">
                            <div className="h-full bg-[var(--acc)]" style={{ width: `${track.vol}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <p className="text-xs text-[var(--ink-3)] pt-2 text-center">
                    {es
                      ? '⚡ Iris aísla automáticamente cada instrumento con calidad de estudio a partir de cualquier archivo de audio.'
                      : '⚡ Iris automatically isolates each instrument with studio clarity from any audio file.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--acc-ink)] mb-4">
                <Sliders className="size-3.5" />
                {es ? 'Separación de Pistas con Iris' : 'Iris Stem Separation'}
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-5">
                {es ? 'Iris: ensaya silenciando tu instrumento.' : 'Iris: rehearse by muting your own part.'}
              </h2>
              <div className="space-y-4 text-base text-[var(--ink-2)]">
                <p>
                  {es
                    ? 'Se acabó intentar adivinar qué notas suenan en una maqueta embarrada. Subes el tema e Iris separa automáticamente voz, bajo, batería, guitarras y teclados en pistas independientes.'
                    : 'Stop guessing notes from a muddy rehearsal recording. Upload your track and Iris automatically splits vocals, bass, drums, guitars, and keyboards into isolated stems.'}
                </p>
                <p>
                  {es
                    ? 'Silencia tu instrumento para tocar por encima con un backing track perfecto, o aísla tu parte para estudiar cada matiz antes del ensayo con metrónomo y BPMs ajustables.'
                    : 'Mute your instrument to jam over a flawless backing track, or solo your part to master every nuance before band practice with an interactive metronome.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 6 — SETLISTS EN DIRECTO & IMPRESIÓN PERSONALIZADA
        ══════════════════════════════════════════════════════════════════ */}
        <section id="repertorios" className="bg-[var(--sunken)] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--acc-ink)] mb-4">
                  <Printer className="size-3.5" />
                  {es ? 'Setlists e Impresión a Medida' : 'Setlists & Custom Printouts'}
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-5">
                  {es
                    ? 'Un setlist que se lee como un show. Y una copia a medida para cada uno.'
                    : 'A setlist that reads like a show. And a custom copy for each player.'}
                </h2>
                <div className="space-y-4 text-base text-[var(--ink-2)]">
                  <p>
                    {es
                      ? 'El mapa de energía te muestra el arco del directo: tempo, tonalidad y picos de intensidad para que el concierto no tenga bajones.'
                      : 'The energy map plots the live arc: tempo, key signatures, and intensity peaks to keep the show thrilling.'}
                  </p>
                  <p>
                    {es
                      ? 'Y a la hora de imprimir o pasar al móvil, cada músico recibe su versión personalizada: el batería ve los BPMs y compases de entrada; el cantante ve letras y notas; el bajista afinaciones y tonalidades.'
                      : 'When printing or sending to phones, each musician gets their personalized printout: the drummer gets BPMs and count-ins; the singer sees lyrics and cues; the bassist gets tunings and keys.'}
                  </p>
                  <p>
                    {es
                      ? 'En directo, activa el Modo Escenario: pantalla de alto contraste que no se bloquea y se lee impecablemente bajo los focos.'
                      : 'On stage, engage Stage Mode: awake screen with high-contrast text that stays legible under stage lighting.'}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-2 sm:p-3 shadow-md">
                  <Captura
                    nombre="repertorio"
                    movil="m-repertorio"
                    alt="Setlist interactivo de BandManager con mapa de energía de concierto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 7 — CALENDARIO CONJUNTO & GESTIÓN DE GIRAS
        ══════════════════════════════════════════════════════════════════ */}
        <section id="calendario" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:p-3">
                <Captura
                  nombre="calendario"
                  movil="m-calendario"
                  alt="Calendario unificado de BandManager para conciertos y ensayos"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--acc-ink)] mb-4">
                <Truck className="size-3.5" />
                {es ? 'Calendario y Rutas de Gira' : 'Calendar & Tour Logistics'}
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-5">
                {es ? 'Bolos, ensayos y furgo, sin perderte.' : 'Gigs, rehearsals, and van routes, without getting lost.'}
              </h2>
              <div className="space-y-4 text-base text-[var(--ink-2)]">
                <p>
                  {es
                    ? 'Conciertos, ensayos y reuniones en un único calendario que cruza todas tus bandas para evitar solapes de compromisos.'
                    : 'Gigs, rehearsals, and band meetings on a single calendar that merges all your bands to prevent double-bookings.'}
                </p>
                <p>
                  {es
                    ? 'Hojas de ruta, hora de carga, prueba de sonido, aforo y reparto transparente de gastos de gasolina, peajes y dietas.'
                    : 'Day sheets, load-in times, soundchecks, venue capacities, and transparent split of van expenses, fuel, and per diems.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 8 — FANLANDING, QR EN EL MERCHAN & REDES
        ══════════════════════════════════════════════════════════════════ */}
        <section id="fans" className="bg-[var(--sunken)] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--acc-ink)] mb-4">
                  <QrCode className="size-3.5" />
                  {es ? 'QR y Captación de Fans' : 'QR & Fan Acquisition'}
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-5">
                  {es
                    ? 'Un QR en la mesa de merchan. Fans reales en tu lista.'
                    : 'A QR on the merch table. Real fans in your community.'}
                </h2>
                <div className="space-y-4 text-base text-[var(--ink-2)]">
                  <p>
                    {es
                      ? 'Pegas el QR en el stand de merchan o lo proyectas en el escenario: el fan lo escanea con la cámara del móvil en 5 segundos.'
                      : 'Place the QR code on your merch stand or project it on stage: fans scan it in 5 seconds with their mobile camera.'}
                  </p>
                  <p>
                    {es
                      ? 'Con consentimiento RGPD integrado, te dejan su email para enterarse del próximo show y te siguen en Spotify, Instagram y YouTube.'
                      : 'With built-in GDPR compliance, they leave their email for upcoming tour dates and follow your Spotify, Instagram, and YouTube.'}
                  </p>
                  <p>
                    {es
                      ? 'Todas tus métricas de redes sociales unificadas en una sola curva de crecimiento.'
                      : 'All your social media statistics tracked in a single consolidated growth curve.'}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-2 sm:p-3 shadow-md">
                  <Captura
                    nombre="fans"
                    movil="m-fans"
                    alt="Panel de captación de fans de BandManager"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 9 — ¿ES PARA MI BANDA? (Resolución de Objeciones y Encaje)
            Basado en las Reglas de Oro del Máster de Marketing Digital
        ══════════════════════════════════════════════════════════════════ */}
        <section id="es-para-mi" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--acc-ink)] mb-3">
              <Users className="size-3.5" />
              {es ? 'Encaje y Dudas Habituales' : 'Fit & Common Questions'}
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {es ? '¿BandManager es para mi grupo o proyecto?' : 'Is BandManager right for my band or project?'}
            </h2>
            <p className="mt-3 text-base text-[var(--ink-2)]">
              {es
                ? 'Diseñado específicamente para músicos que tocan en directo y ensayan habitualmente.'
                : 'Designed specifically for gigging musicians and active rehearsing bands.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                pregunta: es ? '¿Toco en más de un grupo o proyecto?' : 'Do I play in more than one band?',
                respuesta: es
                  ? 'Totalmente. Es uno de sus puntos fuertes: cambias de banda en 1 clic y el calendario conjunto cruza los bolos y ensayos de todos tus proyectos para que jamás se pisen.'
                  : 'Absolutely. Switch bands in one tap and the shared calendar synchronizes rehearsals and gigs across all projects so dates never collide.',
              },
              {
                pregunta: es ? '¿Nuestras maquetas no tienen calidad de estudio?' : 'Our rehearsal demos are not studio-grade?',
                respuesta: es
                  ? 'No importa. Iris está entrenado para procesar grabaciones de local, audios de móvil y maquetas caseras, aislando voz, bajo, batería, guitarras y teclados con nitidez.'
                  : 'No problem. Iris is trained to process phone recordings, rehearsal room tapes, and bedroom demos, cleanly separating vocals, bass, drums, guitars, and keys.',
              },
              {
                pregunta: es ? '¿Cada músico necesita una vista diferente del setlist?' : 'Does each player need a different setlist view?',
                respuesta: es
                  ? 'Exacto. Puedes imprimir o compartir setlists a medida: el batería con BPMs y notas de entrada, el cantante con letras, y los cuerdas con afinaciones y acordes.'
                  : 'Exactly. Print or share tailored setlists: the drummer gets tempos and count-ins, the singer gets lyrics, and guitarists get tunings and chord charts.',
              },
              {
                pregunta: es ? '¿Tenemos que meter tarjeta de crédito?' : 'Do we have to enter a credit card?',
                respuesta: es
                  ? 'No. Empiezas con una cuenta gratuita para siempre. Puedes dar de alta a tu banda, probar Iris y usar el calendario sin pagar nada ni compromisos.'
                  : 'No. You start with a free account forever. Set up your band, test Iris, and use the calendar with zero payment or card requirements.',
              },
              {
                pregunta: es ? '¿Sirve para solistas, dúos o big bands?' : 'Does it fit solo artists, duos, or big bands?',
                respuesta: es
                  ? 'Sí. Desde un solista que gestiona sus backing tracks y redes, hasta una banda de 20 músicos coordinando partituras y hojas de ruta en el escenario.'
                  : 'Yes. From a solo performer managing backing tracks and socials, to a 20-piece big band coordinating charts and stage day sheets.',
              },
              {
                pregunta: es ? '¿Qué pasa si tengo dudas durante el uso?' : 'What if I have questions while using it?',
                respuesta: es
                  ? 'Dispones de un asistente inteligente 24/7 integrado en la app para resolver cualquier duda al instante, además de soporte directo de músico a músico.'
                  : 'You have a 24/7 assistant integrated into the platform to resolve doubts instantly, alongside direct musician-to-musician support.',
              },
            ].map((card) => (
              <div
                key={card.pregunta}
                className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="size-4 text-[var(--ok)] shrink-0" />
                    <h3 className="font-semibold text-sm text-[var(--ink)]">{card.pregunta}</h3>
                  </div>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">{card.respuesta}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 10 — DE MÚSICO A MÚSICO (Autoridad con dato concreto)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="origen" className="bg-[var(--sunken)] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-[var(--r-xl)] bg-[var(--surface)] p-6 sm:p-10 lg:p-12 border border-[var(--border)] shadow-md">
              <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
                <div className="md:col-span-5">
                  <div className="relative mx-auto aspect-[4/5] max-w-sm overflow-hidden rounded-[var(--r-l)] bg-[var(--sunken)]">
                    {!fotoError ? (
                      <img
                        src="/landing/diego-creador.jpg?v=3"
                        alt={es ? 'Diego tocando el bajo en directo' : 'Diego playing bass live on stage'}
                        width={480}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                        onError={() => setFotoError(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-[var(--ink-2)]">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--acc-ink)]">
                          <Music2 className="size-7" aria-hidden />
                        </div>
                        <p className="font-display text-sm font-semibold text-[var(--ink)]">
                          {es ? 'Foto del creador' : "Founder's photo"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-7">
                  <p className="mb-3 text-sm font-semibold text-[var(--acc-ink)]">
                    {es ? 'De músico a músico' : 'From musician to musician'}
                  </p>
                  <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl lg:text-4xl">
                    {es ? 'Construido desde el local de ensayo.' : 'Built straight from the rehearsal room.'}
                  </h2>
                  <div className="mt-5 space-y-4 text-base text-[var(--ink-2)] sm:text-lg">
                    <p>
                      {es
                        ? 'Hola, soy Diego. Llevo más de 15 años tocando el teclado y el bajo en directo en varios grupos de rock y en una big band de jazz.'
                        : "Hi, I'm Diego. I've been playing live keys and bass for over 15 years in rock bands and a jazz big band."}
                    </p>
                    <p>
                      {es
                        ? 'Sé de primera mano lo difícil que es poner de acuerdo a la gente, lidiar con maquetas donde no se entiende nada y coordinar a músicos sobre un escenario con hojas de cálculo y WhatsApps que nadie lee.'
                        : 'I know first-hand how hard it is to get everyone on the same page, learn songs from muddy rehearsal demos, and coordinate a band with spreadsheets and WhatsApps nobody reads.'}
                    </p>
                    <p>
                      {es
                        ? 'Creé BandManager para quitarle todo ese barro a los músicos: que puedas cambiar de banda en 1 clic, separar pistas con Iris para ensayar a tu ritmo y tener setlists limpios y a medida de cada instrumento. Para que nos centremos en lo único que de verdad importa: tocar.'
                        : 'I built BandManager to clear away all that friction: switch bands in 1 tap, isolate tracks with Iris to practice cleanly, and share tailored setlists for each instrument. So we can focus on what truly matters: making music.'}
                    </p>
                    <p className="font-semibold text-[var(--ink)]">
                      {es
                        ? 'Si a nosotros nos habría ahorrado cientos de horas de caos, a tu banda le va a cambiar la vida.'
                        : "If it would have saved us hundreds of chaotic hours, it will transform your band's daily life."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 10 — PREGUNTAS FRECUENTES (FAQs OFICIALES)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="preguntas" className="bg-[var(--sunken)] py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="mb-10 font-display text-3xl font-bold tracking-tight sm:text-4xl text-center">
              {es ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
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
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 11 — CTA FINAL
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <Rocket className="mx-auto mb-6 size-10 text-[var(--acc-ink)]" aria-hidden />
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
              {es
                ? 'El local de ensayo está listo. Vamos a poner a tu banda en orden.'
                : 'The rehearsal room is ready. Let’s organize your band.'}
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
                  ? 'Plan gratuito para empezar · Sin tarjeta · Configuración en 120 segundos'
                  : 'Free plan to start · No card required · 120-second setup'}
              </span>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--ink-2)] sm:px-6">
          <span>© {year} BandManager.io · {es ? 'De músico a músico' : 'By musicians, for musicians'}</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onEntrar}
              className="cursor-pointer font-medium text-[var(--ink)] hover:underline"
            >
              {es ? 'Entrar' : 'Log in'}
            </button>
          </div>
        </div>
      </footer>

      {/* Chatbot Oficial (modo 'oficial') */}
      <LandingChatWidget onEntrar={onEntrar} mode="oficial" />
    </div>
  );
};

export default PublicLanding;
