import React from 'react';
import { Card, Chip } from '../ui';
import type { Presencia } from '../../utils/asesor/presencia';
import { LIMITE_NOMBRE_INSTAGRAM } from '../../utils/asesor/seo';
import { BotonCopiar } from './BotonCopiar';
import { NOMBRE_RED } from './nombres';

const INTENCION = { descubrir: 'Descubrir', concierto: 'Conciertos', local: 'Local' } as const;

/**
 * El kit de SEO, hecho con los datos de la banda: las frases con las que os buscan y bios para elegir,
 * cada una con su contador de caracteres. Criterio propio del asesor, no del temario: así se dice.
 */
export function SeoPanel({ kit }: { kit: Presencia['kit'] }) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-2" aria-label="Cómo os buscan">
        <h3 className="text-sm font-medium text-[var(--ink)]">Cómo os buscan</h3>
        {kit.palabrasClave.length === 0 ? (
          <p className="text-sm text-[var(--ink-2)]">Rellenad el género y la ciudad en el perfil de la banda y os proponemos las frases.</p>
        ) : (
          <>
            <ul className="flex flex-wrap gap-1.5">
              {kit.palabrasClave.map((p) => <li key={p.frase}><Chip tone="acc" title={INTENCION[p.intencion]}>{p.frase}</Chip></li>)}
            </ul>
            <p className="text-xs text-[var(--ink-2)]">Úsalas {kit.dondeUsar.charAt(0).toLowerCase() + kit.dondeUsar.slice(1)} Criterio propio.</p>
          </>
        )}
      </section>

      {kit.nombreInstagram && (
        <section className="grid gap-1.5" aria-label="Nombre de Instagram">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-[var(--ink)]">Nombre del perfil de Instagram</h3>
            <BotonCopiar texto={kit.nombreInstagram} />
          </div>
          <p className="text-base font-semibold text-[var(--ink)]">{kit.nombreInstagram}</p>
          <p className="text-xs text-[var(--ink-2)]">El campo «Nombre» (no el @) es el que se busca; {kit.nombreInstagram.length} de {LIMITE_NOMBRE_INSTAGRAM} caracteres.</p>
        </section>
      )}

      {kit.bios.map((b) => (
        <section key={b.red} className="grid gap-2" aria-label={`Bio de ${NOMBRE_RED[b.red]}`}>
          <h3 className="text-sm font-medium text-[var(--ink)]">Bio de {NOMBRE_RED[b.red]}</h3>
          {b.opciones.map((o) => (
            <Card key={o.etiqueta} as="article" radius="m" className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--ink-2)]">{o.etiqueta} · {o.caracteres} de {o.limite}</span>
                <BotonCopiar texto={o.texto} />
              </div>
              <p className="whitespace-pre-line text-sm text-[var(--ink)]">{o.texto}</p>
            </Card>
          ))}
        </section>
      ))}
      {kit.bios.length === 0 && <p className="text-sm text-[var(--ink-2)]">Sin género ni ciudad no inventamos una bio: rellenadlos en el perfil.</p>}
    </div>
  );
}
