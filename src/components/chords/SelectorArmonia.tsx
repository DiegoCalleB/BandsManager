import React from 'react';
import { NOMBRE_FUNCION, SENSACION_FUNCION, type Funcion } from '../../utils/teoriaArmonica';
import { CLASE_FUNCION, LETRA_FUNCION, type EstiloArmonia } from '../../utils/estiloArmonia';

interface Props {
  estilo: EstiloArmonia;
  onCambio: (e: EstiloArmonia) => void;
  /** Tonalidad y modo, para mostrarlos junto al selector («E mixolidio»). */
  resumen?: string;
  /** Funciones que aparecen en la canción: solo esas salen en la leyenda. */
  presentes: Funcion[];
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
export const SelectorArmonia: React.FC<Props> = ({ estilo, onCambio, resumen, presentes }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-sans" translate="no">
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
      </span>
    )}
  </div>
);
