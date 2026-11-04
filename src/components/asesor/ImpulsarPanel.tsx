import React from 'react';
import { Card, Chip } from '../ui';
import { fechaCorta } from '../../utils/campanaConcierto';
import type { CandidatoAnuncio, Decision } from '../../utils/asesor/anuncios';
import { ETIQUETA_FORMATO } from '../../utils/asesor/resumen';
import { NOMBRE_RED } from './nombres';

const DECISION: Record<Decision, { texto: string; tone: 'ok' | 'alert' | 'neutral' }> = {
  impulsar: { texto: 'Impulsad', tone: 'ok' },
  esperar: { texto: 'Esperad', tone: 'neutral' },
  no_gastar: { texto: 'No gastéis', tone: 'alert' },
};

function Candidato({ c }: { c: CandidatoAnuncio }) {
  const d = DECISION[c.decision];
  return (
    <Card as="article" radius="m" className="grid gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone={d.tone}>{d.texto}</Chip>
        <Chip tone="acc">{ETIQUETA_FORMATO[c.formato]}</Chip>
        <Chip>{NOMBRE_RED[c.red]}</Chip>
        <span className="text-xs text-[var(--ink-2)]">{fechaCorta(c.fecha)}</span>
      </div>
      <h4 className="text-base font-semibold text-[var(--ink)]">{c.titulo}</h4>
      <p className="text-sm text-[var(--ink-2)]">{c.motivo}</p>
      {c.plan && (
        <>
          <dl className="grid gap-1.5 rounded-[var(--r-s)] bg-[var(--sunken)] p-3 text-sm">
            <div><dt className="text-xs text-[var(--ink-2)]">Qué pedirle al anuncio</dt><dd className="text-[var(--ink)]">{c.plan.objetivoTexto}</dd></div>
            <div><dt className="text-xs text-[var(--ink-2)]">Dónde</dt><dd className="text-[var(--ink)]">{c.plan.zona}</dd></div>
            <div><dt className="text-xs text-[var(--ink-2)]">A quién</dt><dd className="text-[var(--ink)]">{c.plan.publico}</dd></div>
            <div><dt className="text-xs text-[var(--ink-2)]">Cuánto</dt><dd className="font-medium text-[var(--ink)]">{c.plan.presupuestoDia} € al día durante {c.plan.dias} días ({c.plan.total} € en total)</dd></div>
          </dl>
          <details>
            <summary className="cursor-pointer text-sm font-medium text-[var(--acc-ink)]">Cómo hacerlo, paso a paso</summary>
            <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-sm text-[var(--ink)]">{c.plan.pasos.map((p) => <li key={p}>{p}</li>)}</ol>
          </details>
        </>
      )}
    </Card>
  );
}

/**
 * El especialista en anuncios: de lo que ya habéis publicado y medido, qué merece dinero y qué NO. Un
 * anuncio solo amplifica, así que se empuja lo que ya funciona o lo que gusta y no sale de casa, y
 * nunca lo que no se guarda. Importes, zona y duración son criterio propio de un presupuesto pequeño.
 */
export function ImpulsarPanel({ anuncios }: { anuncios: CandidatoAnuncio[] }) {
  return (
    <div className="grid gap-4">
      <p className="rounded-[var(--r-m)] bg-[var(--acc-soft)] p-4 text-sm text-[var(--acc-ink)]">
        Un anuncio solo amplifica. Empujad lo que ya funciona o lo que gusta y no sale de casa; pagar por lo que no se guarda es tirar el dinero.
      </p>
      {anuncios.length === 0 ? (
        <p className="text-sm text-[var(--ink-2)]">Cuando anotéis los números de vuestras últimas piezas (en la pestaña Resultados), os decimos cuáles merece la pena impulsar y cuáles no.</p>
      ) : (
        <div className="grid gap-3">{anuncios.map((c) => <Candidato key={`${c.fecha}-${c.tarjetaId}-${c.red}`} c={c} />)}</div>
      )}
      <p className="text-xs text-[var(--ink-2)]">Importes, zona y duración: criterio propio para un presupuesto pequeño. Ajustadlos a lo que podáis gastar.</p>
    </div>
  );
}
