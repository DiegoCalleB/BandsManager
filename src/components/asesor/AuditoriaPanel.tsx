import React from 'react';
import { Button, Card, Chip, Field, Textarea } from '../ui';
import { ETIQUETA_ORIGEN, NOMBRE_ESPECIALISTA, type Hallazgo } from '../../utils/asesor/auditoria';
import type { BiosPegadas, Presencia } from '../../utils/asesor/presencia';
import type { Red } from '../../utils/asesor/reglasFormato';
import { NOMBRE_RED } from './nombres';

const ESTADO = { ok: { texto: 'Bien', tone: 'ok' }, mejorar: { texto: 'Mejorar', tone: 'alert' }, sin_datos: { texto: 'Sin datos', tone: 'neutral' } } as const;
const IMPACTO = { 3: 'Impacto alto', 2: 'Impacto medio', 1: 'Impacto bajo' } as const;

function FilaHallazgo({ h }: { h: Hallazgo }) {
  const e = ESTADO[h.estado];
  return (
    <li className="grid gap-1 rounded-[var(--r-s)] bg-[var(--sunken)] p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone={e.tone}>{e.texto}</Chip>
        <span className="min-w-0 flex-1 text-sm font-medium text-[var(--ink)]">{h.titulo}</span>
      </div>
      <p className="text-sm text-[var(--ink-2)]">{h.detalle}</p>
      {h.arreglo && <p className="text-sm text-[var(--ink)]">{h.arreglo}</p>}
      <p className="text-xs text-[var(--ink-2)]">{ETIQUETA_ORIGEN(h.fuente)}</p>
    </li>
  );
}

interface Props {
  presencia: Presencia;
  bios: BiosPegadas;
  cargando: boolean;
  onBio: (red: Red, texto: string) => void;
  onRevisar: () => void;
}

/**
 * Lo que el equipo ve al revisar la presencia: primero las tres cosas que más mueven la aguja, luego
 * cada especialista con sus comprobaciones. Lo que no sabemos sale como «sin datos» y se pide.
 */
export function AuditoriaPanel({ presencia, bios, cargando, onBio, onRevisar }: Props) {
  const { auditoria, enlaces, instagram } = presencia;
  const { resumen, prioridades, especialistas } = auditoria;
  const redes = enlaces.porRed.map((e) => e.red);

  return (
    <div className="grid gap-5">
      <p className="text-sm text-[var(--ink-2)]" aria-live="polite">
        {resumen.ok + resumen.mejorar + resumen.sinDatos} comprobaciones: {resumen.ok} bien, {resumen.mejorar} por mejorar y {resumen.sinDatos} sin datos.
      </p>

      <section className="grid gap-2" aria-label="Lo primero que arreglar">
        <h3 className="text-sm font-medium text-[var(--ink)]">Lo primero que arreglar</h3>
        {prioridades.length === 0 ? (
          <p className="rounded-[var(--r-m)] bg-[var(--ok-soft)] p-4 text-sm text-[var(--ok)]">Nada urgente con lo que sabemos. Si pegáis vuestras bios, afinamos más.</p>
        ) : prioridades.map((h, i) => (
          <Card key={h.id} as="article" radius="m" className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium tabular-nums text-[var(--acc-ink)]">{i + 1}.</span>
              <Chip tone="acc">{NOMBRE_ESPECIALISTA[h.especialista]}</Chip>
              <Chip>{IMPACTO[h.impacto]}</Chip>
              <Chip>{h.esfuerzoMin} min</Chip>
            </div>
            <h4 className="text-base font-semibold text-[var(--ink)]">{h.titulo}</h4>
            <p className="text-sm text-[var(--ink-2)]">{h.detalle}</p>
            <p className="text-sm text-[var(--ink)]">{h.arreglo}</p>
            <p className="text-xs text-[var(--ink-2)]">{ETIQUETA_ORIGEN(h.fuente)}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-2" aria-label="Cada especialista">
        <h3 className="text-sm font-medium text-[var(--ink)]">Cada especialista</h3>
        {especialistas.map((e) => (
          <details key={e.id} className="rounded-[var(--r-m)] bg-[var(--surface)] p-3">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm font-medium text-[var(--ink)]">
              {e.nombre}
              <span className="text-xs font-normal text-[var(--ink-2)]">{e.ok} bien · {e.mejorar} mejorar · {e.sinDatos} sin datos</span>
            </summary>
            <ul className="mt-3 grid gap-2">{e.hallazgos.map((h) => <FilaHallazgo key={h.id} h={h} />)}</ul>
          </details>
        ))}
      </section>

      <fieldset className="grid gap-3 rounded-[var(--r-m)] bg-[var(--sunken)] p-4">
        <legend className="px-1 text-sm font-medium text-[var(--ink)]">Pega tus bios (opcional)</legend>
        <p className="text-xs text-[var(--ink-2)]">
          Así revisamos lo que de verdad pone en cada red. Se quedan solo en este navegador.
          {instagram.leido ? ' La de Instagram la hemos leído de vuestra cuenta; pega otra si queréis probar una nueva.' : ''}
        </p>
        {redes.map((red) => (
          <Field key={red} label={`Bio de ${NOMBRE_RED[red]}`}>
            <Textarea rows={2} maxLength={1200} value={bios[red] ?? ''} onChange={(ev) => onBio(red, ev.target.value)} />
          </Field>
        ))}
        <div><Button size="sm" variant="neutral" onClick={onRevisar} disabled={cargando}>{cargando ? 'Revisando…' : 'Revisar de nuevo'}</Button></div>
      </fieldset>
    </div>
  );
}
