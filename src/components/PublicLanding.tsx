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
/** Par de imágenes light/dark que el CSS oculta según el tema activo. */
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

/** Captura responsiva: desktop en ≥sm, móvil por debajo. */
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

// ─── Constantes ─────────────────────────────────────────────────────────────
const LANG_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

const LOCALE_KEY = 'bandmanager_locale';

// ─── Componente principal ────────────────────────────────────────────────────
export const PublicLanding: React.FC<PublicLandingProps> = ({ onEntrar }) => {
  const { t, language, setLanguage } = useLanguage();
  const [fotoError, setFotoError] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  // Selector de idioma: leer preferencia guardada al montar
  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_KEY) as SupportedLanguage | null;
    if (saved && (saved === 'es' || saved === 'en') && saved !== language) {
      setLanguage(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir idioma y actualizar <html lang>
  useEffect(() => {
    if (language === 'es' || language === 'en') {
      localStorage.setItem(LOCALE_KEY, language);
    }
    document.documentElement.lang = language;
  }, [language]);

  // Meta SEO + Open Graph + JSON-LD
  useEffect(() => {
    const title = t('landing.meta.title');
    const description = t('landing.meta.description');
    const url = 'https://bandmanager.io';
    const image = `${url}/landing/og-bandmanager.jpg`;

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
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', image);

    // JSON-LD: SoftwareApplication + FAQPage
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'BandManager.io',
          url,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web, iOS, Android',
          description,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'EUR',
            description: language === 'es' ? 'Plan gratuito disponible' : 'Free plan available',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '312',
            bestRating: '5',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: t('landing.faq1.q'), acceptedAnswer: { '@type': 'Answer', text: t('landing.faq1.a') } },
            { '@type': 'Question', name: t('landing.faq2.q'), acceptedAnswer: { '@type': 'Answer', text: t('landing.faq2.a') } },
            { '@type': 'Question', name: t('landing.faq3.q'), acceptedAnswer: { '@type': 'Answer', text: t('landing.faq3.a') } },
            { '@type': 'Question', name: t('landing.faq4.q'), acceptedAnswer: { '@type': 'Answer', text: t('landing.faq4.a') } },
          ],
        },
      ],
    };

    let ldScript = document.getElementById('ld-json') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'ld-json';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = 'BandManager';
    };
  }, [language, t]);

  // Manejar el formulario CTA final
  const handleCta = (e: React.FormEvent) => {
    e.preventDefault();
    onEntrar();
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as SupportedLanguage);
  };

  const year = new Date().getFullYear();

  // FAQs como array para iterar
  const FAQS = [
    { q: t('landing.faq1.q'), a: t('landing.faq1.a') },
    { q: t('landing.faq2.q'), a: t('landing.faq2.a') },
    { q: t('landing.faq3.q'), a: t('landing.faq3.a') },
    { q: t('landing.faq4.q'), a: t('landing.faq4.a') },
  ];

  return (
    <div className="h-dvh overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
      {/* Saltar al contenido — accesibilidad */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--r-pill)] focus:bg-[var(--surface)] focus:px-4 focus:py-2"
      >
        {language === 'es' ? 'Saltar al contenido' : 'Skip to content'}
      </a>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
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

          {/* Navegación desktop */}
          <nav aria-label="Secciones" className="hidden items-center gap-6 text-sm text-[var(--ink-2)] md:flex">
            <a href="#como-funciona" className="hover:text-[var(--ink)]">{t('landing.nav.howto')}</a>
            <a href="#preguntas" className="hover:text-[var(--ink)]">{t('landing.nav.faq')}</a>
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            {/* Selector de idioma */}
            <select
              value={language === 'es' || language === 'en' ? language : 'es'}
              onChange={handleLangChange}
              aria-label={language === 'es' ? 'Idioma' : 'Language'}
              className="cursor-pointer rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] transition-ui hover:text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--acc)]"
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>

            <Button variant="primary" size="md" onClick={onEntrar} id="landing-entrar">
              {t('landing.nav.enter')}
            </Button>
          </div>
        </div>
      </header>

      <main id="contenido">
        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 1 — ABOVE THE FOLD (Hero)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="max-w-3xl">
            {/* Micro-badge */}
            <p className="mb-5 inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-2)]">
              <ShieldCheck className="size-3.5 text-[var(--ok)]" aria-hidden />
              {t('landing.badge')}
            </p>

            {/* H1 */}
            <h1 className="font-display text-[2.25rem] font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t('landing.hero.h1')}
            </h1>

            {/* H2 / subtítulo */}
            <p className="mt-5 max-w-2xl text-lg text-[var(--ink-2)] text-pretty sm:text-xl">
              {t('landing.hero.h2')}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" size="lg" onClick={onEntrar}>
                {t('landing.hero.cta.primary')} <ArrowRight className="size-4" aria-hidden />
              </Button>
              <a
                href="#como-funciona"
                className="inline-flex h-11 items-center gap-1.5 rounded-[var(--r-pill)] bg-[var(--sunken)] px-5 text-sm font-semibold text-[var(--ink)] transition-ui hover:brightness-95"
              >
                {t('landing.hero.cta.secondary')}
              </a>
            </div>
            <p className="mt-3 text-xs text-[var(--ink-3)]">{t('landing.hero.cta.note')}</p>
          </div>

          {/* Mockup hero */}
          <div className="relative mt-14">
            <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:p-3">
              <Captura
                nombre="panel"
                movil="movil-panel"
                alt={
                  language === 'es'
                    ? 'Panel de BandManager con alertas del mánager y la agenda de bolos'
                    : 'BandManager dashboard with manager alerts and gig agenda'
                }
                eager
              />
            </div>
            {/* Notificación flotante — "señal garantizada" */}
            <div className="absolute -bottom-4 right-4 hidden items-center gap-2 rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold shadow-lg sm:flex">
              <ShieldCheck className="size-4 text-[var(--ok)]" aria-hidden />
              {language === 'es' ? '🎸 Señal de 250 € retenida en custodia · Stripe' : '🎸 €250 deposit held in escrow · Stripe'}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 2 — RESUMEN EJECUTIVO GEO
        ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-[var(--sunken)]" aria-label={t('landing.summary.label')}>
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--acc-ink)]">
              {t('landing.summary.label')}
            </p>
            <p className="text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">
              {t('landing.summary.text')}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 3 — CONTRASTE (Antes / Después)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="mb-10 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.contrast.title')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Antes */}
            <div className="rounded-[var(--r-xl)] border border-red-200/40 bg-red-500/5 p-6 sm:p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-red-400">
                {t('landing.contrast.before.title')}
              </p>
              <ul className="space-y-3">
                {t('landing.contrast.before.items').split(' · ').map((item) => (
                  <li key={item} className="flex gap-3 text-[var(--ink-2)]">
                    <span className="mt-0.5 text-red-400" aria-hidden>✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Después */}
            <div className="rounded-[var(--r-xl)] border border-[var(--ok)]/30 bg-[var(--ok)]/5 p-6 sm:p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--ok)]">
                {t('landing.contrast.after.title')}
              </p>
              <ul className="space-y-3">
                {t('landing.contrast.after.items').split(' · ').map((item) => (
                  <li key={item} className="flex gap-3 text-[var(--ink-2)]">
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 4 — CÓMO FUNCIONA (3 pasos)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="como-funciona" className="bg-[var(--sunken)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <h2 className="mb-12 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.steps.title')}
            </h2>
            <ol className="grid gap-6 md:grid-cols-3">
              {[
                { n: '1', title: t('landing.steps.1.title'), text: t('landing.steps.1.text') },
                { n: '2', title: t('landing.steps.2.title'), text: t('landing.steps.2.text') },
                { n: '3', title: t('landing.steps.3.title'), text: t('landing.steps.3.text') },
              ].map((p) => (
                <li key={p.n} className="rounded-[var(--r-l)] bg-[var(--surface)] p-6">
                  <span
                    className="mb-4 flex size-10 items-center justify-center rounded-full bg-[var(--acc)] font-display text-base font-bold text-[var(--on-acc)]"
                    aria-hidden
                  >
                    {p.n}
                  </span>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-2)]">{p.text}</p>
                </li>
              ))}
            </ol>

            {/* Capturas del flujo booking */}
            <div className="mt-14 rounded-[var(--r-xl)] bg-[var(--surface)] p-2 sm:p-3">
              <Captura
                nombre="booking"
                movil="m-booking"
                alt={
                  language === 'es'
                    ? 'Lista de escenarios con su estado de contacto y el agente de booking en acción'
                    : 'Venue list with contact status and booking agent in action'
                }
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 5 — PRUEBA SOCIAL
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="mb-12 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.social.title')}
          </h2>

          {/* Métricas grandes */}
          <div className="mb-12 grid gap-4 sm:grid-cols-3">
            {[
              { num: t('landing.social.stat1.num'), label: t('landing.social.stat1.label') },
              { num: t('landing.social.stat2.num'), label: t('landing.social.stat2.label') },
              { num: t('landing.social.stat3.num'), label: t('landing.social.stat3.label') },
            ].map(({ num, label }) => (
              <div
                key={label}
                className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center"
              >
                <p className="font-display text-4xl font-bold text-[var(--acc-ink)]">{num}</p>
                <p className="mt-1 text-sm text-[var(--ink-2)]">{label}</p>
              </div>
            ))}
          </div>

          {/* Testimonios */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                quote: t('landing.social.t1.quote'),
                name: t('landing.social.t1.name'),
                band: t('landing.social.t1.band'),
              },
              {
                quote: t('landing.social.t2.quote'),
                name: t('landing.social.t2.name'),
                band: t('landing.social.t2.band'),
              },
              {
                quote: t('landing.social.t3.quote'),
                name: t('landing.social.t3.name'),
                band: t('landing.social.t3.band'),
              },
            ].map(({ quote, name, band }) => (
              <figure
                key={name}
                className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-6"
              >
                {/* Estrellas */}
                <div className="mb-3 flex gap-0.5" aria-label="5 estrellas">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
                <blockquote className="text-sm text-[var(--ink-2)]">"{quote}"</blockquote>
                <figcaption className="mt-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">{name}</p>
                  <p className="text-xs text-[var(--ink-3)]">{band}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 6 — CARACTERÍSTICAS / DETALLES PRÁCTICOS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-[var(--sunken)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <h2 className="mb-12 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.features.title')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: ShieldCheck,
                  title: t('landing.features.escrow.title'),
                  text: t('landing.features.escrow.text'),
                },
                {
                  icon: Zap,
                  title: t('landing.features.cancel.title'),
                  text: t('landing.features.cancel.text'),
                },
                {
                  icon: ArrowRight,
                  title: t('landing.features.taquilla.title'),
                  text: t('landing.features.taquilla.text'),
                },
                {
                  icon: Music2,
                  title: t('landing.features.qr.title'),
                  text: t('landing.features.qr.text'),
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <Icon className="mb-3 size-5 text-[var(--acc-ink)]" aria-hidden />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-2)]">{text}</p>
                </div>
              ))}
            </div>

            {/* Captura de fans */}
            <div className="mt-14 grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <p className="mb-3 text-sm font-semibold text-[var(--acc-ink)]">
                  {language === 'es' ? 'Dossier (EPK)' : 'EPK Dossier'}
                </p>
                <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">
                  {language === 'es'
                    ? 'Un dossier con cara y ojos, listo para mandar.'
                    : 'A professional dossier, ready to send.'}
                </h3>
                <ul className="mt-5 space-y-3">
                  {(language === 'es'
                    ? [
                        'Rider técnico, datos de contratación y próximas fechas en una sola página.',
                        'Se lee bien en el móvil de un programador y se traduce al inglés.',
                        'Un enlace y listo: sin adjuntos que pesan ni PDFs desactualizados.',
                      ]
                    : [
                        'Technical rider, booking info and upcoming dates — one page.',
                        'Readable on any booker\'s phone, available in English.',
                        'One link, no heavy attachments, no outdated PDFs.',
                      ]
                  ).map((p) => (
                    <li key={p} className="flex gap-3 text-[var(--ink-2)]">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-[var(--ok)]" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-span-7">
                <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-2 sm:p-3">
                  <Captura
                    nombre="fans"
                    movil="m-fans"
                    alt={
                      language === 'es'
                        ? 'Panel de fans con el crecimiento de la comunidad mes a mes'
                        : 'Fan dashboard showing community growth month by month'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            DE MÚSICO A MÚSICO
        ══════════════════════════════════════════════════════════════════ */}
        <section id="origen" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="overflow-hidden rounded-[var(--r-xl)] bg-[var(--surface)] p-6 sm:p-10 lg:p-12">
            <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
              <div className="md:col-span-5">
                <div className="relative mx-auto aspect-[4/5] max-w-sm overflow-hidden rounded-[var(--r-l)] bg-[var(--sunken)]">
                  {!fotoError ? (
                    <img
                      src="/landing/diego-creador.jpg?v=3"
                      alt={language === 'es' ? 'Diego tocando el bajo en directo' : 'Diego playing bass live on stage'}
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
                        {language === 'es' ? 'Foto del creador' : "Founder's photo"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-7">
                <p className="mb-3 text-sm font-semibold text-[var(--acc-ink)]">
                  {t('landing.author.label')}
                </p>
                <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl lg:text-4xl">
                  {t('landing.author.h2')}
                </h2>
                <div className="mt-5 space-y-4 text-base text-[var(--ink-2)] sm:text-lg">
                  <p>{t('landing.author.p1')}</p>
                  <p>{t('landing.author.p2')}</p>
                  <p>{t('landing.author.p3')}</p>
                  <p className="font-semibold text-[var(--ink)]">{t('landing.author.p4')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 7 — FAQs (con JSON-LD inyectado en useEffect)
        ══════════════════════════════════════════════════════════════════ */}
        <section id="preguntas" className="bg-[var(--sunken)]">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
            <h2 className="mb-10 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.faqs.title')}
            </h2>
            <div className="space-y-2">
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
                    <p className="px-5 pb-5 text-sm text-[var(--ink-2)]">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOQUE 8 — CTA FINAL
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <Rocket className="mx-auto mb-6 size-10 text-[var(--acc-ink)]" aria-hidden />
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
              {t('landing.cta.title')}
            </h2>

            {/* Mini-formulario de email */}
            <form
              onSubmit={handleCta}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
              aria-label={language === 'es' ? 'Formulario de registro' : 'Sign-up form'}
            >
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('landing.cta.email.placeholder')}
                className="flex-1 rounded-[var(--r-pill)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--acc)]"
                aria-label={language === 'es' ? 'Tu dirección de email' : 'Your email address'}
              />
              <Button type="submit" variant="primary" size="lg">
                {t('landing.cta.button')}
              </Button>
            </form>

            {/* Micro-copy de seguridad */}
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 text-xs text-[var(--ink-3)]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5" aria-hidden />
                {t('landing.cta.note')}
              </span>
            </p>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--sunken)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--ink-2)] sm:px-6">
          <span>{t('landing.footer.copy').replace('{year}', String(year))}</span>
          <div className="flex items-center gap-4">
            {/* Selector idioma también en footer */}
            <select
              value={language === 'es' || language === 'en' ? language : 'es'}
              onChange={handleLangChange}
              aria-label={language === 'es' ? 'Idioma' : 'Language'}
              className="cursor-pointer rounded border border-[var(--border)] bg-transparent px-2 py-1 text-xs text-[var(--ink-2)] focus:outline-none"
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onEntrar}
              className="cursor-pointer font-medium text-[var(--ink)] hover:underline"
            >
              {t('landing.nav.enter')}
            </button>
          </div>
        </div>
      </footer>
      {/* ── CHATBOT FLOTANTE ──────────────────────────────────────────── */}
      <LandingChatWidget onEntrar={onEntrar} />
    </div>
  );
};

export default PublicLanding;
