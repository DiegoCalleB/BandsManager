import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Tabs } from '../ui';
import { FormularioEmpresas } from './FormularioEmpresas';
import { PLANES_B2B, PLANES_B2C, type PlanLanding } from './planesLanding';

type Segmento = 'b2c' | 'b2b';

const Tarjeta: React.FC<{ plan: PlanLanding; es: boolean }> = ({ plan, es }) => {
  const l = es ? 'es' : 'en';
  return (
    <li className={`flex flex-col rounded-[var(--r-l)] p-6 ${plan.destacado ? 'bg-[var(--surface)] ring-2 ring-[var(--acc)]' : 'bg-[var(--surface)]'}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">{plan.nombre}</h3>
        {plan.destacado && (
          <span className="rounded-[var(--r-pill)] bg-[var(--acc)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--ink)]">
            {es ? 'Recomendado' : 'Recommended'}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight">{plan.precio[l]}</p>
      <p className="text-xs text-[var(--ink-2)]">{plan.sub[l]}</p>
      <p className="mt-3 text-sm text-[var(--ink-2)]">{plan.para[l]}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {plan.items.map((i) => (
          <li key={i.es} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden />
            <span>{i[l]}</span>
          </li>
        ))}
      </ul>
    </li>
  );
};

/** Módulo de precios de la landing TFM: planes de bandas (B2C, reales) y de empresas (B2B, bajo contrato). */
export const PreciosTfm: React.FC<{ es: boolean }> = ({ es }) => {
  const [segmento, setSegmento] = useState<Segmento>('b2c');
  const planes = segmento === 'b2c' ? PLANES_B2C : PLANES_B2B;
  return (
    <section id="planes" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {es ? 'Planes y precios' : 'Plans and pricing'}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--ink-2)]">
        {segmento === 'b2c'
          ? es ? 'Para bandas y artistas. Empiezas gratis y subes cuando lo necesitas.' : 'For bands and artists. Start free and upgrade when you need to.'
          : es ? 'Para empresas con varias bandas. Se contratan bajo acuerdo, sin pago con tarjeta.' : 'For companies with several bands. Contracted by agreement, no card payment.'}
      </p>
      <Tabs<Segmento>
        aria-label={es ? 'Tipo de plan' : 'Plan type'}
        layout="fill"
        className="mx-auto mt-8 max-w-sm"
        value={segmento}
        onChange={setSegmento}
        items={[
          { id: 'b2c', label: es ? 'Bandas y artistas' : 'Bands and artists' },
          { id: 'b2b', label: es ? 'Empresas' : 'Companies' },
        ]}
      />
      <ul className={`mt-10 grid gap-5 ${segmento === 'b2c' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
        {planes.map((p) => <Tarjeta key={p.id} plan={p} es={es} />)}
      </ul>
      {segmento === 'b2b' && <FormularioEmpresas es={es} />}
    </section>
  );
};

export default PreciosTfm;
