import React, { useEffect } from 'react';
import { ArrowRight, Check, Clapperboard, Compass, Hand, Layers, Music2, Rocket, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { Button, Card } from './ui';
import { PublicoSilhouette } from './ui/PublicoSilhouette';

interface PublicLandingProps {
  onEntrar: () => void;
}

/** Una captura por tema (claro/oscuro) y por tamaño: la de escritorio desde `sm`, la de móvil por debajo. */
const Par: React.FC<{ src: string; alt: string; ancho: number; alto: number; eager?: boolean; className?: string }> = ({ src, alt, ancho, alto, eager, className = '' }) => (
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

/** Página pública (dossier, fans): una sola captura, con su propio tema. */
const Una: React.FC<{ src: string; alt: string; ancho: number; alto: number; className?: string }> = ({ src, alt, ancho, alto, className = '' }) => (
  <img src={`/landing/${src}.jpg`} alt={alt} width={ancho} height={alto} loading="lazy" decoding="async" className={`h-auto w-full ${className}`} />
);

const Captura: React.FC<{ nombre: string; movil: string; alt: string; eager?: boolean }> = ({ nombre, movil, alt, eager }) => (
  <>
    <span className="hidden overflow-hidden rounded-[var(--r-l)] bg-[var(--surface)] sm:block">
      <Par src={nombre} alt={alt} ancho={1040} alto={800} eager={eager} />
    </span>
    <span className="mx-auto block w-64 overflow-hidden rounded-[var(--r-l)] bg-[var(--surface)] sm:hidden">
      <Par src={movil} alt={alt} ancho={390} alto={844} eager={eager} />
    </span>
  </>
);

const FUNCIONES = [
  {
    id: 'booking',
    etiqueta: 'Booking',
    titulo: 'Encuentra dónde tocar. El agente escribe, tú apruebas.',
    puntos: [
      'El scout busca salas y festivales por ciudad, aforo y género.',
      'Redacta cada correo con la voz de tu banda. Nada sale sin que lo apruebes.',
      'Cada sala tiene su estado: por contactar, en conversación, negociando, confirmado.',
    ],
    captura: 'booking',
    movil: 'm-booking',
    alt: 'Lista de escenarios con su estado de contacto, fiabilidad y aforo',
  },
  {
    id: 'repertorio',
    etiqueta: 'Repertorio',
    titulo: 'Un setlist que se lee como un concierto.',
    puntos: [
      'El mapa de energía te enseña el arco del show: tonalidad, tempo y subidas de cada tema.',
      'Modo escenario: letras, acordes y partituras en el móvil, con pantalla de alto contraste.',
      'Modo ensayo con pistas, silenciar instrumentos y metrónomo.',
    ],
    captura: 'repertorio',
    movil: 'm-repertorio',
    alt: 'Setlist con el mapa de energía del concierto',
  },
  {
    id: 'calendario',
    etiqueta: 'Calendario y giras',
    titulo: 'Bolos, ensayos y furgo, sin perderte.',
    puntos: [
      'Conciertos, ensayos y reuniones en un calendario, con todas tus bandas a la vez.',
      'Caché, aforo, hoja de ruta y previsión del tiempo para escenarios al aire libre.',
      'Giras: ruta, gasolina, dietas y reparto de gastos.',
    ],
    captura: 'calendario',
    movil: 'm-calendario',
    alt: 'Calendario con conciertos y ensayos de varias bandas',
  },
  {
    id: 'fans',
    etiqueta: 'Fans y redes',
    titulo: 'Que cada concierto te traiga gente, no solo aplausos.',
    puntos: [
      'Un QR en la mesa de merchan: cada fan se apunta con su consentimiento RGPD.',
      'Instagram, TikTok, YouTube y Spotify en una sola curva de crecimiento.',
      'Dossier (EPK) y página de fans listos para mandar a promotores.',
    ],
    captura: 'fans',
    movil: 'm-fans',
    alt: 'Panel de fans con el crecimiento de la comunidad mes a mes',
  },
] as const;

const EXTRAS = [
  { icono: Clapperboard, titulo: 'Reels y redes', texto: 'Pipeline de vídeos y textos con la voz de tu banda, y tus métricas en una curva.' },
  { icono: Wallet, titulo: 'Finanzas', texto: 'Quién cobra qué, qué te deben y cuánto cuesta cada bolo.' },
  { icono: Music2, titulo: 'Discografía', texto: 'Tus discos y temas, con audio, tonalidad y BPM.' },
  { icono: Layers, titulo: 'Varias bandas', texto: 'Cambia de banda en un toque. Cada una ve solo lo suyo.' },
  { icono: Hand, titulo: 'Merchan', texto: 'Catálogo y diseño de tu merchandising, a pie de mesa.' },
  { icono: Smartphone, titulo: 'En el bolsillo', texto: 'Se instala como app en el móvil. Claro, oscuro y clásico.' },
];

const PASOS = [
  { n: '1', titulo: 'Crea tu banda', texto: 'Nombre, estilo y tu gente. En dos minutos, sin tarjeta.' },
  { n: '2', titulo: 'Dile dónde quieres tocar', texto: 'El agente busca, ordena y prepara los correos.' },
  { n: '3', titulo: 'Aprueba y toca', texto: 'Revisas, envías y sigues cada respuesta desde el Panel.' },
];

const PREGUNTAS = [
  { p: '¿Es gratis?', r: 'Hay un plan gratis para empezar. Cuando necesites más créditos de IA o más herramientas, hay planes de pago; los ves dentro de la app, sin sorpresas.' },
  { p: '¿Se mandan correos sin que yo los vea?', r: 'No por defecto. El agente deja borradores y tú los apruebas. Puedes decidir cuánta autonomía le das.' },
  { p: '¿Funciona en el móvil?', r: 'Sí: está pensado para el móvil primero, se instala como app y tiene un modo escenario para leer el setlist en directo.' },
  { p: '¿Y mis datos y los de mis fans?', r: 'Cada banda ve solo lo suyo. Los fans se apuntan con su consentimiento RGPD y puedes exportar tus datos.' },
  { p: '¿Sirve para un solista, un cómico o un mánager con varias bandas?', r: 'Sí. Si tienes que buscar salas y llenarlas, BandManager te sirve. Con varias bandas, cambias de una a otra en un toque.' },
];

export const PublicLanding: React.FC<PublicLandingProps> = ({ onEntrar }) => {
  useEffect(() => {
    const anterior = document.title;
    document.title = 'BandManager · Encuentra dónde tocar y gestiona tu banda';
    return () => {
      document.title = anterior;
    };
  }, []);

  return (
    <div className="h-dvh overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--r-pill)] focus:bg-[var(--surface)] focus:px-4 focus:py-2">
        Saltar al contenido
      </a>

      {/* Barra superior: el acceso está SIEMPRE a la vista */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5" aria-label="BandManager, inicio">
            <img src="/logo_bandmanager_symbol.png?v=4" alt="" width={32} height={32} className="size-8 rounded-[var(--r-s)]" />
            <span className="font-display text-base font-bold tracking-tight">BandManager</span>
          </a>
          <nav aria-label="Secciones" className="hidden items-center gap-6 text-sm text-[var(--ink-2)] md:flex">
            <a href="#funciones" className="hover:text-[var(--ink)]">Funciones</a>
            <a href="#dossier" className="hover:text-[var(--ink)]">Dossier y fans</a>
            <a href="#como-funciona" className="hover:text-[var(--ink)]">Cómo funciona</a>
            <a href="#preguntas" className="hover:text-[var(--ink)]">Preguntas</a>
          </nav>
          <Button variant="primary" size="md" onClick={onEntrar} id="landing-entrar">
            Entrar
          </Button>
        </div>
      </header>

      <main id="contenido">
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-16 lg:pt-20">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--sunken)] px-3 py-1 text-xs font-medium text-[var(--ink-2)]">
              <span aria-hidden className="size-1.5 rounded-full bg-[var(--ok)]" /> Beta abierta · gratis para empezar
            </p>
            <h1 className="font-display text-[2.25rem] font-bold leading-[1.08] tracking-tight text-balance sm:text-6xl">
              Tu banda, tus bolos, un solo sitio.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-[var(--ink-2)] text-pretty">
              BandManager busca salas y festivales, redacta los correos, ordena tu setlist y recoge a tus fans con un QR. Tú tocas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" size="lg" onClick={onEntrar}>
                Entrar <ArrowRight className="size-4" aria-hidden />
              </Button>
              <a href="#funciones" className="inline-flex h-11 items-center rounded-[var(--r-pill)] bg-[var(--sunken)] px-5 text-sm font-semibold text-[var(--ink)] transition-ui hover:brightness-95">
                Ver qué hace
              </a>
            </div>
          </div>

          <div className="relative mt-12">
            <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:p-3">
              <Captura nombre="panel" movil="movil-panel" alt="Panel de BandManager con alertas del mánager y la agenda de bolos" eager />
            </div>
            <div className="absolute -bottom-6 right-3 hidden w-40 rounded-[var(--r-xl)] bg-[var(--sunken)] p-1.5 sm:block lg:right-8 lg:w-48">
              <span className="block overflow-hidden rounded-[var(--r-l)]">
                <Par src="movil-panel" alt="El Panel en el móvil" ancho={390} alto={844} />
              </span>
            </div>
          </div>
        </section>

        {/* EL PROBLEMA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl">
            Un Excel con 300 salas. Un grupo de WhatsApp con el setlist. Un rider que nadie encuentra.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-[var(--ink-2)]">
            Llevar una banda no debería ser perseguir información. BandManager lo junta: lo que buscas, lo que tocas y lo que cobras, en la misma pantalla.
          </p>
        </section>

        {/* FUNCIONES */}
        <section id="funciones" className="mx-auto max-w-6xl space-y-16 px-4 pb-8 sm:space-y-24 sm:px-6">
          {FUNCIONES.map((f, i) => (
            <article key={f.id} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
              <div className={`lg:col-span-5 ${i % 2 ? 'lg:order-2' : ''}`}>
                <p className="mb-3 text-sm font-semibold text-[var(--acc-ink)]">{f.etiqueta}</p>
                <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">{f.titulo}</h3>
                <ul className="mt-5 space-y-3">
                  {f.puntos.map((p) => (
                    <li key={p} className="flex gap-3 text-[var(--ink-2)]">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-[var(--ok)]" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`lg:col-span-7 ${i % 2 ? 'lg:order-1' : ''}`}>
                <div className="rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:p-3">
                  <Captura nombre={f.captura} movil={f.movil} alt={f.alt} />
                </div>
              </div>
            </article>
          ))}
        </section>


        {/* DOSSIER Y PÁGINA DE FANS */}
        <section id="dossier" className="mx-auto max-w-6xl space-y-16 px-4 pb-8 pt-16 sm:space-y-24 sm:px-6">
          <article className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <p className="mb-3 text-sm font-semibold text-[var(--acc-ink)]">Dossier (EPK)</p>
              <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">
                Un dossier con cara y ojos, listo para mandar.
              </h3>
              <ul className="mt-5 space-y-3">
                {[
                  'Cada miembro con su foto, su rol y su Instagram.',
                  'Rider técnico, datos de contratación y próximas fechas en una sola página.',
                  'Se lee bien en el móvil de un programador y se traduce al inglés.',
                  'Un enlace y listo: sin adjuntos que pesan ni PDFs desactualizados.',
                ].map((p) => (
                  <li key={p} className="flex gap-3 text-[var(--ink-2)]">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-[var(--ok)]" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative lg:col-span-7">
              <div className="hidden rounded-[var(--r-xl)] bg-[var(--sunken)] p-2 sm:block sm:p-3">
                <span className="block overflow-hidden rounded-[var(--r-l)] bg-[var(--surface)]">
                  <Una src="epk-miembros-light" alt="Dossier público con los miembros de la banda, su rol y su Instagram" ancho={1280} alto={1000} />
                </span>
              </div>
              <div className="mx-auto w-64 rounded-[var(--r-xl)] bg-[var(--sunken)] p-1.5 sm:hidden">
                <span className="block overflow-hidden rounded-[var(--r-l)]">
                  <Una src="m-epk-light" alt="Dossier público de la banda en el móvil" ancho={390} alto={844} />
                </span>
              </div>
              <div className="absolute -bottom-6 right-3 hidden w-36 rounded-[var(--r-xl)] bg-[var(--sunken)] p-1.5 sm:block lg:right-8 lg:w-44">
                <span className="block overflow-hidden rounded-[var(--r-l)]">
                  <Una src="m-epk-light" alt="El dossier en el móvil" ancho={390} alto={844} />
                </span>
              </div>
            </div>
          </article>

          <article className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="order-2 grid grid-cols-2 gap-3 sm:gap-5 lg:order-1 lg:col-span-7">
              {(['m-fanslanding-light', 'm-fanslanding-2-light'] as const).map((n, i) => (
                <div key={n} className={`rounded-[var(--r-xl)] bg-[var(--sunken)] p-1.5 sm:p-2.5 ${i ? 'mt-8 sm:mt-12' : ''}`}>
                  <span className="block overflow-hidden rounded-[var(--r-l)]">
                    <Una src={n} alt={i ? 'La página de fans con próximos conciertos y contacto de booking' : 'La página de fans con las redes de la banda'} ancho={390} alto={844} />
                  </span>
                </div>
              ))}
            </div>
            <div className="order-1 lg:order-2 lg:col-span-5">
              <p className="mb-3 text-sm font-semibold text-[var(--acc-ink)]">Página de fans</p>
              <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">
                Un QR en la mesa de merchan. Un fan más en tu lista.
              </h3>
              <ul className="mt-5 space-y-3">
                {[
                  'Pegas el QR en el merchan o lo proyectas en el escenario: el fan lo escanea y ya está.',
                  'Te sigue en redes o te deja su correo, con su consentimiento RGPD.',
                  'Ve tus próximas fechas y cómo contratarte, sin pedirte nada.',
                ].map((p) => (
                  <li key={p} className="flex gap-3 text-[var(--ink-2)]">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-[var(--ok)]" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        {/* TODO LO DEMÁS */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Y todo lo que rodea al directo</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXTRAS.map(({ icono: Icono, titulo, texto }) => (
              <Card key={titulo} className="p-5">
                <Icono aria-hidden className="mb-3 size-5 text-[var(--ink-2)]" />
                <h3 className="font-semibold">{titulo}</h3>
                <p className="mt-1 text-sm text-[var(--ink-2)]">{texto}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" className="bg-[var(--sunken)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">De cero al primer bolo en tres pasos</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {PASOS.map((p) => (
                <li key={p.n} className="rounded-[var(--r-l)] bg-[var(--surface)] p-6">
                  <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-[var(--acc)] font-display text-base font-bold text-[var(--on-acc)]" aria-hidden>
                    {p.n}
                  </span>
                  <h3 className="font-semibold">{p.titulo}</h3>
                  <p className="mt-1 text-sm text-[var(--ink-2)]">{p.texto}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 flex items-center gap-2 text-sm text-[var(--ink-2)]">
              <ShieldCheck aria-hidden className="size-4 text-[var(--ok)]" />
              Tú decides: el agente propone y tú apruebas. Cada banda ve solo sus datos.
            </p>
          </div>
        </section>

        {/* PREGUNTAS */}
        <section id="preguntas" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Preguntas de siempre</h2>
          <div className="mt-8 space-y-2">
            {PREGUNTAS.map((q) => (
              <details key={q.p} className="group rounded-[var(--r-m)] bg-[var(--surface)] px-5 py-4 open:bg-[var(--surface)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:content-none">
                  {q.p}
                  <span aria-hidden className="text-[var(--ink-2)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[var(--ink-2)]">{q.r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CIERRE */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 text-center sm:px-6">
            <div className="pointer-events-none mx-auto mb-6 flex justify-center" aria-hidden>
              <PublicoSilhouette size="large" opacity={0.18} />
            </div>
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
              La sala está vacía. Vamos a llenarla.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="primary" size="lg" onClick={onEntrar}>
                <Rocket className="size-4" aria-hidden /> Entrar a BandManager
              </Button>
              <a href="/musicos" className="inline-flex h-11 items-center gap-2 rounded-[var(--r-pill)] bg-[var(--sunken)] px-5 text-sm font-semibold transition-ui hover:brightness-95">
                <Compass className="size-4" aria-hidden /> Lista de espera para músicos
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[var(--sunken)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--ink-2)] sm:px-6">
          <span>© {new Date().getFullYear()} BandManager</span>
          <button type="button" onClick={onEntrar} className="cursor-pointer font-medium text-[var(--ink)] hover:underline">Entrar</button>
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;
