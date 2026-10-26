/**
 * Bloque de la landing que lleva a los listados públicos (`/directories/venues` y `/directories/festivals`, páginas de
 * SEO servidas por el servidor). Dos tarjetas y un enlace a la portada de listados. Los enlaces son rutas completas, no de la SPA.
 */
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/idioma';

export const DirectoriosDestacados: React.FC = () => {
  const { language, t } = useLanguage();
  const es = language === 'es';
  const base = es ? '' : '/en';
  const listados = [
    { href: `${base}/directories/venues`, title: t('landing.directories.venues.title'), text: t('landing.directories.venues.text') },
    { href: `${base}/directories/festivals`, title: t('landing.directories.festivals.title'), text: t('landing.directories.festivals.text') },
  ];

  return (
    <section id="listados" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t('landing.directories.title')}</h2>
        <p className="mt-3 max-w-2xl text-[var(--ink-2)]">{t('landing.directories.subtitle')}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {listados.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="group flex h-full flex-col rounded-[var(--r-l)] bg-[var(--sunken)] p-6 transition-ui hover:bg-[var(--surface)]">
                <h3 className="font-semibold">{l.title}</h3>
                <p className="mt-2 flex-1 text-sm text-[var(--ink-2)]">{l.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--acc-ink)]">
                  {t('landing.directories.open')}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <a href={`${base}/directories`} className="mt-8 inline-flex items-center gap-1.5 font-semibold text-[var(--acc-ink)] hover:underline">
          {t('landing.directories.all')}
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    </section>
  );
};
