/**
 * Bloque de la landing que lleva a las guías públicas (`/guias` y `/en/guides`, páginas de SEO servidas por el
 * servidor). Tres guías destacadas y un enlace al índice. Los enlaces son rutas completas, no de la SPA.
 */
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/idioma';

export const GuiasDestacadas: React.FC = () => {
  const { language, t } = useLanguage();
  const es = language === 'es';
  const guias = [
    { href: es ? '/guias/como-hacer-un-setlist' : '/en/guides/how-to-make-a-setlist', title: t('landing.guides.setlist.title'), text: t('landing.guides.setlist.text') },
    { href: es ? '/guias/cuanto-cobrar-por-un-concierto' : '/en/guides/how-much-to-charge-for-a-gig', title: t('landing.guides.fee.title'), text: t('landing.guides.fee.text') },
    { href: es ? '/guias/como-conseguir-bolos' : '/en/guides/how-to-get-gigs', title: t('landing.guides.gigs.title'), text: t('landing.guides.gigs.text') },
  ];

  return (
    <section id="guias" className="bg-[var(--sunken)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t('landing.guides.title')}</h2>
        <p className="mt-3 max-w-2xl text-[var(--ink-2)]">{t('landing.guides.subtitle')}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {guias.map((g) => (
            <li key={g.href}>
              <a href={g.href} className="group flex h-full flex-col rounded-[var(--r-l)] bg-[var(--surface)] p-6 transition-ui hover:bg-[var(--bg)]">
                <h3 className="font-semibold">{g.title}</h3>
                <p className="mt-2 flex-1 text-sm text-[var(--ink-2)]">{g.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--acc-ink)]">
                  {t('landing.guides.read')}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <a href={es ? '/guias' : '/en/guides'} className="mt-8 inline-flex items-center gap-1.5 font-semibold text-[var(--acc-ink)] hover:underline">
          {t('landing.guides.all')}
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    </section>
  );
};
