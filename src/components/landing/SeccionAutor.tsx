import React, { useState } from 'react';
import { Music2 } from 'lucide-react';
import { useLanguage } from '../../context/idioma';

export const SeccionAutor: React.FC = () => {
  const { language, t } = useLanguage();
  const [fotoError, setFotoError] = useState(false);

  return (
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
            <p className="mb-3 text-sm font-semibold text-[var(--acc-ink)]">{t('landing.author.label')}</p>
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
  );
};
