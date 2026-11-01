import React from 'react';
import { Button, Card, Chip, EmptyState } from '../ui';
import { fechaCorta } from '../../utils/campanaConcierto';
import type { DiaAgenda, EventoAgenda } from '../../utils/asesor/agenda';
import { NOMBRE_FORMATO } from './nombres';

interface Props {
  agenda: DiaAgenda[];
  onHoy: () => void;
}

const LECTURA: Record<string, { texto: string; tone: 'ok' | 'alert' | 'neutral' }> = {
  funciona: { texto: 'Funcionó', tone: 'ok' },
  falla_valor: { texto: 'Se vio, no se guardó', tone: 'neutral' },
  falla_descubrimiento: { texto: 'Gustó, llegó poco', tone: 'neutral' },
  falla_todo: { texto: 'No arrancó', tone: 'alert' },
  sin_datos: { texto: 'Pocos datos', tone: 'neutral' },
  por_encima: { texto: 'Más de lo habitual', tone: 'ok' },
  en_su_linea: { texto: 'Como siempre', tone: 'neutral' },
  por_debajo: { texto: 'Menos de lo habitual', tone: 'neutral' },
  sin_comparar: { texto: 'Anotada', tone: 'neutral' },
  sin_medir: { texto: 'Sin medir', tone: 'neutral' },
};

function Evento({ e }: { e: EventoAgenda }) {
  if (e.tipo === 'hecha') {
    const l = LECTURA[e.lectura];
    return (
      <li className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--ink)]">
        <Chip tone="acc">{NOMBRE_FORMATO[e.formato]}</Chip>
        <span className="min-w-0 flex-1">{e.texto}</span>
        <Chip tone={l.tone}>{l.texto}</Chip>
      </li>
    );
  }
  return (
    <li className="grid gap-0.5 text-sm text-[var(--ink)]">
      <span className="flex flex-wrap items-center gap-1.5">
        <Chip tone={e.tipo === 'bolo' ? 'ok' : 'neutral'}>{e.tipo === 'bolo' ? 'Bolo' : e.tipo === 'lanzamiento' ? 'Estreno' : 'Campaña'}</Chip>
        <span className="min-w-0 flex-1 font-medium">{e.texto}</span>
      </span>
      {e.tipo === 'hito' && <span className="text-xs text-[var(--ink-2)]">{e.objetivo}</span>}
    </li>
  );
}

/**
 * Tres semanas en fila: la pasada (lo publicado, con cómo le fue) y las dos próximas (bolos, hitos
 * de su campaña y estrenos). Solo salen los días con algo; hoy siempre, para situarse. Lo que
 * toca publicar cada día lo propone la pestaña «Hoy», no se inventa aquí.
 */
export function AgendaAsesor({ agenda, onHoy }: Props) {
  const hayAlgo = agenda.some((d) => d.eventos.length > 0);
  if (!hayAlgo) {
    return (
      <EmptyState title="Calendario vacío, por ahora."
        description="Cuando haya un bolo, un estreno o publiquéis algo con el asesor, aparecerá aquí."
        action={<Button onClick={onHoy}>Ver qué toca hoy</Button>} />
    );
  }
  return (
    <section className="grid gap-3" aria-label="Calendario">
      <ol className="grid gap-3">
        {agenda.map((d) => (
          <li key={d.fecha}>
            <Card as="article" radius="m" className="grid gap-2" aria-current={d.esHoy ? 'date' : undefined}>
              <h3 className="flex items-center gap-2 text-sm font-semibold first-letter:uppercase text-[var(--ink)]">
                {fechaCorta(d.fecha)}
                {d.esHoy && <Chip tone="acc">Hoy</Chip>}
              </h3>
              {d.eventos.length > 0
                ? <ul className="grid gap-2">{d.eventos.map((e, i) => <Evento key={`${e.tipo}-${i}`} e={e} />)}</ul>
                : <p className="text-sm text-[var(--ink-2)]">Nada fijado. <button type="button" onClick={onHoy} className="font-medium text-[var(--acc-ink)] underline">Ver qué toca</button></p>}
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
