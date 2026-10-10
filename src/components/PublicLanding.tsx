import { ShowIcon } from './ui/ShowIcon';
import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe,
  Guitar,
  Headphones,
  Music2,
  QrCode,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Truck,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { Button, Card } from './ui';
import { useLanguage, SupportedLanguage } from '../context/LanguageContext';
import { LandingChatWidget } from './LandingChatWidget';

interface PublicLandingProps {
  onEntrar: () => void;
}

const LANG_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

/** Una captura por tema (claro/oscuro) y por tamaño: la de escritorio desde `sm`, la de móvil por debajo. */
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

export const PublicLanding: React.FC<PublicLandingProps> = ({ onEntrar }) => {
  const { language, setLanguage, t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [fotoError, setFotoError] = useState(false);
  const [email, setEmail] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const es = language === 'es';

  useEffect(() => {
    const title = t('landing.title');
    const description = t('landing.description');
    const url = 'https://bandmanager.io/';
    const image = 'https://bandmanager.io/og-cover.png';

    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [k, v] = selector.replace('meta[', '').replace(']', '').split('=');
        el.setAttribute(k, v.replace(/"/g, ''));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
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

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as SupportedLanguage);
  };

  const year = new Date().getFullYear();

  const FAQS = [
    { q: t('landing.faq1.q'), a: t('landing.faq1.a') },
    { q: t('landing.faq2.q'), a: t('landing.faq2.a') },
    { q: t('landing.faq3.q'), a: t('landing.faq3.a') },
    { q: t('landing.faq4.q'), a: t('landing.faq4.a') },
  ];

  return (
    <div className="h-dvh overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/95">
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
            <a href="#como-funciona" className="hover:text-[var(--ink)]">{t('landing.nav.howto')}</a>
            <a href="#iris" className="hover:text-[var(--ink)]">Estudio Iris</a>
            <a href="#setlists-miembros" className="hover:text-[var(--ink)]">Setlists</a>
            <a href="#fans" className="hover:text-[var(--ink)]">Fans y QR</a>
            <a href="#preguntas" className="hover:text-[var(--ink)]">{t('landing.nav.faq')}</a>
          </nav>

          <div className="flex items-center gap-3">
            <select
              data-raw
              value={language === 'es' || language === 'en' ? language : 'es'}
              onChange={handleLangChange}
              aria-label={language === 'es' ? 'Idioma' : 'Language'}
              className="cursor-pointer rounded-[var(--r-pill)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] transition-ui hover:text-[var(--ink)] focus:outline-none"
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
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-2)]">
              <ShieldCheck className="size-3.5 text-[var(--ok)]" aria-hidden />
              {t('landing.badge')}
            </p>

            <h1 className="font-display text-[2.25rem] font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t('landing.hero.h1')}
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-[var(--ink-2)] text-pretty sm:text-xl">
              {t('landing.hero.h2')}
            </p>

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
            <p className="mt-3 text-xs text-[var(--ink-2)]">{t('landing.hero.cta.note')}</p>
          </div>

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
          </div>
        </section>

        {/* RESUMEN EJECUTIVO */}
        <section className="bg-[var(--sunken)]" aria-label={t('landing.summary.label')}>
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <p className="mb-2 text-xs font-bold text-[var(--acc-ink)]">
              {t('landing.summary.label')}
            </p>
            <p className="text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">
              {t('landing.summary.text')}
            </p>
          </div>
        </section>

        {/* CÓMO FUNCIONA (3 pasos) */}
        <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
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

          <div className="mt-14 rounded-[var(--r-xl)] bg-[var(--surface)] p-2 sm:p-3">
            <Captura
              nombre="booking"
              movil="m-booking"
              alt="Lista de escenarios con su estado de contacto y el agente de booking"
            />
          </div>
        </section>

        {/* ESTUDIO IA DE PISTAS (IRIS) */}
        <section id="iris" className="bg-[var(--sunken)] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--ink)] mb-4">
                  <Sparkles className="size-3.5" />
                  {es ? 'Estudio IA de Pistas' : 'AI Stems Studio'}
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-5">
                  {es
                    ? 'Separa pistas en segundos con Iris. Ensaya a tu ritmo.'
                    : 'Separate audio stems in seconds with Iris. Practice on your terms.'}
                </h2>
                <div className="space-y-4 text-base text-[var(--ink-2)]">
                  <p>
                    {es
                      ? 'Sube cualquier audio, maqueta o grabación del local e Iris extrae por separado la voz, el bajo, la batería, las guitarras y los teclados.'
                      : 'Upload any recording or rough mix and Iris isolates vocals, bass, drums, guitars, and keyboards into pristine stems.'}
                  </p>
                  <p>
                    {es
                      ? 'Silencia tu instrumento con un toque para tocar encima en directo o aíslalo con metrónomo para estudiarte los pasajes complicados.'
                      : 'Mute your instrument in one tap to play along live, or isolate it with a sync click track to master tricky parts.'}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-6 sm:p-8 space-y-3">
                  {[
                    { name: es ? '🎤 Voz Principal' : '🎤 Lead Vocals', color: 'bg-indigo-500', vol: '100%' },
                    { name: es ? '🎸 Guitarras' : '🎸 Guitars', color: 'bg-amber-500', vol: '85%' },
                    { name: es ? '🎸 Bajo Eléctrico' : '🎸 Bass Guitar', color: 'bg-emerald-500', vol: '0% (Muted)' },
                    { name: es ? '🥁 Batería' : '🥁 Drums', color: 'bg-rose-500', vol: '90%' },
                  ].map((stem) => (
                    <div key={stem.name} className="flex items-center justify-between rounded-[var(--r-m)] p-3 bg-[var(--sunken)]">
                      <div className="flex items-center gap-3">
                        <span className={`size-3 rounded-full ${stem.color}`} />
                        <span className="text-sm font-semibold">{stem.name}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[var(--acc-ink)]">{stem.vol}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SETLISTS PERSONALIZADOS */}
        <section id="setlists-miembros" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-2 sm:p-3">
                <Captura
                  nombre="hojas"
                  movil="miembros"
                  alt="Setlists personalizados por músico en BandManager"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--ink)] mb-4">
                <Users className="size-3.5" />
                {es ? 'Coordinación de Escenario' : 'Stage Coordination'}
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-5">
                {es
                  ? 'Setlists personalizados para cada músico. Cero despistes.'
                  : 'Personalized setlists for every musician. Zero slip-ups.'}
              </h2>
              <div className="space-y-4 text-base text-[var(--ink-2)]">
                <p>
                  {es
                    ? 'Cada músico tiene su propia versión del setlist con sus notas técnicas: el batería con BPMs y claqueta, el cantante con letras y coros, y las guitarras con afinaciones y pedales.'
                    : 'Each member receives their tailored setlist: drummer gets BPMs and count-ins, singer gets cues and lyrics, guitarists get tunings and patch notes.'}
                </p>
                <p>
                  {es
                    ? 'Imprime hojas individuales en 1 clic o genera la hoja técnica máster para la mesa de sonido.'
                    : 'Export printable single-musician stage sheets in one click or produce the master sound engineer sheet.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FANS & QR PERSONALIZADO */}
        <section id="fans" className="bg-[var(--sunken)] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="order-2 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:order-1 lg:col-span-7 items-center">
                {/* QR Mockup en el merchan */}
                <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-5 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="size-10 rounded-full bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc-ink)]">
                    <QrCode className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-[var(--ink)]">QR de Merchan</h4>
                    <p className="text-micro text-[var(--ink-2)] mt-0.5">Escanea desde el escenario</p>
                  </div>
                  <div className="p-3 bg-[var(--sunken)] rounded-[var(--r-m)] inline-block">
                    <svg className="size-28 text-[var(--ink)]" viewBox="0 0 100 100" fill="currentColor">
                      <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM50 20h10v10H50zM40 40h20v20H40zM10 40h10v20H10zM70 40h20v10H70zM80 60h20v20H80zM40 70h10v20H40zM60 70h10v10H60zM70 90h20v10H70z" />
                    </svg>
                  </div>
                  <span className="text-micro font-mono text-[var(--acc-ink)] bg-[var(--sunken)] px-2 py-0.5 rounded-[var(--r-pill)]">
                    bandmanager.io/unete
                  </span>
                </div>

                {/* Móviles de la FanLanding */}
                <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-1.5 sm:p-2.5">
                  <span className="block overflow-hidden rounded-[var(--r-l)]">
                    <img src="/landing/m-fanslanding-light.jpg" alt="Página de fans con redes" width={390} height={844} loading="lazy" decoding="async" className="h-auto w-full" />
                  </span>
                </div>
                <div className="rounded-[var(--r-xl)] bg-[var(--surface)] p-1.5 sm:p-2.5">
                  <span className="block overflow-hidden rounded-[var(--r-l)]">
                    <img src="/landing/m-fanslanding-2-light.jpg" alt="Página de fans con fechas" width={390} height={844} loading="lazy" decoding="async" className="h-auto w-full" />
                  </span>
                </div>
              </div>

              <div className="order-1 lg:order-2 lg:col-span-5">
                <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-3 py-1 text-xs font-semibold text-[var(--ink)] mb-4">
                  <QrCode className="size-3.5" />
                  {es ? 'QR y Captación de Fans' : 'QR y Fan Acquisition'}
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
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DE MÚSICO A MÚSICO */}
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

        {/* PREGUNTAS */}
        <section id="preguntas" className="bg-[var(--sunken)]">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
            <h2 className="mb-10 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.faqs.title')}
            </h2>
            <div className="space-y-2">
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
                    <p className="px-5 pb-5 text-sm text-[var(--ink-2)]">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <Rocket className="mx-auto mb-6 size-10 text-[var(--acc-ink)]" aria-hidden />
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
              {t('landing.cta.title')}
            </h2>

            <div className="mt-8 flex justify-center">
              <Button onClick={onEntrar} variant="primary" size="lg">
                {t('landing.cta.button')} <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>

            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 text-xs text-[var(--ink-2)]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-[var(--ok)]" aria-hidden />
                {t('landing.cta.note')}
              </span>
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[var(--sunken)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--ink-2)] sm:px-6">
          <span>{t('landing.footer.copy').replace('{year}', String(year))}</span>
          <div className="flex items-center gap-4">
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

      {/* CHATBOT FLOTANTE */}
      <LandingChatWidget onEntrar={onEntrar} />
    </div>
  );
};

export default PublicLanding;
