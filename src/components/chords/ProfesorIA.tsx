import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import type { AnalisisAcordes } from '../../types';
import { Button } from '../ui/Button';

type Profesor = NonNullable<AnalisisAcordes['profesor']>;

interface Props {
  profesor?: Profesor;
  /** Pide la explicación al servidor; devuelve el profesor guardado o lanza con el motivo. */
  onPedir: (opciones: { nivel: Profesor['nivel']; instrumento: Profesor['instrumento']; forzar: boolean }) => Promise<Profesor>;
}

const NIVELES: Array<[Profesor['nivel'], string]> = [['principiante', 'Principiante'], ['intermedio', 'Intermedio'], ['avanzado', 'Avanzado']];
const INSTRUMENTOS: Array<[Profesor['instrumento'], string]> = [['guitarra', 'Guitarra'], ['bajo', 'Bajo'], ['teclado', 'Teclado'], ['voz', 'Voz'], ['bateria', 'Batería']];

const Lista: React.FC<{ titulo: string; items: string[]; idea?: boolean }> = ({ titulo, items, idea }) =>
  items.length === 0 ? null : (
    <div className="space-y-1.5">
      <h4 className="font-bold text-[var(--ink)] flex items-center gap-2">
        {titulo}
        {idea && <span className="px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc-soft)] text-[var(--acc-ink)] text-xs font-bold">Idea</span>}
      </h4>
      <ul className="space-y-1.5">
        {items.map((t, i) => <li key={i} className="bg-[var(--sunken)] rounded-[var(--r-m)] p-3 text-[var(--ink)]">{t}</li>)}
      </ul>
    </div>
  );

/**
 * El «profesor» con IA: redacta lo que el código ya sabe de la canción. Bajo demanda (no gasta nada
 * hasta que se pide) y avisa de qué es dato y qué es sugerencia.
 */
export const ProfesorIA: React.FC<Props> = ({ profesor, onPedir }) => {
  const [nivel, setNivel] = useState<Profesor['nivel']>(profesor?.nivel ?? 'intermedio');
  const [instrumento, setInstrumento] = useState<Profesor['instrumento']>(profesor?.instrumento ?? 'guitarra');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pedir = async (forzar: boolean) => {
    setCargando(true);
    setError(null);
    try {
      await onPedir({ nivel, instrumento, forzar });
    } catch (e: any) {
      setError(String(e?.message || e || 'No se pudo generar la explicación.'));
    } finally {
      setCargando(false);
    }
  };

  const e = profesor?.explicacion;
  return (
    <section className="space-y-3" aria-label="El profesor">
      <h3 className="font-bold text-[var(--ink)] flex items-center gap-2"><GraduationCap className="w-4 h-4" /> El profesor</h3>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1 text-[var(--ink-2)]">Nivel
          <select value={nivel} onChange={(ev) => setNivel(ev.target.value as Profesor['nivel'])} className="bg-[var(--sunken)] text-[var(--ink)] rounded-[var(--r-pill)] px-2 py-1">
            {NIVELES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1 text-[var(--ink-2)]">Instrumento
          <select value={instrumento} onChange={(ev) => setInstrumento(ev.target.value as Profesor['instrumento'])} className="bg-[var(--sunken)] text-[var(--ink)] rounded-[var(--r-pill)] px-2 py-1">
            {INSTRUMENTOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
        </label>
        <Button type="button" size="xs" variant="primary" disabled={cargando} onClick={() => pedir(Boolean(profesor))}>
          {cargando ? 'Pensando…' : profesor ? 'Volver a explicar' : 'Pedir la explicación del profesor'}
        </Button>
      </div>
      {error && <p role="alert" className="text-xs text-[var(--alert)]">{error}</p>}
      {!e && !cargando && (
        <p className="text-xs text-[var(--ink-2)]">
          La IA redacta lo de arriba con palabras de profesor y propone ideas para improvisar, componer y dar dinamismo al tema. No tiene acceso a la canción, solo a los datos calculados, y lo que no se puede comprobar con ellos se descarta.
        </p>
      )}
      {e && (
        <div className="space-y-3 text-sm">
          {e.resumen && <p className="text-[var(--ink)] bg-[var(--sunken)] rounded-[var(--r-m)] p-3">{e.resumen}</p>}
          {e.comoFunciona.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--ink)]">Cómo funciona</h4>
              <ul className="space-y-1.5">
                {e.comoFunciona.map((c, i) => <li key={i} className="bg-[var(--sunken)] rounded-[var(--r-m)] p-3 text-[var(--ink)]">{c.texto}</li>)}
              </ul>
            </div>
          )}
          <Lista titulo="Para improvisar" items={e.paraImprovisar} idea />
          <Lista titulo="Para componer" items={e.paraComponer} idea />
          {e.dinamismo.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--ink)] flex items-center gap-2">
                Para darle dinamismo
                <span className="px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc-soft)] text-[var(--acc-ink)] text-xs font-bold">Idea</span>
              </h4>
              <ul className="space-y-1.5">
                {e.dinamismo.map((d, i) => (
                  <li key={i} className="bg-[var(--sunken)] rounded-[var(--r-m)] p-3 text-[var(--ink)]">
                    <b className="font-bold">{d.idea}</b>{d.ejemplo ? <span className="text-[var(--ink-2)]"> — {d.ejemplo}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-[var(--ink-2)]">
            Redactado por IA para nivel {profesor!.nivel} ({profesor!.instrumento}). Lo marcado «Idea» son sugerencias, no datos de la canción.
            {profesor!.descartadas > 0 ? ` Se descartaron ${profesor!.descartadas} frase${profesor!.descartadas === 1 ? '' : 's'} que no se podían comprobar con los datos.` : ''}
          </p>
        </div>
      )}
    </section>
  );
};
