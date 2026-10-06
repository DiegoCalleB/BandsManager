import React, { useState } from 'react';
import { NOMBRE_FUNCION, SENSACION_FUNCION, type Funcion } from '../../utils/teoriaArmonica';
import { CLASE_FUNCION, LETRA_FUNCION, type EstiloArmonia } from '../../utils/estiloArmonia';

interface Props {
  estilo: EstiloArmonia;
  onCambio: (e: EstiloArmonia) => void;
  /** Tonalidad y modo, para mostrarlos junto al selector («E mixolidio»). */
  resumen?: string;
  /** Funciones que aparecen en la canción: solo esas salen en la leyenda. */
  presentes: Funcion[];
  /** Los acordes de la canción por función (nombre tal como se ve y grado), para explicar el color con ejemplos reales. */
  acordesPorFuncion?: Partial<Record<Funcion, Array<{ nombre: string; grado: string }>>>;
  /** Tonalidad tal como se ve («Mi mayor»), para decir respecto a qué se colorea. */
  nombreTonalidad?: string;
}

const Opcion = <T extends string>({ valor, actual, etiqueta, onElegir, titulo }: { valor: T; actual: T; etiqueta: string; onElegir: (v: T) => void; titulo?: string }) => (
  <button
    type="button"
    onClick={() => onElegir(valor)}
    title={titulo}
    aria-pressed={valor === actual}
    className={`px-2.5 py-1 rounded-[var(--r-pill)] text-xs cursor-pointer transition-ui ${
      valor === actual ? 'bg-[var(--surface)] text-[var(--ink)] font-bold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
    }`}
  >
    {etiqueta}
  </button>
);

/**
 * Selector de cómo se ven los acordes (nombre, grado romano o ambos; con o sin color por función) y
 * leyenda de las funciones presentes en la canción. El color nunca va solo: cada función lleva su letra.
 */
export const SelectorArmonia: React.FC<Props> = ({ estilo, onCambio, resumen, presentes, acordesPorFuncion, nombreTonalidad }) => {
  const [explicar, setExplicar] = useState(false);
  return (
  <div className="space-y-2" translate="no">
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-sans">
    {resumen && <span className="font-bold text-[var(--ink)]">{resumen}</span>}
    <span className="flex items-center gap-1 bg-[var(--sunken)] rounded-[var(--r-pill)] p-0.5" role="group" aria-label="Mostrar acordes como">
      <Opcion valor="nombre" actual={estilo.mostrar} etiqueta="Acorde" onElegir={(mostrar) => onCambio({ ...estilo, mostrar })} />
      <Opcion valor="grado" actual={estilo.mostrar} etiqueta="Grado" onElegir={(mostrar) => onCambio({ ...estilo, mostrar })} titulo="Números romanos: I, IV, V, bVII…" />
      <Opcion valor="ambos" actual={estilo.mostrar} etiqueta="Ambos" onElegir={(mostrar) => onCambio({ ...estilo, mostrar })} />
    </span>
    <span className="flex items-center gap-1 bg-[var(--sunken)] rounded-[var(--r-pill)] p-0.5" role="group" aria-label="Colorear acordes">
      <Opcion valor="funcion" actual={estilo.colorear} etiqueta="Color por función" onElegir={(colorear) => onCambio({ ...estilo, colorear })} titulo="Tónica, subdominante, dominante y color modal" />
      <Opcion valor="nada" actual={estilo.colorear} etiqueta="Sin color" onElegir={(colorear) => onCambio({ ...estilo, colorear })} />
    </span>
    {estilo.colorear === 'funcion' && presentes.length > 0 && (
      <span className="flex flex-wrap items-center gap-1.5" aria-label="Leyenda de funciones">
        {presentes.map((f) => (
          <span key={f} title={`${NOMBRE_FUNCION[f]}: ${SENSACION_FUNCION[f]}`} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] ${CLASE_FUNCION[f]}`}>
            <span className="font-bold">{LETRA_FUNCION[f]}</span>
            <span>{NOMBRE_FUNCION[f]}</span>
          </span>
        ))}
        <button type="button" onClick={() => setExplicar((v) => !v)} aria-expanded={explicar} className="text-[var(--acc-ink)] font-bold cursor-pointer hover:underline">
          {explicar ? 'Ocultar' : '¿Por qué estos colores?'}
        </button>
      </span>
    )}
  </div>
  {estilo.colorear === 'funcion' && explicar && (
    <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-3 space-y-2 text-xs font-sans text-[var(--ink)]" role="region" aria-label="Qué significan los colores">
      <p>
        El color <b className="font-bold">no depende del nombre del acorde, sino del lugar que ocupa en la tonalidad{nombreTonalidad ? ` (${nombreTonalidad})` : ''}</b>: cuenta a cuántos pasos de la tónica está y qué hace ahí.
        Si cambias la tonalidad de la ficha, cambian los colores; si transpones la vista, no.
      </p>
      <ul className="space-y-1.5">
        {presentes.map((f) => (
          <li key={f} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] ${CLASE_FUNCION[f]}`}>
              <span className="font-bold">{LETRA_FUNCION[f]}</span><span>{NOMBRE_FUNCION[f]}</span>
            </span>
            <span className="text-[var(--ink-2)]">{SENSACION_FUNCION[f]}.</span>
            {acordesPorFuncion?.[f]?.length ? (
              <span>En esta canción: {acordesPorFuncion[f]!.map((a) => `${a.nombre} (${a.grado})`).join(', ')}.</span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-[var(--ink-2)]">En el ordenador, pasa el ratón por un acorde para ver por qué tiene su color; en cualquier dispositivo, la pestaña «Armonía» lo explica acorde por acorde. «Grado» es el número romano: mayúscula = acorde mayor, minúscula = menor, «b» = bajado medio tono.</p>
    </div>
  )}
  </div>
  );
};
